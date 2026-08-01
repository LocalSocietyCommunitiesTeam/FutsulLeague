/* =========================================================================
   app.js — 画面描画・状態管理・ルーティング・差分レンダリング制御
   フロントエンドは集計/ソート等のビジネスロジックを持たず、
   GASから返却されたデータをそのまま表示することに専念する。
   ========================================================================= */

/* ---------- 0. グローバル状態 ---------- */
const appState = {
    route: "home",                 // home / entry / schedule / matchDetail / ranking / archive / adminLogin / adminDashboard
    tournamentId: "current",       // "current" = 開催中の最新大会を指すバックエンド側の特別値
    tournament: null,
    matches: [],
    teams: [],
    rankings: { team_rankings: [], individual_rankings: [] },
    rankingTab: "team",            // "team" | "individual"
    selectedMatchId: null,
    scoreEntry: { side: null },    // "home" | "away" | null（自チーム選択トグル）
    archive: { years: [], selectedYear: null, data: null },
    isAdmin: false,
};

const screenRoot = document.getElementById("screenRoot");
const tabbar = document.getElementById("tabbar");
const headerBrand = document.getElementById("headerBrand");
const settingsBtn = document.getElementById("settingsBtn");

/* ---------- 1. 起動処理 ---------- */
window.addEventListener("DOMContentLoaded", init);

async function init() {
    appState.isAdmin = !!sessionStorage.getItem("admin_token");
    bindGlobalEvents();
    await loadTournament();
    navigate("home");
}

function bindGlobalEvents() {
    settingsBtn.addEventListener("click", () => {
        navigate(appState.isAdmin ? "adminDashboard" : "adminLogin");
    });
    tabbar.addEventListener("click", (e) => {
        const btn = e.target.closest(".tabbar-item");
        if (!btn) return;
        navigate(btn.dataset.route);
    });
    // イベント委譲：動的に描画される画面内のクリックを一括ハンドリング
    screenRoot.addEventListener("click", onScreenClick);
    screenRoot.addEventListener("input", onScreenInput);
}

/* ---------- 2. ルーティング ---------- */
function navigate(route, params = {}) {
    appState.route = route;
    Object.assign(appState, params);
    renderHeader();
    renderTabbarActive();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHeader() {
    const map = {
        home: { title: "本社部対抗フットサルリーグ", back: false },
        entry: { title: "参加エントリー", back: true },
        schedule: { title: "タイムスケジュール", back: false },
        matchDetail: { title: "試合詳細", back: true },
        ranking: { title: "ランキング", back: false },
        archive: { title: "過去大会アーカイブ", back: false },
        adminLogin: { title: "管理者ログイン", back: true },
        adminDashboard: { title: "管理者ダッシュボード", back: true },
    };
    const conf = map[appState.route] || map.home;
    headerBrand.innerHTML = conf.back
        ? `<button class="icon-btn back-btn-icon" data-action="goBackHome" aria-label="戻る">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
       </button>
       <span>${conf.title}</span>`
        : `<span class="ball-dot"></span><span>${conf.title}</span>`;
    settingsBtn.classList.toggle("hidden", appState.route === "adminLogin" || appState.route === "adminDashboard");
}

function renderTabbarActive() {
    const mainRoutes = ["home", "schedule", "ranking", "archive"];
    tabbar.classList.toggle("hidden", !mainRoutes.includes(appState.route));
    [...tabbar.querySelectorAll(".tabbar-item")].forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.route === appState.route);
    });
}

/* ---------- 3. 画面クリック / 入力の委譲ハンドラ ---------- */
function onScreenClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const handlers = {
        goBackHome: () => navigate("home"),
        goEntry: () => navigate("entry"),
        goSchedule: () => navigate("schedule"),
        goRanking: () => navigate("ranking"),
        goArchive: () => navigate("archive"),
        openMatch: () => navigate("matchDetail", { selectedMatchId: el.dataset.matchId, scoreEntry: { side: null } }),
        selectSide: () => selectScoreSide(el.dataset.side),
        submitScore: () => onSubmitScore(),
        addMember: () => addMemberRow(),
        removeMember: () => removeMemberRow(el),
        submitEntry: () => onSubmitEntry(),
        switchRankingTab: () => switchRankingTab(el.dataset.tab),
        selectArchiveYear: () => onSelectArchiveYear(el.dataset.year),
        submitAdminLogin: () => onAdminLogin(),
        adminLogout: () => onAdminLogout(),
        approveTeam: () => onApproveTeam(el.dataset.teamId),
        generateSchedule: () => onGenerateSchedule(),
        createTournament: () => onCreateTournament(),
        selectTeamType: () => selectTeamTypeChip(el),
    };
    if (handlers[action]) handlers[action]();
}

