let currentTournamentData = null;
let currentAdminToken = localStorage.getItem("futsal_admin_token") || null;
let editingMatch = null;

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    checkAdminState();
    await loadTournamentData("TN_2026_01");
    await loadRankings(2026);
}

function switchTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById('tab-' + tabName).classList.add('active');
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

async function loadTournamentData(tournamentId) {
    try {
        const data = await callApi("getTournament", "GET", { tournament_id: tournamentId });
        currentTournamentData = data;
        renderSchedule(data.matches, data.teams);
    } catch (e) {
        console.error(e);
    }
}

function renderSchedule(matches, teams) {
    const container = document.getElementById("schedule-container");
    if (!container) return;

    let teamMap = {};
    teams.forEach(t => teamMap[t.team_id] = t.team_name);

    if (matches.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted);">まだ対戦スケジュールが登録されていません。</p>`;
        return;
    }

    container.innerHTML = matches.map(m => `
    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span class="court-badge">${m.court_name}</span>
        <span style="color: var(--text-muted);">${m.start_time} - ${m.end_time}</span>
      </div>
      <div style="font-size: 1.1rem; font-weight: bold; text-align: center; margin: 12px 0;">
        ${teamMap[m.home_team_id] || m.home_team_id} 
        <span style="color: var(--accent-color); font-size: 1.4rem; margin: 0 10px;">
          ${m.home_score !== "" ? m.home_score : "-"} : ${m.away_score !== "" ? m.away_score : "-"}
        </span> 
        ${teamMap[m.away_team_id] || m.away_team_id}
      </div>
      <div style="text-align: right;">
        <button onclick="openScoreModal('${m.match_id}')">スコア入力</button>
      </div>
    </div>
  `).join('');
}

function openScoreModal(matchId) {
    if (!currentAdminToken) {
        alert("スコアを入力するには、管理者メニューからログインしてください。");
        switchTab('admin');
        const adminBtn = document.querySelectorAll('.tab-btn')[2];
        if (adminBtn) adminBtn.click();
        return;
    }

    const match = currentTournamentData.matches.find(m => m.match_id === matchId);
    if (!match) return;
    editingMatch = match;

    let teamMap = {};
    currentTournamentData.teams.forEach(t => teamMap[t.team_id] = t.team_name);

    document.getElementById("modal-match-title").innerText = `スコア入力: ${teamMap[match.home_team_id]} vs ${teamMap[match.away_team_id]}`;

    document.getElementById("modal-team-inputs").innerHTML = `
    <div style="margin-bottom: 15px;">
      <label>${teamMap[match.home_team_id]} (ホーム) 得点:</label>
      <input type="number" id="input-home-score" value="${match.home_score}" min="0" />
    </div>
    <div style="margin-bottom: 15px;">
      <label>${teamMap[match.away_team_id]} (アウェイ) 得点:</label>
      <input type="number" id="input-away-score" value="${match.away_score}" min="0" />
    </div>
    <p style="font-size: 0.85rem; color: var(--text-muted);">※管理者権限でスコアを上書き保存します（後勝ち上書き方式）。</p>
  `;

    document.getElementById("score-modal").style.display = "flex";
}

function closeScoreModal() {
    document.getElementById("score-modal").style.display = "none";
}

async function submitModalScore() {
    if (!editingMatch) return;

    let hs = document.getElementById("input-home-score").value;
    let as = document.getElementById("input-away-score").value;

    if (hs === "" || as === "") {
        alert("スコアを入力してください");
        return;
    }

    try {
        // ホームスコア送信
        await callApi("submitScore", "POST", {
            token: currentAdminToken,
            match_id: editingMatch.match_id,
            team_id: editingMatch.home_team_id,
            score: Number(hs),
            scorers: [],
            fiscal_year: 2026
        });

        // アウェイコスア送信
        await callApi("submitScore", "POST", {
            token: currentAdminToken,
            match_id: editingMatch.match_id,
            team_id: editingMatch.away_team_id,
            score: Number(as),
            scorers: [],
            fiscal_year: 2026
        });

        alert("スコアを更新しました！");
        closeScoreModal();
        loadTournamentData("TN_2026_01");
        loadRankings(2026);
    } catch (e) {
        alert("更新失敗: " + e.message);
    }
}

async function loadRankings(fiscalYear) {
    try {
        const data = await callApi("getRankings", "GET", { fiscal_year: fiscalYear });

        // チームランキング描画
        const teamTbody = document.querySelector("#team-ranking-table tbody");
        teamTbody.innerHTML = data.teams.map((t, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><b>${t.team_name}</b></td>
        <td>${t.played}</td>
        <td>${t.won}</td>
        <td>${t.drawn}</td>
        <td>${t.lost}</td>
        <td>${t.gd >= 0 ? '+' + t.gd : t.gd}</td>
        <td><b>${t.pts}</b></td>
      </tr>
    `).join('');

        // 個人ランキング描画
        const playerTbody = document.querySelector("#player-ranking-table tbody");
        playerTbody.innerHTML = data.scorers.map((p, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${p.user_name}</td>
        <td>${p.base_department}</td>
        <td><b>${p.points}</b></td>
      </tr>
    `).join('');
    } catch (e) {
        console.error(e);
    }
}

async function handleAdminLogin() {
    const pwd = document.getElementById("admin-password-input").value;
    if (!pwd) return;

    try {
        const res = await callApi("adminLogin", "POST", { password: pwd });
        currentAdminToken = res.token;
        localStorage.setItem("futsal_admin_token", currentAdminToken);
        checkAdminState();
        alert("ログインに成功しました！");
    } catch (e) {
        alert("ログイン失敗: " + e.message);
    }
}

function handleAdminLogout() {
    currentAdminToken = null;
    localStorage.removeItem("futsal_admin_token");
    checkAdminState();
    alert("ログアウトしました");
}

function checkAdminState() {
    const loginWrapper = document.getElementById("admin-login-wrapper");
    const dashWrapper = document.getElementById("admin-dashboard-wrapper");

    if (currentAdminToken) {
        loginWrapper.style.display = "none";
        dashWrapper.style.display = "block";
    } else {
        loginWrapper.style.display = "block";
        dashWrapper.style.display = "none";
    }
}

async function handleGenerateSchedule() {
    if (!confirm("対戦表を自動生成しますか？既存のスケジュールが上書きされます。")) return;
    try {
        await callApi("generateSchedule", "POST", {
            token: currentAdminToken,
            tournament_id: "TN_2026_01"
        });
        alert("対戦表の自動生成が完了しました！");
        loadTournamentData("TN_2026_01");
    } catch (e) {
        alert("生成失敗: " + e.message);
    }
}