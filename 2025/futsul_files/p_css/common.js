/** 画面共通 **/
var LEAGUE_NUMBER = 2;

// クエリストリングのvalueを取得する関数
function getQuery(key) {
    const params = new URLSearchParams(window.location.search);
    const values = params.getAll(key);
    if (values.length === 0) {
        return null;
    } else if (values.length === 1) {
        return values[0];
    } else {
        return values;
    }
}

window.addEventListener('DOMContentLoaded', function () {
    // 更新ボタン押下時の処理
    if (document.getElementById('com_reloadBtn')) {
        const reloadBtn = document.getElementById('com_reloadBtn');

        // 更新ボタンを押下に画面をリロード
        reloadBtn.addEventListener('click', function () {
            location.reload();
        });
    }
});