function onScreenInput(e) {
    if (appState.route === "matchDetail") validateScoreForm();
}

/* ---------- 4. データ取得 ---------- */
async function loadTournament() {
    showLoadingSpinner(true);
    const res = await apiGet("getTournament", { tournament_id: appState.tournamentId });
    showLoadingSpinner(false);
    if (res.status === "success") {
        appState.tournament = res.data.tournament;
        appState.matches = res.data.matches || [];
        appState.teams = res.data.teams || [];
    } else {
        showToast(res.message || "大会情報の取得に失敗しました", "error");
    }
}

async function loadRankings() {
    const fiscalYear = new Date().getFullYear();
    const res = await apiGet("getRankings", { fiscal_year: fiscalYear });
    if (res.status === "success") {
        appState.rankings = res.data;
    } else {
        showToast(res.message || "ランキングの取得に失敗しました", "error");
    }
}

/* ---------- 5. メインレンダラ ---------- */
function render() {
    const renderers = {
        home: renderHome,
        entry: renderEntry,
        schedule: renderSchedule,
        matchDetail: renderMatchDetail,
        ranking: renderRanking,
        archive: renderArchive,
        adminLogin: renderAdminLogin,
        adminDashboard: renderAdminDashboard,
    };
    screenRoot.innerHTML = `<div class="screen" id="screenInner"></div>`;
    const target = document.getElementById("screenInner");
    target.innerHTML = renderers[appState.route] ? renderers[appState.route]() : renderHome();
    afterRenderHook();
}

function afterRenderHook() {
    enableTilt(".tilt");
    if (appState.route === "matchDetail") validateScoreForm();
}

/* =========================================================================
   U01 : トップ画面（ホーム）
   ========================================================================= */
function renderHome() {
    const t = appState.tournament;
    if (!t) {
        return emptyState("⚽", "開催中の大会情報がありません。");
    }
    return `
    <div class="glass-card tilt">
      <span class="eyebrow">TOURNAMENT</span>
      <h2>${escapeHtml(t.name)}</h2>
      <p class="text-dim mt-8">${escapeHtml(t.event_date)} 開催 ／ ステータス: ${statusLabel(t.status)}</p>
      <div class="flex gap-8 mt-16">
        <button class="btn btn-primary" data-action="goSchedule">対戦表を見る</button>
        <button class="btn btn-ghost" data-action="goEntry">参加エントリー</button>
      </div>
    </div>
    <div class="glass-card tilt mt-16">
      <span class="eyebrow">RANKING</span>
      <h2>順位・個人得点</h2>
      <p class="text-dim mt-8">チーム順位と個人得点ランキングをリアルタイムで確認できます。</p>
      <button class="btn mt-16" data-action="goRanking">ランキングを見る</button>
    </div>
    <div class="glass-card tilt mt-16">
      <span class="eyebrow">ARCHIVE</span>
      <h2>過去大会アーカイブ</h2>
      <p class="text-dim mt-8">過去の試合結果・最終順位を振り返る。</p>
      <button class="btn mt-16" data-action="goArchive">アーカイブを見る</button>
    </div>
  `;
}

function statusLabel(s) {
    return { PLANNING: "開催準備中", IN_PROGRESS: "開催中", FINISHED: "終了" }[s] || s;
}

/* =========================================================================
   U02 : 参加エントリー画面
   ========================================================================= */
