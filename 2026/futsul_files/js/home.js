/** ホーム画面 **/
document.addEventListener('DOMContentLoaded', function () {
    loadChampionship();
});

/** 大会データ取得処理 **/
async function loadChampionship() {
    // URLの末尾にパラメータを付与
    const requestUrl = `${GAS_WEB_APP_URL}?action=getChampionship`;

    try {
        // GETリクエストを送信（methodの指定がない場合は自動的にGETになります）
        const response = await fetch(requestUrl);
        const result = await response.json();

        if (result.success === true) {
            console.log("大会データの取得に成功しました:", result.data);

            // 💡 ここで取得したデータを画面に表示する処理を行います

        } else {
            console.error("データの取得に失敗しました:", result.message);
            alert("データが取得できませんでした: " + result.message);
        }

    } catch (error) {
        console.error("通信エラーが発生しました:", error);
        alert("サーバーとの通信に失敗しました。");
    }
}
