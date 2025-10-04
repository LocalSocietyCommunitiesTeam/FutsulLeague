/** APIテスト **/
// GASのウェブアプリURL
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby_vM_PbaL0OJjbvqPUzM7zrRQR7Zaxf3T9z8r2s1vlTMTTaxPXYZpFuRdLihniV0Nocg/exec';

var teamId = '101';

// チームリストを取得
async function getTeamList(teamId) {
    // クエリパラメータを付与したURLを作成
    const params = new URLSearchParams({
        action: "getMembers",
        teamId: teamId
    });

    const newUrl = `${WEB_APP_URL}?${params.toString()}`;

    try {
        // GASエンドポイントへのGETリクエスト
        const response = await fetch(newUrl);

        // HTTPステータスコードをチェック
        if (!response.ok) {
            // エラーを表示
            showError(`HTTPエラー! ステータス: ${response.status}`);
        }

        // レスポンスボディをJSONとしてパース
        const data = await response.json();

        // 受け取ったデータを処理
        console.log('data:');
        console.log(data);
        document.getElementById('output').innerText = data;
    } catch (error) {
        showError(`データ取得中にエラーが発生しました:${error}`);
    }
}

function showError(text) {
    console.log(text);
    const error = document.getElementById('error');
    error.innerText = text;
}

window.addEventListener('DOMContentLoaded', function () {
    const getTeamListBtn = document.getElementById('getTeamListBtn');

    getTeamListBtn.addEventListener('click', function () {
        getTeamList(teamId);
    });
});