function renderEntry() {
    return `
    <div class="glass-card">
      <h3>参加形態</h3>
      <div class="select-chip-group mt-8" id="teamTypeGroup">
        <button type="button" class="select-chip selected" data-action="selectTeamType" data-value="SINGLE">単一部署</button>
        <button type="button" class="select-chip" data-action="selectTeamType" data-value="JOINT">合同チーム</button>
      </div>

      <div class="form-group mt-16">
        <label class="field-label" for="teamName">チーム名</label>
        <input class="field" id="teamName" placeholder="例：営業企画部 A" maxlength="30">
      </div>

      <h3 class="mt-16">出場メンバー</h3>
      <div id="memberList">
        ${memberRowHtml(1)}
        ${memberRowHtml(2)}
      </div>
      <button class="btn btn-ghost mt-8" data-action="addMember">＋ メンバーを追加</button>

      <button class="btn btn-primary btn-block mt-16" data-action="submitEntry">エントリーを送信</button>
      <p class="error-text hidden" id="entryError"></p>
    </div>
  `;
}

let memberRowSeq = 2;
function memberRowHtml(idx) {
    return `
    <div class="member-row" data-row="${idx}">
      <input class="field member-name" placeholder="氏名" maxlength="20">
      <input class="field member-dept" placeholder="部署名" maxlength="20">
      <button type="button" class="remove-btn" data-action="removeMember">×</button>
    </div>`;
}
function addMemberRow() {
    memberRowSeq += 1;
    document.getElementById("memberList").insertAdjacentHTML("beforeend", memberRowHtml(memberRowSeq));
}
function removeMemberRow(btn) {
    const rows = document.querySelectorAll(".member-row");
    if (rows.length <= 1) return; // 最低1名は必須
    btn.closest(".member-row").remove();
}
function selectTeamTypeChip(el) {
    el.parentElement.querySelectorAll(".select-chip").forEach((c) => c.classList.remove("selected"));
    el.classList.add("selected");
}

async function onSubmitEntry() {
    const teamType = document.querySelector("#teamTypeGroup .select-chip.selected").dataset.value;
    const teamName = document.getElementById("teamName").value.trim();
    const errorEl = document.getElementById("entryError");

    if (!teamName) {
        errorEl.textContent = "チーム名を入力してください。";
        errorEl.classList.remove("hidden");
        return;
    }
    const members = [...document.querySelectorAll(".member-row")].map((row) => ({
        name: row.querySelector(".member-name").value.trim(),
        department: row.querySelector(".member-dept").value.trim(),
    }));
    if (members.some((m) => !m.name)) {
        errorEl.textContent = "氏名を入力してください。";
        errorEl.classList.remove("hidden");
        return;
    }
    errorEl.classList.add("hidden");

    showLoadingSpinner(true);
    const res = await apiPost({
        action: "submitEntry",
        tournament_id: appState.tournamentId,
        type: teamType,
        name: teamName,
        members,
    });
    showLoadingSpinner(false);

    if (res.status === "success") {
        showToast("エントリーを送信しました（承認待ち）", "success");
        navigate("home");
    } else {
        showToast(res.message || "エントリーに失敗しました", "error");
    }
}

/* =========================================================================
   U03 : タイムスケジュール画面
   ========================================================================= */
function renderSchedule() {
    if (!appState.matches.length) return emptyState("📅", "対戦カードはまだ登録されていません。");
    const rows = [...appState.matches]
        .sort((a, b) => (a.start_time > b.start_time ? 1 : -1))
        .map(matchCardHtml)
        .join("");
    return `<div class="flex-col">${rows}</div>`;
}

function matchCardHtml(m) {
    const home = teamName(m.home_team_id);
    const away = teamName(m.away_team_id);
    return `
    <div class="glass-card tilt match-card" data-action="openMatch" data-match-id="${m.match_id}">
      <div class="meta-row">
        <span>${m.start_time}〜${m.end_time}</span>
        <span class="court-badge">${escapeHtml(m.court_name)}</span>
        <span class="status-badge ${m.status === "FINISHED" ? "finished" : "scheduled"}">${m.status === "FINISHED" ? "終了" : "予定"}</span>
      </div>
      <div class="vs-row">
        <div class="team-name">${escapeHtml(home)}</div>
        <div class="score-mini">
          <span>${m.status === "FINISHED" ? m.home_score : "-"}</span>
          <span class="dash">:</span>
          <span>${m.status === "FINISHED" ? m.away_score : "-"}</span>
        </div>
        <div class="team-name right">${escapeHtml(away)}</div>
      </div>
    </div>`;
}

