/** 画面共通 **/
var LEAGUE_NUMBER = 2;

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