/** メンバー登録 **/
window.addEventListener('DOMContentLoaded', function() {
    if (getQuery('type') == 'edit') {
        console.log('編集モード');
        const title = document.getElementById('mer_title');
        const exp = document.getElementById('mer_exp');
        title.innerText = '編集';
        exp.innerText = '参加メンバーを編集してください。';
    }
});