function teamName(teamId) {
    const t = appState.teams.find((x) => x.team_id === teamId);
    return t ? t.name : "未定チーム";
}

/* =========================================================================
   U04 : 試合詳細・結果入力画面
   ========================================================================= */
function renderMatchDetail() {
    const m = appState.matches.find((x) => x.match_id === appState.selectedMatchId);
    if (!m) return emptyState("❓", "指定された試合が見つかりません。");
    const home = teamName(m.home_team_id);
    const away = teamName(m.away_team_id);
    const side = appState.scoreEntry.side;

    return `
    <div class="scoreboard-3d tilt">
      <div class="scoreboard-inner">
        <div class="scoreboard-teams">
          <div class="scoreboard-team"><div class="label">HOME</div><div class="name">${escapeHtml(home)}</div></div>
          <div class="scoreboard-vs">VS</div>
          <div class="scoreboard-team"><div class="label">AWAY</div><div class="name">${escapeHtml(away)}</div></div>
        </div>
        <div class="digit-flip-group">
          <span class="digit-flip" id="homeDigit">${m.status === "FINISHED" ? m.home_score : "-"}</span>
          <span class="digit-flip">：</span>
          <span class="digit-flip" id="awayDigit">${m.status === "FINISHED" ? m.away_score : "-"}</span>
        </div>
        <div class="scoreboard-court">${escapeHtml(m.court_name)} ／ ${m.start_time}〜${m.end_time}</div>
      </div>
    </div>

    <div class="glass-card">
      <h3>結果を入力する</h3>
      <p class="text-dim mt-8">自チームを選択すると、そのチームの入力欄のみ操作できます。</p>
      <div class="select-chip-group mt-8">
        <button type="button" class="select-chip ${side === "home" ? "selected" : ""}" data-action="selectSide" data-side="home">${escapeHtml(home)} として入力</button>
        <button type="button" class="select-chip ${side === "away" ? "selected" : ""}" data-action="selectSide" data-side="away">${escapeHtml(away)} として入力</button>
      </div>

      <div class="mt-16">
        ${teamEntryPanelHtml("home", home, side)}
        ${teamEntryPanelHtml("away", away, side)}
      </div>

      <button class="btn btn-primary btn-block mt-16" id="submitScoreBtn" data-action="submitScore" disabled>結果を送信</button>
      <p class="error-text hidden" id="scoreError"></p>
    </div>
  `;
}

function teamEntryPanelHtml(sideKey, name, activeSide) {
    const isActive = activeSide === sideKey;
    const disabledAttr = isActive ? "" : "disabled";
    return `
    <div class="team-panel glass-card ${isActive ? "" : "opponent-locked"} mt-16" data-side-panel="${sideKey}">
      <h4>${escapeHtml(name)}</h4>
      <label class="field-label mt-8">総得点</label>
      <input class="field score-total" data-side="${sideKey}" type="number" min="0" inputmode="numeric" ${disabledAttr}>
      <label class="field-label mt-8">得点者内訳（氏名・得点）</label>
      <div class="scorer-list" data-scorer-list="${sideKey}">
        ${scorerRowHtml(sideKey, disabledAttr)}
      </div>
      ${isActive ? `<button type="button" class="btn btn-ghost mt-8" data-scorer-add="${sideKey}" onclick="addScorerRow('${sideKey}')">＋ 得点者を追加</button>` : ""}
    </div>`;
}
function scorerRowHtml(sideKey, disabledAttr) {
    return `
    <div class="scorer-row">
      <input class="field scorer-name" data-side="${sideKey}" placeholder="氏名" ${disabledAttr}>
      <input class="field scorer-points" data-side="${sideKey}" type="number" min="0" placeholder="得点" ${disabledAttr}>
    </div>`;
}
function addScorerRow(sideKey) {
    const disabledAttr = appState.scoreEntry.side === sideKey ? "" : "disabled";
    document.querySelector(`[data-scorer-list="${sideKey}"]`).insertAdjacentHTML("beforeend", scorerRowHtml(sideKey, disabledAttr));
    validateScoreForm();
}

function selectScoreSide(side) {
    appState.scoreEntry.side = side;
    render(); // 選択チーム側のみ活性化して再描画
}

