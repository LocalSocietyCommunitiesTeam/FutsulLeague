/** ホーム画面 **/
document.addEventListener('DOMContentLoaded', function () {
    showLoader();
    loadChampionship(THISTERM);

    displayThisTerm();
});

/** 大会データ取得処理 **/
// 引数（targetYear）を何も渡さなければ全量になります
async function loadChampionship(targetYear) {
    // 基本のURLパラメータ
    let requestUrl = `${GAS_WEB_APP_URL}?action=getChampionship`;

    // 💡 もし引数に年（2026など）が渡されていたら、URLの末尾にさらに追加する
    if (targetYear) {
        requestUrl += `&year=${targetYear}`;
    }

    try {
        const response = await fetch(requestUrl);
        const result = await response.json();

        if (result.success === true) {
            console.log("取得データ:", result.data);
            // 画面に描画する処理など
            displayChampionshipData(result.data);
        } else {
            alert("エラー: " + result.message);
        }
    } catch (error) {
        console.error("通信エラー:", error);
    } finally {
        closeLoader();
    }
}

function displayThisTerm() {
    const thisTerm = document.getElementById('hm_thisTerm');
    thisTerm.innerText = THISTERM;
}

function displayChampionshipData(data) {
    const compeList = document.getElementById('hm_compeList');
    compeList.innerHTML = '';

    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        // 💡 日付が未定かどうかのフラグ判定
        const isUndecided = !item.date || item.date.trim() === "" || item.date.includes("未定");

        // 未定の場合はスタイルクラスを適用し、リンクを無効化、日付テキストを「未定」に置き換える
        const cardClass = isUndecided ? "hm_compeCard is-disabled" : "hm_compeCard";
        const linkUrl = isUndecided ? "#" : `./match.html?compeId=${item.id}`;
        const displayDate = isUndecided ? "未定" : item.date;

        compeList.innerHTML += `<li><a href="${linkUrl}" class="${cardClass}">
    <div class="hm_compeCard_left">
        <p class="c_typo_headerS c_typo_BLK10">${item.name}</p>
        <p class="c_typo_bodyXS c_typo_BLK8">📅 ${displayDate}</p>
    </div>
    <div class="hm_compeCard_right">
        <p class="c_typo_bodyS c_typo_BLK10">${item.status}</p>
    </div>
</a></li>`;
    }
}