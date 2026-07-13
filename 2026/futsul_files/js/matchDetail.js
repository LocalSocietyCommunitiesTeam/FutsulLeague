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

    // 💡 オウンゴール選択時の自動入力イベント
    document.getElementById('mdt_ogBtnA').addEventListener('click', function () {
        addOwnGoal('mdt_inputScorersA', 'mdt_inputScoreA');
    });
    document.getElementById('mdt_ogBtnB').addEventListener('click', function () {
        addOwnGoal('mdt_inputScorersB', 'mdt_inputScoreB');
    });

    // 編集フォームの送信
    document.getElementById('mdt_editForm').addEventListener('submit', handleFormSubmit);
});

/** 💡 オウンゴールを選択した際に入力欄と得点数を連動させる処理 */
function addOwnGoal(inputTextBoxId, scoreInputId) {
    const textBox = document.getElementById(inputTextBoxId);
    const scoreBox = document.getElementById(scoreInputId);

    // 現在の入力内容を取得
    let currentText = textBox.value.trim();

    // 文字列が空でなければカンマ区切り、空ならそのまま「オウンゴール」を挿入
    if (currentText === "") {
        textBox.value = "オウンゴール";
    } else {
        textBox.value = currentText + ", オウンゴール";
    }

    // 加点側ルールに基づき、得点数インプットを自動で「+1」する
    let currentScore = parseInt(scoreBox.value, 10) || 0;
    scoreBox.value = currentScore + 1;
}

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
    
    // 💡 チーム名のマッピング修正（GASの返却キーが teamAName / teamBName であることを保証）
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

    // 編集フォーム初期値セット
    document.getElementById('mdt_labelTeamA').textContent = teamA;
    document.getElementById('mdt_labelTeamB').textContent = teamB;
    document.getElementById('mdt_nameTeamA').textContent = teamA;
    document.getElementById('mdt_nameTeamB').textContent = teamB;
    document.getElementById('mdt_inputScoreA').value = isUnstarted ? 0 : match.teamAScore;
    document.getElementById('mdt_inputScoreB').value = isUnstarted ? 0 : match.teamBScore;
    document.getElementById('mdt_inputScorersA').value = match.teamAScorers || '';
    document.getElementById('mdt_inputScorersB').value = match.teamBScorers || '';
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

    const postData = {
        action: "updateMatchResult",
        matchId: matchId,
        homeScore: parseInt(document.getElementById('mdt_inputScoreA').value, 10),
        awayScore: parseInt(document.getElementById('mdt_inputScoreB').value, 10),
        homeScorers: document.getElementById('mdt_inputScorersA').value.trim(),
        awayScorers: document.getElementById('mdt_inputScorersB').value.trim()
    };

    try {
        const res = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(postData)
        }).then(res => res.json());

        if (res.success) {
            alert("試合結果を更新しました！");
            toggleViewMode();
            loadMatchDetail();
        } else {
            alert("更新に失敗しました: " + res.message);
        }
    } catch (error) {
        console.error("送信エラー:", error);
        alert("サーバー通信に失敗しました。");
    } finally {
        if (typeof closeLoader === 'function') closeLoader();
    }
}