function validateScoreForm() {
    const btn = document.getElementById("submitScoreBtn");
    const errorEl = document.getElementById("scoreError");
    if (!btn) return;
    const side = appState.scoreEntry.side;
    if (!side) { btn.disabled = true; return; }

    const totalInput = document.querySelector(`.score-total[data-side="${side}"]`);
    const total = Number(totalInput.value);
    const scorerRows = [...document.querySelectorAll(`[data-scorer-list="${side}"] .scorer-row`)];
    const breakdownSum = scorerRows.reduce((sum, row) => {
        const pts = Number(row.querySelector(".scorer-points").value || 0);
        return sum + pts;
    }, 0);

    const totalValid = totalInput.value !== "" && total >= 0 && Number.isInteger(total);
    const sumMatches = totalValid && breakdownSum === total;

    totalInput.classList.toggle("error", totalInput.value !== "" && !sumMatches);

    if (totalInput.value !== "" && !sumMatches) {
        errorEl.textContent = "総得点と内訳が一致しません";
        errorEl.classList.remove("hidden");
    } else {
        errorEl.classList.add("hidden");
    }
    btn.disabled = !sumMatches;
}

async function onSubmitScore() {
    const side = appState.scoreEntry.side;
    const m = appState.matches.find((x) => x.match_id === appState.selectedMatchId);
    const teamId = side === "home" ? m.home_team_id : m.away_team_id;
    const total = Number(document.querySelector(`.score-total[data-side="${side}"]`).value);
    const scorers = [...document.querySelectorAll(`[data-scorer-list="${side}"] .scorer-row`)]
        .map((row) => ({
            name: row.querySelector(".scorer-name").value.trim(),
            points: Number(row.querySelector(".scorer-points").value || 0),
        }))
        .filter((s) => s.name);

    showLoadingSpinner(true);
    const res = await apiPost({
        action: "submitScore",
        tournament_id: appState.tournamentId,
        match_id: m.match_id,
        team_id: teamId,
        score: total,
        scorers,
    });
    showLoadingSpinner(false);

    if (res.status === "success") {
        showToast("スコアを更新しました", "success");
        appState.matches = res.data.matches;               // 1. ローカルStateを最新データで更新
        flipScoreDigits(res.data.updated_match_id);          // 2. スコアボードのフリップアニメーション
        loadRankings();                                      // 3. バックグラウンドで最新ランキングを再取得
        render();
    } else {
        showToast(res.message, "error");
    }
}

function flipScoreDigits(matchId) {
    const m = appState.matches.find((x) => x.match_id === matchId);
    if (!m) return;
    ["homeDigit", "awayDigit"].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add("flip");
        setTimeout(() => {
            el.textContent = id === "homeDigit" ? m.home_score : m.away_score;
        }, 260);
        setTimeout(() => el.classList.remove("flip"), 560);
    });
}

/* =========================================================================
   U05 : ランキング画面
   ========================================================================= */
function renderRanking() {
    if (!appState.rankings.team_rankings.length && !appState.rankings.individual_rankings.length) {
        loadRankings().then(() => { if (appState.route === "ranking") render(); });
    }
    return `
    <div class="tabs">
      <button class="tab-btn ${appState.rankingTab === "team" ? "active" : ""}" data-action="switchRankingTab" data-tab="team">チーム順位</button>
      <button class="tab-btn ${appState.rankingTab === "individual" ? "active" : ""}" data-action="switchRankingTab" data-tab="individual">個人得点</button>
      <div class="tab-indicator" style="transform: translateX(${appState.rankingTab === "individual" ? "100%" : "0"})"></div>
    </div>
    <div class="glass-card tab-panel">
      ${appState.rankingTab === "team" ? teamRankingHtml() : individualRankingHtml()}
    </div>
  `;
}
function switchRankingTab(tab) {
    appState.rankingTab = tab;
    render();
}
function teamRankingHtml() {
    const list = appState.rankings.team_rankings || [];
    if (!list.length) return emptyState("🏆", "チーム順位データがありません。");
    return list.map((r) => `
    <div class="rank-row">
      <div class="rank-num">${r.rank}</div>
      <div>
        <div class="team-name">${escapeHtml(r.name)}</div>
        <div class="team-rank-stats">
          <span>試合 ${r.played}</span><span>${r.win}勝${r.draw}分${r.lose}敗</span><span>得失差 ${r.diff > 0 ? "+" : ""}${r.diff}</span>
        </div>
      </div>
      <div class="rank-points">${r.points}<span class="rank-sub">pt</span></div>
    </div>`).join("");
}
function individualRankingHtml() {
    const list = appState.rankings.individual_rankings || [];
    if (!list.length) return emptyState("⚽", "個人得点データがありません。");
    return list.map((r) => `
    <div class="rank-row">
      <div class="rank-num ${r.rank <= 3 ? "medal" : ""}">${r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</div>
      <div>
        <div class="team-name">${escapeHtml(r.name)}</div>
        <div class="rank-teams">${(r.teams || []).map(escapeHtml).join(" / ")}</div>
      </div>
      <div class="rank-points">${r.points}<span class="rank-sub">goal</span></div>
    </div>`).join("");
}

