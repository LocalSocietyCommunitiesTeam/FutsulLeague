/** APIテスト **/
// GASのウェブアプリURL
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby_vM_PbaL0OJjbvqPUzM7zrRQR7Zaxf3T9z8r2s1vlTMTTaxPXYZpFuRdLihniV0Nocg/exec';

var teamId = '101';

// チームリストを取得
async function getTeamList(teamId) {
    console.log('async function getTeamList(teamId)');
    // クエリパラメータを付与したURLを作成
    const params = new URLSearchParams({
        action: "getMembers",
        teamId: teamId
    });

    const newUrl = `${WEB_APP_URL}?${params.toString()}`;

    try {
        console.log('try');
        // GASエンドポイントへのGETリクエスト
        const response = await fetch(newUrl);

        // HTTPステータスコードをチェック
        if (!response.ok) {
            // エラーを表示
            showError(`HTTPエラー! ステータス: ${response.status}`);
        }

        // レスポンスボディをJSONとしてパース
        const data = await response.json();
        console.log('data');
        console.log(data);

        return data;
    } catch (error) {
        console.log('catch');
        showError(`データ取得中にエラーが発生しました:${error}`);
    }
}

function showError(text) {
    console.log(text);
    const error = document.getElementById('error');
    error.innerText = text;
    error.parentElement.classList.add('errorFlg');
}

window.addEventListener('DOMContentLoaded', function () {
    const getTeamListBtn = document.getElementById('getTeamListBtn');

    getTeamListBtn.addEventListener('click', async function () {
        const teamIdInput = document.getElementById('teamId');
        const teamName = document.getElementById('teamName');
        const memberList = document.getElementById('memberList');
        const error = document.getElementById('error');

        const teamId = teamIdInput.value;
        error.innerText = 'エラーはありません';
        error.parentElement.classList.remove('errorFlg');

        // 表示を初期化
        teamName.innerText = '';
        memberList.innerHTML = '';

        let data;

        data = await getTeamList(teamId);
        teamName.innerText = data.teamName;

        if (data.teamName == null) {
            showError('チームが未登録です');
        } else {
            if (data.member.length == 0) {
                showError('メンバーが未登録です');
            } else {
                for (let i = 0; i < data.member.length; i++) {
                    const li = document.createElement('li');
                    const p = document.createElement('p');
                    p.classList.add('c_typo_bodyM', 'c_typo_BLK01');
                    p.innerText = `${data.member[i].shokuinNum}: ${data.member[i].shokuinName}`;
                    li.appendChild(p);
                    memberList.appendChild(li);
                }
            }
        }
    });
});