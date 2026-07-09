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