/* =========================================================================
   U06 : 過去大会アーカイブ画面
   ========================================================================= */
function renderArchive() {
    if (!appState.archive.years.length) {
        loadArchiveYears();
        return emptyState("📦", "アーカイブを読み込んでいます…");
    }
    const yearChips = appState.archive.years.map((y) => `
    <button type="button" class="select-chip ${appState.archive.selectedYear === y ? "selected" : ""}" data-action="selectArchiveYear" data-year="${y}">${y}年度</button>
  `).join("");

    return `
    <div class="select-chip-group">${yearChips}</div>
    <div class="glass-card mt-16">
      ${appState.archive.data ? archiveContentHtml(appState.archive.data) : `<p class="text-dim">年度を選択してください。</p>`}
    </div>
  `;
}
async function loadArchiveYears() {
    const res = await apiGet("getArchiveYears", {});
    if (res.status === "success") {
        appState.archive.years = res.data.years || [];
        if (appState.route === "archive") render();
    }
}
async function onSelectArchiveYear(year) {
    appState.archive.selectedYear = Number(year);
    showLoadingSpinner(true);
    const res = await apiGet("getRankings", { fiscal_year: year });
    showLoadingSpinner(false);
    if (res.status === "success") {
        appState.archive.data = res.data;
        render();
    }
}
function archiveContentHtml(data) {
    return `
    <h3>${appState.archive.selectedYear}年度 最終ランキング</h3>
    <div class="mt-8">${(data.team_rankings || []).slice(0, 5).map((r) => `
      <div class="rank-row"><div class="rank-num">${r.rank}</div><div class="team-name">${escapeHtml(r.name)}</div><div class="rank-points">${r.points}pt</div></div>
    `).join("")}</div>
  `;
}

/* =========================================================================
   A01 : 管理者ログイン画面
   ========================================================================= */
function renderAdminLogin() {
    return `
    <div class="glass-card">
      <h3>管理者ログイン</h3>
      <div class="form-group mt-16">
        <label class="field-label" for="adminPassword">パスワード</label>
        <input class="field" id="adminPassword" type="password">
      </div>
      <button class="btn btn-primary btn-block" data-action="submitAdminLogin">ログイン</button>
      <p class="error-text hidden" id="adminLoginError"></p>
    </div>
  `;
}
async function onAdminLogin() {
    const password = document.getElementById("adminPassword").value;
    showLoadingSpinner(true);
    const res = await apiPost({ action: "adminLogin", password });
    showLoadingSpinner(false);
    const errorEl = document.getElementById("adminLoginError");
    if (res.status === "success") {
        sessionStorage.setItem("admin_token", res.data.token);
        appState.isAdmin = true;
        showToast("管理者としてログインしました", "success");
        navigate("adminDashboard");
    } else {
        errorEl.textContent = res.message || "パスワードが異なります";
        errorEl.classList.remove("hidden");
    }
}
function onAdminLogout() {
    sessionStorage.removeItem("admin_token");
    appState.isAdmin = false;
    navigate("home");
}

/* =========================================================================
   A02 : 管理者ダッシュボード
   ========================================================================= */
