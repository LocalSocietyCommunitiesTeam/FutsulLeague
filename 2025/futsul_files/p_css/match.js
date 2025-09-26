/** 対戦表 **/
window.addEventListener('DOMContentLoaded', function () {
    const leagueNum = document.getElementById('mat_leagueNum');

    // 画面読込時にチーム名が改行されている場合、フォントサイズを小さくする処理
    window.addEventListener('load', function () {
        const matchInfo = document.getElementsByClassName('mat_matchCard_matchInfo');

        for (let i = 0; i < matchInfo.length; i++) {
            for (let j = 0; j < matchInfo[i].children.length; j++) {
                if (j == 0 || j == matchInfo[i].children.length - 1) {
                    if (matchInfo[i].children.item(j).offsetHeight != window.getComputedStyle(matchInfo[i].children.item(j)).getPropertyValue('line-height').replace('px', '')) {
                        matchInfo[i].children.item(j).classList.remove('c_typo_bodyL');
                        matchInfo[i].children.item(j).classList.add('c_typo_bodyM');
                    }
                }
            }
        }
    });

    // リーグ回を入力
    leagueNum.innerText = LEAGUE_NUMBER;
});