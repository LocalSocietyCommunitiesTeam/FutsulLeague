let currentTournamentData = { matches: [], teams: [] };
let currentAdminToken = localStorage.getItem("futsal_admin_token") || null;
let editingMatch = null;
let availableTournaments = [];

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    checkAdminState();
    await fetchAndPopulateTournaments();
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

async function fetchAndPopulateTournaments() {
    try {
        // スプレッドシートから実際の大会一覧を取得する（GAS側に getTournamentsList アクションが必要）
        const tournaments = await callApi("getTournamentsList", "GET");
        availableTournaments = Array.isArray(tournaments) ? tournaments : [];

        populateTournamentSelects();

        if (availableTournaments.length > 0) {
            await loadTournamentData(availableTournaments[0].tournament_id);
        } else {
            renderSchedule([], []);
        }
    } catch (e) {
        console.error("大会一覧の取得に失敗しました", e);
        availableTournaments = [];
        populateTournamentSelects();
        renderSchedule([], []);
    }
}

function populateTournamentSelects() {
    const selects = [
        document.getElementById("tournament-select"),
        document.getElementById("admin-tournament-select")
    ];

    selects.forEach(select => {
        if (!select) return;
        if (availableTournaments.length === 0) {
            select.innerHTML = `<option value="">大会データがありません</option>`;
            return;
        }
        select.innerHTML = availableTournaments.map(t =>
            `<option value="${t.tournament_id}">${t.tournament_name} (${t.tournament_id})</option>`
        ).join('');
    });
}

function onTournamentChange() {
    const selectedId = document.getElementById("tournament-select").value;
    if (selectedId) {
        loadTournamentData(selectedId);
    }
}

async function loadTournamentData(tournamentId) {
    if (!tournamentId) return;
    try {
        const data = await callApi("getTournament", "GET", { tournament_id: tournamentId });
        currentTournamentData = data || { matches: [], teams: [] };
        renderSchedule(currentTournamentData.matches || [], currentTournamentData.teams || []);
    } catch (e) {
        currentTournamentData = { matches: [], teams: [] };
        renderSchedule([], []);
    }
}

