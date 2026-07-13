/** 対戦表画面 */
/** 全体のデータ保持用オブジェクト */
let globalMatchData = [];

const urlParams = new URLSearchParams(window.location.search);
const compeId = urlParams.get('compeId');

if (!compeId) {
    alert("大会IDが指定されていません。ホーム画面から入り直してください。");
    window.location.href = "./home.html";
}

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const compeId = urlParams.get('compeId');

    if (!compeId) {
        alert("大会IDが指定されていません。ホーム画面から入り直してください。");
        return;
    }

    loadMatchData(compeId);

    // チーム選択プルダウンの変更イベント
    document.getElementById('mtc_pulldown').addEventListener('change', function (e) {
        filterAndDisplayMatches(e.target.value); // 💡 選択された teamId でフィルタリングを実行
    });
});

/** GASから対戦データおよびチームデータを取得 */
async function loadMatchData(compeId) {
    if (typeof showLoader === 'function') showLoader();

    const matchUrl = `${GAS_WEB_APP_URL}?action=getMatchList&tournamentId=${compeId}`;

    try {
        const matchRes = await fetch(matchUrl).then(res => res.json());

        if (matchRes.success && matchRes.data) {
            // 1. プルダウンの構築（GASから受け取ったオブジェクト配列を渡す）
            buildTeamPulldown(matchRes.data.teams);

            // 2. 対戦表カードの描画
            globalMatchData = matchRes.data.matches;
            filterAndDisplayMatches("");
        } else {
            alert("対戦表データの取得に失敗しました: " + matchRes.message);
        }

    } catch (error) {
        console.error("通信エラー:", error);
        alert("サーバーとの通信に失敗しました。");
    } finally {
        if (typeof closeLoader === 'function') closeLoader();
    }
}

/** チーム選択プルダウンの動的生成 */
function buildTeamPulldown(teams) {
    const pulldown = document.getElementById('mtc_pulldown');

    pulldown.innerHTML = '<option value="">すべてのチーム</option>';

    if (!teams || teams.length === 0) return;

    for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        if (!team.teamId) continue;

        const opt = document.createElement('option');

        // 💡 value属性に teamId を、表示テキストにチーム名（正式名称）を割り当てる
        opt.value = team.teamId;
        opt.textContent = team.teamName;

        pulldown.appendChild(opt);
    }
}

/** 選択されたチームに基づいて対戦表をフィルタリング＆描画 */
function filterAndDisplayMatches(selectedTeamId) {
    const cardList = document.getElementById('mtc_cardList');
    cardList.innerHTML = ""; // 画面クリア

    if (!globalMatchData || globalMatchData.length === 0) {
        cardList.innerHTML = `<li class="mtc_noData"><p class="c_typo_bodyS c_typo_BLK8 c_typo_align_center">現在、対戦カードが組まれていません</p></li>`;
        return;
    }

    // 試合番号（matchNum）ごとにデータをグループ化
    const groupedMatches = {};
    for (let i = 0; i < globalMatchData.length; i++) {
        const match = globalMatchData[i];

        // 💡 チーム名比較から、GAS側で追加した「teamAId / teamBId」を用いたIDでの厳密な比較処理へ変更
        if (selectedTeamId && match.teamAId !== selectedTeamId && match.teamBId !== selectedTeamId) {
            continue;
        }

        if (!groupedMatches[match.matchNum]) {
            groupedMatches[match.matchNum] = [];
        }
        groupedMatches[match.matchNum].push(match);
    }

    // グループ化されたデータを元にHTMLを生成
    let hasVisibleMatch = false;
    for (const matchNum in groupedMatches) {
        const matchesInNum = groupedMatches[matchNum];
        if (matchesInNum.length === 0) continue;

        hasVisibleMatch = true;
        const firstMatch = matchesInNum[0];
        const timeRangeStr = firstMatch.timeRange ? `（${firstMatch.timeRange}）` : '';

        let matchCardsHtml = "";
        for (let i = 0; i < matchesInNum.length; i++) {
            const match = matchesInNum[i];
            let tagClass = "c_tag01_neutral";
            if (match.status === "試合中") tagClass = "c_tag01_info";
            if (match.status === "未開始") tagClass = "c_tag01_warning";

            matchCardsHtml += `
                <a href="./matchDetail.html?matchId=${match.matchId}" class="mtc_detailCard">
                    <div class="mtc_detailCard_head">
                        <p class="c_typo_headerXS c_typo_BLK10"><span class="mtc_court">${match.court}</span></p>
                        <div class="c_tag01">
                            <div class="c_tag01_wrap c_tag01_h24 ${tagClass}">
                                <p class="c_typo_headerXXS c_typo_BLK01">${match.status}</p>
                            </div>
                        </div>
                    </div>
                    <div class="mtc_detailCard_bottom">
                        <div class="mtc_detailCard_left">
                            <p class="c_typo_headerXXS c_typo_BLK01 c_typo_align_center">${match.teamAName}</p>
                            <p class="c_typo_headerXL c_typo_GRN10 c_typo_align_center">${match.status === '未開始' ? '-' : match.teamAScore}</p>
                        </div>
                        <p class="c_typo_bodyS c_typo_BLK01">VS</p>
                        <div class="mtc_detailCard_right">
                            <p class="c_typo_headerXXS c_typo_BLK01 c_typo_align_center">${match.teamBName}</p>
                            <p class="c_typo_headerXL c_typo_GRN10 c_typo_align_center">${match.status === '未開始' ? '-' : match.teamBScore}</p>
                        </div>
                    </div>
                </a>`;
        }

        const li = document.createElement('li');
        li.innerHTML = `
            <p class="c_typo_headerS c_typo_BLK10">第${matchNum}試合${timeRangeStr}</p>
            ${matchCardsHtml}
        `;
        cardList.appendChild(li);
    }

    if (!hasVisibleMatch) {
        cardList.innerHTML = `<li class="mtc_noData"><p class="c_typo_bodyM c_typo_BLK8 c_typo_align_center">対象の試合がありません</p></li>`;
    }
}