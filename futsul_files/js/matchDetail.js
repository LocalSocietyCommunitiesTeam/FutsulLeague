/** 試合詳細画面 */
let currentMatchData = null;
const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('matchId');
const compeId = sessionStorage.getItem('currentCompeId') || "103";

document.addEventListener('DOMContentLoaded', function () {
    if (!matchId) {
        alert("試合IDが指定されていません。");
        window.location.href = "./match.html";
        return;
    }

    loadMatchDetail();

    // モード切り替えイベント
    document.getElementById('mdt_toEditBtn').addEventListener('click', toggleEditMode);
    document.getElementById('mdt_cancelBtn').addEventListener('click', toggleViewMode);

    // 💡 保存ボタン（divタグ構造維持）のクリックイベントでFormを送信させる
    const saveBtn = document.getElementById('mdt_saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function () {
            document.getElementById('mdt_editForm').requestSubmit();
        });
    }

    // 💡 入力対象チームの切り替えイベント
    document.getElementById('mdt_selectTargetSide').addEventListener('change', function () {
        handleTargetSideChange(this.value);
    });

    // 💡 得点者動的追加イベント
    document.getElementById('mdt_addScorerBtn').addEventListener('click', function () {
        const side = document.getElementById('mdt_selectTargetSide').value;
        const members = (side === 'A') ? currentMatchData.teamAMembers : currentMatchData.teamBMembers;
        addScorerRow('mdt_target_scorer_list', members);
    });

    // 編集フォームの送信
    document.getElementById('mdt_editForm').addEventListener('submit', handleFormSubmit);
});

/** GASから試合情報を取得 */
async function loadMatchDetail() {
    if (typeof showLoader === 'function') showLoader();
    const matchUrl = `${GAS_WEB_APP_URL}?action=getMatchList&tournamentId=${compeId}`;

    try {
        const res = await fetch(matchUrl).then(res => res.json());
        if (res.success && res.data && res.data.matches) {
            currentMatchData = res.data.matches.find(m => String(m.matchId).trim() === String(matchId).trim());
            if (currentMatchData) {
                renderMatchDetail(currentMatchData);
            } else {
                alert("該当する試合データがありません。");
                window.location.href = "./match.html";
                return;
            }
        }
    } catch (error) {
        console.error("通信エラー:", error);
        alert("データの取得に失敗しました。");
    } finally {
        if (typeof closeLoader === 'function') closeLoader();
    }
}

/** 画面描画 */
function renderMatchDetail(match) {
    // 閲覧用データの反映
    document.getElementById('mdt_court').textContent = match.court || '-';
    document.getElementById('mdt_status').textContent = match.status || '-';
    document.getElementById('mdt_matchNum').textContent = match.matchNum ? `第 ${match.matchNum} 試合` : '-';
    document.getElementById('mdt_time').textContent = match.timeRange ? `（${match.timeRange}）` : '';

    const teamA = match.teamAName || match.homeTeamName || '-';
    const teamB = match.teamBName || match.awayTeamName || '-';

    document.getElementById('mdt_teamA').textContent = teamA;
    document.getElementById('mdt_teamB').textContent = teamB;

    const isUnstarted = (match.status === '未開始');
    document.getElementById('mdt_scoreA').textContent = isUnstarted ? '-' : match.teamAScore;
    document.getElementById('mdt_scoreB').textContent = isUnstarted ? '-' : match.teamBScore;

    // 得点者の反映
    document.getElementById('mdt_scorersA').textContent = match.teamAScorers || 'なし';
    document.getElementById('mdt_scorersB').textContent = match.teamBScorers || 'なし';

    // ステータスタグ配色
    const tagWrap = document.getElementById('mdt_status_tag');
    tagWrap.className = "c_tag01_wrap c_tag01_h24";
    if (match.status === "試合中") tagWrap.classList.add("c_tag01_info");
    else if (match.status === "未開始") tagWrap.classList.add("c_tag01_warning");
    else tagWrap.classList.add("c_tag01_neutral");

    // 編集フォームのセレクトボックス選択肢テキストをチーム名に変更
    const selectSide = document.getElementById('mdt_selectTargetSide');
    selectSide.options[0].textContent = `ホーム：${teamA}`;
    selectSide.options[1].textContent = `アウェイ：${teamB}`;

    // 編集フォーム初期値セット
    document.getElementById('mdt_labelTeamA').textContent = teamA;
    document.getElementById('mdt_labelTeamB').textContent = teamB;
    document.getElementById('mdt_inputScoreA').value = isUnstarted ? 0 : match.teamAScore;
    document.getElementById('mdt_inputScoreB').value = isUnstarted ? 0 : match.teamBScore;

    // 💡 初期状態では「ホーム（A）」の選択状態に合わせてリストを構築
    selectSide.value = 'A';
    handleTargetSideChange('A');
}

/** 💡 選択された入力対象サイド（A or B）に応じて得点者入力欄をリフレッシュ生成 */
function handleTargetSideChange(side) {
    if (!currentMatchData) return;

    if (side === 'A') {
        const teamA = currentMatchData.teamAName || currentMatchData.homeTeamName || '-';
        document.getElementById('mdt_targetTeamName').textContent = teamA;
        initScorerRows('mdt_target_scorer_list', currentMatchData.teamAScorers, currentMatchData.teamAMembers);
    } else {
        const teamB = currentMatchData.teamBName || currentMatchData.awayTeamName || '-';
        document.getElementById('mdt_targetTeamName').textContent = teamB;
        initScorerRows('mdt_target_scorer_list', currentMatchData.teamBScorers, currentMatchData.teamBMembers);
    }
}