function renderSchedule(matches, teams) {
    const container = document.getElementById("schedule-container");
    if (!container) return;

    let teamMap = {};
    if (teams && Array.isArray(teams)) {
        teams.forEach(t => teamMap[t.team_id] = t.team_name);
    }

    if (!matches || matches.length === 0) {
        container.innerHTML = `<div class="card" style="text-align:center; color:var(--text-muted); padding: 30px;">現在登録されている対戦スケジュールはありません。<br>管理者メニューから対戦表を自動生成してください。</div>`;
        return;
    }

    container.innerHTML = matches.map(m => `
    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span class="court-badge">${m.court_name || 'コート未設定'}</span>
        <span style="color: var(--text-muted);">${m.start_time || ''} - ${m.end_time || ''}</span>
      </div>
      <div style="font-size: 1.1rem; font-weight: bold; text-align: center; margin: 12px 0;">
        ${teamMap[m.home_team_id] || m.home_team_id} 
        <span style="color: var(--accent-color); font-size: 1.4rem; margin: 0 10px;">
          ${m.home_score !== "" && m.home_score !== undefined ? m.home_score : "-"} : ${m.away_score !== "" && m.away_score !== undefined ? m.away_score : "-"}
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
    if (currentTournamentData.teams) {
        currentTournamentData.teams.forEach(t => teamMap[t.team_id] = t.team_name);
    }

    document.getElementById("modal-match-title").innerText = `スコア入力: ${teamMap[match.home_team_id] || match.home_team_id} vs ${teamMap[match.away_team_id] || match.away_team_id}`;

    document.getElementById("modal-team-inputs").innerHTML = `
    <div style="margin-bottom: 15px;">
      <label>${teamMap[match.home_team_id] || match.home_team_id} (ホーム) 得点:</label>
      <input type="number" id="input-home-score" value="${match.home_score !== undefined ? match.home_score : 0}" min="0" />
    </div>
    <div style="margin-bottom: 15px;">
      <label>${teamMap[match.away_team_id] || match.away_team_id} (アウェイ) 得点:</label>
      <input type="number" id="input-away-score" value="${match.away_score !== undefined ? match.away_score : 0}" min="0" />
    </div>
    <p style="font-size: 0.85rem; color: var(--text-muted);">※管理者権限でスコアを上書き保存します。</p>
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

    const selectedTournamentId = document.getElementById("tournament-select").value;

    try {
        await callApi("submitScore", "POST", {
            token: currentAdminToken,
            match_id: editingMatch.match_id,
            team_id: editingMatch.home_team_id,
            score: Number(hs),
            scorers: [],
            fiscal_year: 2026
        });

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
        loadTournamentData(selectedTournamentId);
        loadRankings(2026);
    } catch (e) {
        alert("更新失敗: " + e.message);
    }
}

async function loadRankings(fiscalYear) {
    const teamTbody = document.querySelector("#team-ranking-table tbody");
    const playerTbody = document.querySelector("#player-ranking-table tbody");
    const teamEmpty = document.getElementById("team-ranking-empty");
    const playerEmpty = document.getElementById("player-ranking-empty");

    try {
        const data = await callApi("getRankings", "GET", { fiscal_year: fiscalYear });

        if (data.teams && data.teams.length > 0) {
            teamEmpty.style.display = "none";
            teamTbody.parentElement.style.display = "table";
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
        } else {
            teamTbody.innerHTML = "";
            teamTbody.parentElement.style.display = "none";
            teamEmpty.style.display = "block";
        }

        if (data.scorers && data.scorers.length > 0) {
            playerEmpty.style.display = "none";
            playerTbody.parentElement.style.display = "table";
            playerTbody.innerHTML = data.scorers.map((p, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${p.user_name}</td>
          <td>${p.base_department}</td>
          <td><b>${p.points}</b></td>
        </tr>
      `).join('');
        } else {
            playerTbody.innerHTML = "";
            playerTbody.parentElement.style.display = "none";
            playerEmpty.style.display = "block";
        }

    } catch (e) {
        teamTbody.innerHTML = "";
        teamTbody.parentElement.style.display = "none";
        teamEmpty.style.display = "block";

        playerTbody.innerHTML = "";
        playerTbody.parentElement.style.display = "none";
        playerEmpty.style.display = "block";
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

async function handleCreateTournament() {
    const tournamentName = document.getElementById("new-tournament-name").value.trim();

    if (!tournamentName) {
        alert("大会名を入力してください。");
        return;
    }

    try {
        await callApi("createTournament", "POST", {
            token: currentAdminToken,
            tournament_name: tournamentName
        });
        alert("大会を作成しました！");
        document.getElementById("new-tournament-name").value = "";

        // 大会リストを再取得してプルダウンを最新化
        await fetchAndPopulateTournaments();
    } catch (e) {
        alert("大会作成失敗: " + e.message);
    }
}

async function handleRegisterTeam() {
    const tournamentId = document.getElementById("admin-tournament-select").value;
    const teamName = document.getElementById("new-team-name").value.trim();

    if (!tournamentId) {
        alert("対象の大会を選択してください。");
        return;
    }
    if (!teamName) {
        alert("チーム名を入力してください。");
        return;
    }

    try {
        await callApi("registerTeam", "POST", {
            token: currentAdminToken,
            tournament_id: tournamentId,
            team_name: teamName
        });
        alert("チームを登録しました！");
        document.getElementById("new-team-name").value = "";
        loadTournamentData(tournamentId);
    } catch (e) {
        alert("チーム登録失敗: " + e.message);
    }
}

async function handleGenerateSchedule() {
    const tournamentId = document.getElementById("admin-tournament-select").value;
    if (!tournamentId) {
        alert("対象の大会を選択してください。");
        return;
    }
    if (!confirm(`選択中の大会 (${tournamentId}) の対戦表を自動生成しますか？`)) return;

    try {
        await callApi("generateSchedule", "POST", {
            token: currentAdminToken,
            tournament_id: tournamentId
        });
        alert("対戦表の自動生成が完了しました！");
        loadTournamentData(tournamentId);
    } catch (e) {
        alert("生成失敗: " + e.message);
    }
}