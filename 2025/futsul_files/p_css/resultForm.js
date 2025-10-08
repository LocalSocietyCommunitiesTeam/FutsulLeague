/** 試合結果入力 **/
window.addEventListener('DOMContentLoaded', function () {
    // 戻るボタン押下時
    if (document.getElementById('back-to-list')) {
        const backBtn = document.getElementById('back-to-list');

        backBtn.addEventListener('click', function () {
            history.back();
        });
    }

    // キャンセルボタン押下時
    if (document.getElementById('cancel-entry')) {
        const backBtn = document.getElementById('cancel-entry');

        backBtn.addEventListener('click', function () {
            history.back();
        });
    }
});