/** 既存の得点者テキストデータをパースしてセレクトボックスの行群を生成 */
function initScorerRows(containerId, scorersString, membersList) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!scorersString || !scorersString.trim() || scorersString === 'なし') return;

    const items = scorersString.split(/[,，]/);
    items.forEach(item => {
        let name = item.trim();
        let goals = 1;

        if (!name) return;

        const matchRegex = name.match(/^(.+?)[（\(](\d+)[）\)]$/);
        if (matchRegex) {
            name = matchRegex[1].trim();
            goals = parseInt(matchRegex[2], 10);
        }

        addScorerRow(containerId, membersList, name, goals);
    });
}

/** 得点者入力用のプルダウン行を1行追加する */
function addScorerRow(containerId, membersList, selectedName = '', goals = 1) {
    const container = document.getElementById(containerId);

    const rowDiv = document.createElement('div');
    rowDiv.className = 'mdt_scorerRowItem';

    const select = document.createElement('select');
    select.className = 'mdt_scorerSelect';
    select.required = true;

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '-- 得点者を選択 --';
    select.appendChild(defaultOpt);

    const ogOpt = document.createElement('option');
    ogOpt.value = 'オウンゴール';
    ogOpt.textContent = 'オウンゴール';
    if (selectedName === 'オウンゴール') ogOpt.selected = true;
    select.appendChild(ogOpt);

    membersList.forEach(mName => {
        const opt = document.createElement('option');
        opt.value = mName;
        opt.textContent = mName;
        if (mName === selectedName) opt.selected = true;
        select.appendChild(opt);
    });

    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.className = 'mdt_scorerGoalsInput';
    numInput.min = '1';
    numInput.value = goals;
    numInput.required = true;

    const unitSpan = document.createElement('span');
    unitSpan.className = 'mdt_scorerUnitText c_typo_bodyS';
    unitSpan.textContent = '点';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'mdt_scorerDeleteBtn';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', function () {
        rowDiv.remove();
    });

    rowDiv.appendChild(select);
    rowDiv.appendChild(numInput);
    rowDiv.appendChild(unitSpan);
    rowDiv.appendChild(deleteBtn);
    container.appendChild(rowDiv);
}

/** セレクトボックス群からGAS送信用に「名前(点数)」の形をシリアライズ */
function serializeScorers(containerId) {
    const container = document.getElementById(containerId);
    const rows = container.querySelectorAll('.mdt_scorerRowItem');
    const resultArr = [];

    rows.forEach(row => {
        const select = row.querySelector('.mdt_scorerSelect');
        const numInput = row.querySelector('.mdt_scorerGoalsInput');

        if (select && select.value) {
            const name = select.value;
            const goals = parseInt(numInput.value, 10) || 1;

            if (goals > 1) {
                resultArr.push(`${name}(${goals})`);
            } else {
                resultArr.push(name);
            }
        }
    });

    return resultArr.join(', ');
}

function toggleEditMode() {
    document.getElementById('mdt_viewMode').style.display = 'none';
    document.getElementById('mdt_editMode').style.display = 'block';
}

function toggleViewMode() {
    document.getElementById('mdt_editMode').style.display = 'none';
    document.getElementById('mdt_viewMode').style.display = 'block';
}

/** 編集データの保存（API送信） */
async function handleFormSubmit(e) {
    e.preventDefault();
    if (typeof showLoader === 'function') showLoader();

    const selectedSide = document.getElementById('mdt_selectTargetSide').value;
    const currentInputScorersText = serializeScorers('mdt_target_scorer_list');

    // 💡 選択されていない方のチームの得点者は、既存のデータをそのまま維持して送信
    let finalHomeScorers = "";
    let finalAwayScorers = "";

    if (selectedSide === 'A') {
        finalHomeScorers = currentInputScorersText;
        finalAwayScorers = currentMatchData.teamBScorers || "";
    } else {
        finalHomeScorers = currentMatchData.teamAScorers || "";
        finalAwayScorers = currentInputScorersText;
    }

    const postData = {
        action: "updateMatchResult",
        matchId: matchId,
        homeScore: parseInt(document.getElementById('mdt_inputScoreA').value, 10),
        awayScore: parseInt(document.getElementById('mdt_inputScoreB').value, 10),
        homeScorers: finalHomeScorers,
        awayScorers: finalAwayScorers
    };

    try {
        const res = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(postData)
        }).then(res => res.json());

        if (res.success && res.updatedMatch) {
            alert("試合結果を更新しました！");
            toggleViewMode();

            // 💡【最速化の肝】重い再取得(loadMatchDetail)を呼ばず、レスポンス内の最新データで上書きして再描画
            currentMatchData = res.updatedMatch;
            renderMatchDetail(currentMatchData);
        } else {
            alert("更新に失敗しました: " + (res.message || "未知のエラー"));
        }
    } catch (error) {
        console.error("送信エラー:", error);
        alert("サーバー通信に失敗しました。");
    } finally {
        if (typeof closeLoader === 'function') closeLoader();
    }
}