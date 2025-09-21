/** 対戦表 **/
document.addEventListener('DOMContentLoaded', function () {
    const leagueNum = document.getElementById('mat_leagueNum');
    const reloadBtn = document.getElementById('mat_reloadBtn');

    // リーグ回を入力
    leagueNum.innerText = LEAGUE_NUMBER;

    // 更新ボタンを押下
    reloadBtn.addEventListener('click', function () {
        location.reload();
    });
});