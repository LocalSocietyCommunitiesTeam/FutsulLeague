/** 画面共通 **/
// デプロイしたGASの「WebアプリのURL」
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyL9doo1-8WbbskTZVy_bnlrXHzIZRd3LDXTDj5QnVG53sdndOGvvRRjycpzLmoCZv35Q/exec";

function getThisTerm() {
    let now = new Date();
    if (now.getMonth() >= 4) {
        return now.getFullYear();
    } else {
        return now.getFullYear() - 1;
    }
}

var THISTERM = getThisTerm();

function showLoader() {
    const loader = document.getElementById('com_loader');
    loader.classList.add('com_loader_isShow');
}

// 💡 追加：ローダーを非表示にする関数
function closeLoader() {
    const loader = document.getElementById('com_loader');

    // クラスを削除することで、ローダーが非表示になり、CSSの:has効果でスクロール禁止も解除されます
    loader.classList.remove('com_loader_isShow');
}

/** 共通処理：下部ナビゲーションのリンクに compeId を付与する */
document.addEventListener('DOMContentLoaded', function () {
    // 1. 現在のURLから compeId が取得できれば localStorage に保存（更新）する
    const urlParams = new URLSearchParams(window.location.search);
    const currentCompeId = urlParams.get('compeId');
    if (currentCompeId) {
        localStorage.setItem('selectedCompeId', currentCompeId);
    }

    // 2. localStorage から保存されている compeId を取得
    const savedCompeId = localStorage.getItem('selectedCompeId');

    // 3. ナビゲーション内の「対戦表」「メンバー管理」「ランキング」などのリンクを書き換える
    // ※今回は対戦表だけでなく、他の画面にいった時も大会IDを引き継げるように対応します
    const navLinks = document.querySelectorAll('.com_nav_btnList a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');

        // ホーム画面以外のリンクかつ、まだパラメータが付いていない場合に付与
        if (href && !href.includes('home.html') && !href.includes('compeId=')) {
            if (savedCompeId) {
                // すでに ? があれば & で、なければ ? で繋ぐ
                const separator = href.includes('?') ? '&' : '?';
                link.setAttribute('href', `${href}${separator}compeId=${savedCompeId}`);
            } else {
                // まだ大会が選ばれていない場合は、クリック時にホームへ誘導するイベントを仕込む
                link.addEventListener('click', function (e) {
                    // 自身が「無効化クラス」を持っていない場合のみアラート
                    if (!link.classList.includes('com_nav_disactive')) {
                        e.preventDefault();
                        alert("大会が選択されていません。ホーム画面から大会を選択してください。");
                        window.location.href = "./home.html";
                    }
                });
            }
        }
    });
});
