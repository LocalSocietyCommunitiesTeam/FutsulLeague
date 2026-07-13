/** 对戦表画面 */
/** 全体のデータ保持用オブジェクト */
let globalMatchData = [];

const urlParams = new URLSearchParams(window.location.search);
const compeId = urlParams.get('compeId');

if (!compeId) {
    alert("大会IDが指定されていません。ホーム画面から入り直してください。");
    window.location.href = "./home.html"; // ホームに戻す処理にしておくとより親切
    return;
}

document.addEventListener('DOMContentLoaded', function () {
    // URLからパラメータ「compeId」を取得
    const urlParams = new URLSearchParams(window.location.search);
    const compeId = urlParams.get('compeId');

    if (!compeId) {
        alert("大会IDが指定されていません。ホーム画面から入り直してください。");
        return;
    }

    // データの読み込み開始
    loadMatchData(compeId);

    // チーム選択プルダウンの変更イベント
    document.getElementById('mtc_pulldown').addEventListener('change', function (e) {
        filterAndDisplayMatches(e.target.value);
    });
});

/** GASから対戦データおよびチームデータを取得 */
async function loadMatchData(compeId) {
    if (typeof showLoader === 'function') showLoader();

    // 💡 チーム一覧（メンバーマスタ）と対戦表のAPIリクエストURLを準備
    const teamUrl = `${GAS_WEB_APP_URL}?action=getMembers&tournamentId=${compeId}`;
    const matchUrl = `${GAS_WEB_APP_URL}?action=getMatchList&tournamentId=${compeId}`;

    try {
        // 並行して両方のデータを取得（表示速度の高速化）
        const [teamRes, matchRes] = await Promise.all([
            fetch(teamUrl).then(res => res.json()),
            fetch(matchUrl).then(res => res.json())
        ]);

        // 1. プルダウンの構築（メンバーシートに存在するチームを確実に回す）
        if (teamRes.success && teamRes.data) {
            // 💡 修正：略称、正式名称、チームIDを含むオブジェクトの配列としてマッピング
            const teamObjects = teamRes.data.map(t => ({
                teamId: t.teamId,
                teamName: t.teamName,
                teamNameAbbreviation: t.teamNameAbbreviation || t.teamName // 略称がなければ正式名称
            }));
            buildTeamPulldown(teamObjects);
        } else {
            console.warn("チームデータの取得に失敗したため、対戦表側からの抽出を試みます。");
            if (matchRes.success && matchRes.data) {
                // 对戦表側からのバックアップ抽出時は略称が取れないため正式名称を兼用
                const fallbackTeams = matchRes.data.teams.map(name => ({
                    teamId: "",
                    teamName: name,
                    teamNameAbbreviation: name
                }));
                buildTeamPulldown(fallbackTeams);
            }
        }

        // 2. 对戦表カードの描画
        if (matchRes.success && matchRes.data) {
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

    // 「すべてのチーム」以外を一旦クリア（重複防止）
    pulldown.innerHTML = '<option value="">すべてのチーム</option>';

    if (!teams || teams.length === 0) return;

    // 重複排除のためのMap（キーを対戦表の表記に合わせるため略称にする）
    const uniqueTeamMap = new Map();
    for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
        const key = t.teamNameAbbreviation || t.teamName;
        if (key && !uniqueTeamMap.has(key)) {
            uniqueTeamMap.set(key, t);
        }
    }

    const uniqueTeamsArray = Array.from(uniqueTeamMap.values());
    for (let i = 0; i < uniqueTeamsArray.length; i++) {
        const team = uniqueTeamsArray[i];
        const opt = document.createElement('option');
        
        // 💡 修正：対戦表側の「teamAName/teamBName」には『略称』が入っているため、
        // フィルタリングで正しく合致するよう、valueにも一貫して『略称』をセットします。
        const targetName = team.teamNameAbbreviation || team.teamName;
        opt.value = targetName; 
        opt.textContent = targetName; // 画面の表示テキストも略称
        
        if (team.teamId) {
            opt.setAttribute('data-team-id', team.teamId); // 必要に応じてteamIdをカスタム属性として保持
        }
        pulldown.appendChild(opt);
    }
}

/** 選択されたチームに基づいて対戦表をフィルタリング＆描画 */
function filterAndDisplayMatches(selectedTeam) {
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
        
        // 💡 selectedTeamに「略称」が入るようになったため、対戦表データ（match.teamAName/BName）と正確に文字列比較ができるようになりました
        if (selectedTeam && match.teamAName !== selectedTeam && match.teamBName !== selectedTeam) {
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

        // HTML出力（第X試合 ＋ スプレッドシート関数の時間枠）
        const li = document.createElement('li');
        li.innerHTML = `
            <p class="c_typo_headerS c_typo_BLK10">第${matchNum}試合${timeRangeStr}</p>
            ${matchCardsHtml}
        `;
        cardList.appendChild(li);
    }

    // 表示すべき試合が1件もない場合のメッセージ判定
    if (!hasVisibleMatch) {
        cardList.innerHTML = `<li class="mtc_noData"><p class="c_typo_bodyM c_typo_BLK8 c_typo_align_center">対象の試合がありません</p></li>`;
    }
}