function renderAdminDashboard() {
    if (!appState.isAdmin) {
        navigate("adminLogin");
        return "";
    }
    const pendingTeams = appState.teams.filter((t) => t.status === "PENDING");
    return `
    <div class="flex gap-8" style="justify-content:space-between;align-items:center;">
      <span class="admin-badge">● 管理者モード</span>
      <button class="btn btn-ghost" data-action="adminLogout">ログアウト</button>
    </div>

    <div class="glass-card mt-16">
      <h3>大会作成</h3>
      <div class="form-group mt-16">
        <label class="field-label" for="newTournamentName">大会名</label>
        <input class="field" id="newTournamentName" placeholder="例：2026年度 第1回大会">
      </div>
      <div class="form-group">
        <label class="field-label" for="newTournamentDate">開催日</label>
        <input class="field" id="newTournamentDate" type="date">
      </div>
      <div class="form-group">
        <label class="field-label" for="newTournamentCourts">使用コート（カンマ区切り）</label>
        <input class="field" id="newTournamentCourts" placeholder="例：Aコート,Bコート">
      </div>
      <button class="btn btn-primary" data-action="createTournament">大会を作成</button>
    </div>

    <div class="admin-section-title">参加チーム承認待ち（${pendingTeams.length}）</div>
    <div class="glass-card">
      ${pendingTeams.length ? pendingTeams.map((t) => `
        <div class="pending-row">
          <span>${escapeHtml(t.name)} <span class="text-dim">(${t.type === "JOINT" ? "合同" : "単一"})</span></span>
          <button class="pill-btn approve" data-action="approveTeam" data-team-id="${t.team_id}">承認</button>
        </div>`).join("") : `<p class="text-dim">承認待ちのチームはありません。</p>`}
    </div>

    <div class="glass-card mt-16">
      <h3>対戦表自動生成</h3>
      <p class="text-dim mt-8">承認済みチームとコート設定をもとに対戦表を自動生成します。</p>
      <button class="btn btn-primary mt-16" data-action="generateSchedule">対戦表を生成する</button>
    </div>
  `;
}
async function onCreateTournament() {
    const name = document.getElementById("newTournamentName").value.trim();
    const eventDate = document.getElementById("newTournamentDate").value;
    const courts = document.getElementById("newTournamentCourts").value.trim();
    if (!name || !eventDate) { showToast("大会名と開催日を入力してください", "error"); return; }
    showLoadingSpinner(true);
    const res = await apiPostAuthed("createTournament", { name, event_date: eventDate, courts });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast("大会を作成しました", "success");
        await loadTournament();
        render();
    } else {
        showToast(res.message, "error");
    }
}
async function onApproveTeam(teamId) {
    showLoadingSpinner(true);
    const res = await apiPostAuthed("approveTeam", { team_id: teamId });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast("チームを承認しました", "success");
        await loadTournament();
        render();
    } else {
        showToast(res.message, "error");
    }
}
async function onGenerateSchedule() {
    showLoadingSpinner(true);
    const res = await apiPostAuthed("generateSchedule", { tournament_id: appState.tournamentId });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast("対戦表を生成しました", "success");
        await loadTournament();
        render();
    } else {
        showToast(res.message, "error");
    }
}

/* ---------- 6. 共通UIヘルパー ---------- */
function emptyState(icon, text) {
    return `<div class="empty-state"><div class="icon">${icon}</div><p>${escapeHtml(text)}</p></div>`;
}
function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);
}
function showLoadingSpinner(show) {
    document.getElementById("loadingOverlay").classList.toggle("show", !!show);
}

/* ---------- 7. 3Dティルト（グラスカード・スコアボード用） ---------- */
function enableTilt(selector) {
    document.querySelectorAll(selector).forEach((card) => {
        if (card.dataset.tiltBound) return;
        card.dataset.tiltBound = "1";
        const strength = 8; // 度
        card.addEventListener("pointermove", (e) => {
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            const target = card.querySelector(".scoreboard-inner") || card;
            target.style.transform = `perspective(900px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg)`;
            card.classList.add("tilt-active");
        });
        card.addEventListener("pointerleave", () => {
            const target = card.querySelector(".scoreboard-inner") || card;
            target.style.transform = "";
            card.classList.remove("tilt-active");
        });
    });
}
