/** 画面共通 **/
var LEAGUE_NUMBER = 2;

window.addEventListener('DOMContentLoaded', function () {
    const reloadBtn = document.getElementById('com_reloadBtn');

    // 更新ボタンを押下
    reloadBtn.addEventListener('click', function () {
        location.reload();
    });
});