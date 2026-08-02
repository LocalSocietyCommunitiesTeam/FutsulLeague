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
    users: [],                      // チームに紐づく出場メンバー一覧（getTournamentで同梱取得）
    rankings: { team_rankings: [], individual_rankings: [] },
    rankingsLoaded: false,          // ランキングの自動読み込みを1回だけに制御するフラグ
    rankingTab: "team",             // "team" | "individual"
    selectedMatchId: null,
    scoreEntry: { side: null },     // "home" | "away" | null（自チーム選択トグル）
    entry: { selectedTeamId: null },// 出場メンバー登録画面で選択中のチーム
    archive: { years: [], yearsLoaded: false, selectedYear: null, data: null, rankingTab: "team" },
    admin: {
        tournaments: [], tournamentsLoaded: false,      // 管理者ダッシュボードの「登録済み大会一覧」
        selectedTournamentId: null,                     // 管理対象として選択中の大会
        selectedTournament: null, selectedTeams: [], selectedUsers: [], selectedMatches: [],
    },
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

/**
 * イベント委譲は document 単位に一本化する。
 * ヘッダー（戻るボタン等）は render のたびに innerHTML で差し替えられるため、
 * screenRoot だけにリスナーを張ると画面外（ヘッダー）のボタンが反応しない。
 * → 「戻るボタンが効かない」不具合の原因だったため、document委譲に統一して解消。
 */
function bindGlobalEvents() {
    document.addEventListener("click", onGlobalClick);
    document.addEventListener("input", onGlobalInput);
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

/** 画面ごとの「戻る」の遷移先。ヘッダー戻るボタンから参照する。 */
function getBackRoute() {
    const map = {
        entry: "home",
        matchDetail: "schedule",
        adminLogin: "home",
        adminDashboard: "home",
    };
    return map[appState.route] || "home";
}

function renderHeader() {
    const map = {
        home: { title: "本社部対抗フットサルリーグ", back: false },
        entry: { title: "出場メンバー登録", back: true },
        schedule: { title: "タイムスケジュール", back: false },
        matchDetail: { title: "試合詳細", back: true },
        ranking: { title: "ランキング", back: false },
        archive: { title: "過去大会アーカイブ", back: false },
        adminLogin: { title: "管理者ログイン", back: true },
        adminDashboard: { title: "管理者ダッシュボード", back: true },
    };
    const conf = map[appState.route] || map.home;
    headerBrand.innerHTML = conf.back
        ? `<button class="icon-btn back-btn-icon" data-action="goBack" aria-label="戻る">
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

/* ---------- 3. クリック / 入力の委譲ハンドラ（document単位） ---------- */
function onGlobalClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const handlers = {
        openAdminMenu: () => navigate(appState.isAdmin ? "adminDashboard" : "adminLogin"),
        navigateRoute: () => navigate(el.dataset.route),
        goBack: () => navigate(getBackRoute()),
        goEntry: () => navigate("entry"),
        goSchedule: () => navigate("schedule"),
        goRanking: () => navigate("ranking"),
        goArchive: () => navigate("archive"),
        openMatch: () => navigate("matchDetail", { selectedMatchId: el.dataset.matchId, scoreEntry: { side: null } }),
        selectSide: () => selectScoreSide(el.dataset.side),
        submitScore: () => onSubmitScore(),
        addMember: () => addMemberRow(),
        removeMember: () => removeMemberRow(el),
        addNewTeamRow: () => addNewTeamRow(),
        removeNewTeamRow: () => removeNewTeamRow(el),
        selectEntryTeam: () => { appState.entry.selectedTeamId = el.dataset.teamId; render(); },
        submitMembers: () => onSubmitMembers(),
        switchRankingTab: () => switchRankingTab(el.dataset.tab),
        reloadRankings: () => { appState.rankingsLoaded = false; render(); },
        selectArchiveYear: () => onSelectArchiveYear(el.dataset.year),
        switchArchiveRankingTab: () => switchArchiveRankingTab(el.dataset.tab),
        reloadArchiveYears: () => { appState.archive.yearsLoaded = false; render(); },
        reloadArchiveYearData: () => onSelectArchiveYear(appState.archive.selectedYear),
        submitAdminLogin: () => onAdminLogin(),
        adminLogout: () => onAdminLogout(),
        generateSchedule: () => onGenerateSchedule(),
        createTournament: () => onCreateTournament(),
        createTeam: () => onCreateTeam(),
        selectAdminTournament: () => onSelectAdminTournament(el.dataset.tournamentId),
        selectChip: () => selectChip(el),
    };
    if (handlers[action]) handlers[action]();
}

function onGlobalInput(e) {
    if (appState.route === "matchDetail") validateScoreForm();
    if (e.target.classList && e.target.classList.contains("member-name")) {
        convertSpaceRealtime(e.target);
    }
    if (e.target.classList && e.target.classList.contains("member-dept")) {
        if (e.target.value.trim()) e.target.classList.remove("error");
    }
    if (["scheduleMatchDuration", "scheduleInterval", "scheduleStartTime"].includes(e.target.id)) {
        updateScheduleEstimate();
    }
}

/** 半角スペースをリアルタイムに全角スペースへ変換する（カーソル位置は維持） */
function convertSpaceRealtime(el) {
    const pos = el.selectionStart;
    const converted = toFullWidthSpace(el.value);
    if (converted !== el.value) {
        el.value = converted;
        el.setSelectionRange(pos, pos);
    }
}
function toFullWidthSpace(str) {
    return String(str || "").replace(/ /g, "　");
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
        appState.users = res.data.users || [];
    } else {
        showToast(res.message || "大会情報の取得に失敗しました", "error");
    }
}

/** ランキング取得。成否に関わらず rankingsLoaded を立てることで自動再取得を1回に限定する。 */
async function loadRankings() {
    const fiscalYear = new Date().getFullYear();
    const res = await apiGet("getRankings", { fiscal_year: fiscalYear });
    if (res.status === "success") {
        appState.rankings = res.data;
    } else {
        showToast(res.message || "ランキングの取得に失敗しました", "error");
    }
    appState.rankingsLoaded = true;
    if (appState.route === "ranking") render();
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
    if (appState.route === "adminDashboard") updateScheduleEstimate();
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
    ${heroTrophyHtml("TOURNAMENT", t.name)}
    <div class="glass-card tilt">
      <p class="text-dim">${escapeHtml(t.event_date)} 開催 ／ ステータス: ${statusLabel(t.status)}</p>
      <div class="flex gap-8 mt-16">
        <button class="btn btn-primary" data-action="goSchedule">対戦表を見る</button>
        <button class="btn btn-ghost" data-action="goEntry">出場メンバー登録</button>
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

/** トロフィー写真を使ったヒーローバナー（ホーム・ランキング画面で使用） */
function heroTrophyHtml(eyebrow, title) {
    return `
    <div class="hero-trophy tilt">
      <img src="images/trophy.jpg" alt="トロフィー" loading="lazy">
      <div class="hero-trophy-overlay">
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
    </div>`;
}

function statusLabel(s) {
    return { PLANNING: "開催準備中", IN_PROGRESS: "開催中", FINISHED: "終了" }[s] || s;
}

/* =========================================================================
   U02 : 出場メンバー登録画面
   ・チームは管理者が事前登録済み（本画面ではチーム作成は行わない）
   ・参加者（代表者）はチームを選び、出場メンバーの登録・編集のみを行う
   ・一度登録済みのチームも、既存メンバーを引き継いで再編集できる
   ========================================================================= */
function renderEntry() {
    const teams = appState.teams;
    if (!teams.length) {
        return emptyState("👥", "エントリー可能なチームがまだ登録されていません。管理者にお問い合わせください。");
    }
    if (!appState.entry.selectedTeamId || !teams.some((t) => t.team_id === appState.entry.selectedTeamId)) {
        appState.entry.selectedTeamId = teams[0].team_id;
    }
    const team = teams.find((t) => t.team_id === appState.entry.selectedTeamId);
    const showDept = team.type === "JOINT";

    const teamChips = teams.map((t) => `
    <button type="button" class="select-chip ${t.team_id === team.team_id ? "selected" : ""}" data-action="selectEntryTeam" data-team-id="${t.team_id}">${escapeHtml(t.name)}</button>
  `).join("");

    const deptNote = showDept
        ? "氏名と部署名の両方を入力してください（合同チームは部署名の入力が必須です）。"
        : `氏名を入力してください（部署は「${escapeHtml(team.name)}」として自動登録されます）。`;

    return `
    <div class="glass-card">
      <h3>チームを選択</h3>
      <p class="text-dim mt-8">出場するチームを選んで、メンバーを登録・編集してください。</p>
      <div class="select-chip-group mt-8">${teamChips}</div>

      <h3 class="mt-16">${escapeHtml(team.name)} の出場メンバー</h3>
      <p class="text-dim mt-8">${deptNote}</p>
      <div id="memberList" class="mt-8">${buildMemberRowsHtml(team, showDept)}</div>
      <button class="btn btn-ghost mt-8" data-action="addMember">＋ メンバーを追加</button>

      <button class="btn btn-primary btn-block mt-16" data-action="submitMembers">出場メンバーを登録する</button>
      <p class="error-text hidden" id="entryError"></p>
    </div>
  `;
}

/** 既存メンバーを引き継ぎつつ、最低5枠は常に表示する */
function buildMemberRowsHtml(team, showDept) {
    const existing = appState.users.filter((u) => u.team_id === team.team_id);
    const rowCount = Math.max(existing.length, 5);
    let html = "";
    for (let i = 0; i < rowCount; i++) {
        html += memberRowHtml(i + 1, existing[i] || {}, showDept);
    }
    return html;
}

/** 氏名プレースホルダーは奇数行=「明安　太郎」／偶数行=「明安　花子」を交互表示 */
function memberRowHtml(idx, prefill = {}, showDept = true) {
    const placeholder = idx % 2 === 1 ? "明安　太郎" : "明安　花子";
    return `
    <div class="member-row ${showDept ? "" : "no-dept"}" data-row="${idx}">
      <input class="field member-name" placeholder="${placeholder}" maxlength="20" value="${escapeHtml(prefill.name || "")}">
      ${showDept ? `<input class="field member-dept" placeholder="部署名" maxlength="20" value="${escapeHtml(prefill.department || "")}">` : ""}
      <button type="button" class="remove-btn" data-action="removeMember">×</button>
    </div>`;
}

function addMemberRow() {
    const team = appState.teams.find((t) => t.team_id === appState.entry.selectedTeamId);
    const showDept = !!team && team.type === "JOINT";
    const list = document.getElementById("memberList");
    const nextIdx = list.children.length + 1;
    list.insertAdjacentHTML("beforeend", memberRowHtml(nextIdx, {}, showDept));
}
function removeMemberRow(btn) {
    const rows = document.querySelectorAll(".member-row");
    if (rows.length <= 1) return; // 最低1枠は残す（UI上の下限。入力必須ではない）
    btn.closest(".member-row").remove();
}
function selectChip(el) {
    el.parentElement.querySelectorAll(".select-chip").forEach((c) => c.classList.remove("selected"));
    el.classList.add("selected");
}

async function onSubmitMembers() {
    const team = appState.teams.find((t) => t.team_id === appState.entry.selectedTeamId);
    const errorEl = document.getElementById("entryError");
    if (!team) { showToast("チームを選択してください", "error"); return; }

    const showDept = team.type === "JOINT";
    let hasMissingDept = false;

    const members = [...document.querySelectorAll(".member-row")]
        .map((row) => {
            const name = toFullWidthSpace(row.querySelector(".member-name").value.trim());
            let department = team.name; // 単一部署チームは部署名入力なし、チーム名に合わせる
            if (showDept) {
                const deptInput = row.querySelector(".member-dept");
                department = toFullWidthSpace(deptInput.value.trim());
                const missing = !!name && !department; // 氏名ありなのに部署名なし＝合同チームでは不可
                deptInput.classList.toggle("error", missing);
                if (missing) hasMissingDept = true;
            }
            return { name, department };
        })
        .filter((m) => m.name); // 空行は無視。5人以下でもエントリー可能。

    if (!members.length) {
        errorEl.textContent = "出場メンバーを1名以上入力してください。";
        errorEl.classList.remove("hidden");
        return;
    }
    if (showDept && hasMissingDept) {
        errorEl.textContent = "合同チームは、出場メンバーごとに部署名を入力してください。";
        errorEl.classList.remove("hidden");
        return;
    }
    errorEl.classList.add("hidden");

    showLoadingSpinner(true);
    const res = await apiPost({ action: "submitMembers", team_id: team.team_id, members });
    showLoadingSpinner(false);

    if (res.status === "success") {
        showToast("出場メンバーを登録しました", "success");
        await loadTournament(); // appState.users を最新化（再編集にも即対応）
        navigate("home");
    } else {
        showToast(res.message || "登録に失敗しました", "error");
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
   ・データが無い場合の自動読み込みは1回のみ。以降は手動リロードボタンで対応。
   ========================================================================= */
function renderRanking() {
    if (!appState.rankingsLoaded) {
        loadRankings();
        return emptyState("🏆", "ランキングを読み込んでいます…");
    }
    const isEmpty = !appState.rankings.team_rankings.length && !appState.rankings.individual_rankings.length;
    if (isEmpty) {
        return emptyStateWithReload("🏆", "ランキングデータがありません。", "reloadRankings");
    }
    return `
    ${heroTrophyHtml("RANKING", "順位・個人得点ランキング")}
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
function individualRankingHtml(list) {
    list = list || appState.rankings.individual_rankings || [];
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
   ・年度一覧の自動読み込みは1回のみ。データが無ければ手動リロードボタンを表示。
   ・最新（今年度）の大会はアーカイブ対象から除外する（バックエンド側 getArchiveYears で除外済み）。
   ・チーム順位／個人得点をタブで切り替え、全件表示する。
   ・チーム順位は「平均勝ち点」ベースでソートされたデータを表示する（原本の順位表の方式に合わせている）。
   ========================================================================= */
function renderArchive() {
    if (!appState.archive.yearsLoaded) {
        loadArchiveYears();
        return emptyState("📦", "アーカイブを読み込んでいます…");
    }
    if (!appState.archive.years.length) {
        return emptyStateWithReload("📦", "過去大会のアーカイブがありません。", "reloadArchiveYears");
    }
    const yearChips = appState.archive.years.map((y) => `
    <button type="button" class="select-chip ${appState.archive.selectedYear === y ? "selected" : ""}" data-action="selectArchiveYear" data-year="${y}">${y}年度</button>
  `).join("");

    return `
    <div class="select-chip-group">${yearChips}</div>
    ${appState.archive.selectedYear ? archiveRankingSectionHtml() : `<div class="glass-card mt-16"><p class="text-dim">年度を選択してください。</p></div>`}
  `;
}
/** 年度一覧の取得。成否に関わらず yearsLoaded を立てて自動再取得ループを防止する。 */
async function loadArchiveYears() {
    const res = await apiGet("getArchiveYears", {});
    if (res.status === "success") {
        appState.archive.years = res.data.years || [];
    }
    appState.archive.yearsLoaded = true;
    if (appState.route === "archive") render();
}
async function onSelectArchiveYear(year) {
    appState.archive.selectedYear = Number(year);
    appState.archive.rankingTab = "team"; // 年度を切り替えたらチーム順位タブに戻す
    showLoadingSpinner(true);
    const res = await apiGet("getArchiveRankings", { fiscal_year: year });
    showLoadingSpinner(false);
    if (res.status === "success") {
        appState.archive.data = res.data;
    } else {
        appState.archive.data = { team_rankings: [], individual_rankings: [] };
    }
    render();
}
function switchArchiveRankingTab(tab) {
    appState.archive.rankingTab = tab;
    render();
}
function archiveRankingSectionHtml() {
    const data = appState.archive.data || { team_rankings: [], individual_rankings: [] };
    const teamList = data.team_rankings || [];
    const indivList = data.individual_rankings || [];

    if (!teamList.length && !indivList.length) {
        return `<div class="glass-card mt-16">${emptyStateWithReload("🏆", `${appState.archive.selectedYear}年度の順位データがありません。`, "reloadArchiveYearData")}</div>`;
    }

    return `
    <div class="tabs mt-16">
      <button class="tab-btn ${appState.archive.rankingTab === "team" ? "active" : ""}" data-action="switchArchiveRankingTab" data-tab="team">チーム順位</button>
      <button class="tab-btn ${appState.archive.rankingTab === "individual" ? "active" : ""}" data-action="switchArchiveRankingTab" data-tab="individual">個人得点</button>
      <div class="tab-indicator" style="transform: translateX(${appState.archive.rankingTab === "individual" ? "100%" : "0"})"></div>
    </div>
    <div class="glass-card tab-panel">
      ${appState.archive.rankingTab === "team" ? archiveTeamRankingHtml(teamList) : individualRankingHtml(indivList)}
    </div>
  `;
}
/**
 * アーカイブ用チームランキング表示。
 * 表示項目: 順位・チーム名・平均勝点・試合数・勝点(勝/引/敗)・得失点(得/失)。全件表示（上位5件などの制限なし）。
 */
function archiveTeamRankingHtml(list) {
    if (!list.length) return emptyState("🏆", "チーム順位データがありません。");
    return list.map((r) => `
    <div class="rank-row">
      <div class="rank-num">${r.rank}</div>
      <div>
        <div class="team-name">${escapeHtml(r.name)}</div>
        <div class="team-rank-stats">
          <span>試合 ${r.played}</span><span>${r.win}勝${r.draw}分${r.lose}敗</span><span>得${r.gf} 失${r.ga}</span>
        </div>
      </div>
      <div class="rank-points">${r.avg_points.toFixed(2)}<span class="rank-sub">平均勝点</span></div>
    </div>`).join("");
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
    appState.admin = {
        tournaments: [], tournamentsLoaded: false,
        selectedTournamentId: null,
        selectedTournament: null, selectedTeams: [], selectedUsers: [], selectedMatches: [],
    };
    navigate("home");
}

/* =========================================================================
   A02 : 管理者ダッシュボード
   ・通常の運用フローに合わせ、「大会作成」と「チーム登録」を1つのフローに統合。
     大会の基本情報とチーム一覧をまとめて入力し、1回の送信で両方を登録する。
   ・チームの承認フローは廃止（管理者が登録した時点で確定）。
   ・出場メンバー登録は参加者が行うため、本画面には含めない。
   ・対戦表自動生成の試合時間／インターバル／開始時刻はここで編集できる。
   ========================================================================= */
/* =========================================================================
   A02 : 管理者ダッシュボード
   ・通常の運用フローに合わせ、「大会作成」と「チーム登録」を1つのフローに統合。
     大会の基本情報とチーム一覧をまとめて入力し、1回の送信で両方を登録する。
   ・チームの承認フローは廃止（管理者が登録した時点で確定）。
   ・出場メンバー登録は参加者が行うため、本画面には含めない。
   ・「登録済み大会一覧」から操作対象の大会を明示的に選択する方式にし、
     チーム追加・対戦表生成は常に選択中の大会に対して行われる（どの大会を触っているか曖昧にならないようにする）。
   ・対戦表自動生成は、事前に試合数・所要時間の見積もりを表示し、
     既に対戦表が生成済みの場合は上書き確認を必須にすることで、誤操作による事故を防ぐ。
   ========================================================================= */
function renderAdminDashboard() {
    if (!appState.isAdmin) {
        navigate("adminLogin");
        return "";
    }
    if (!appState.admin.tournamentsLoaded) {
        loadAdminTournaments();
        return adminShellHtml(emptyState("🏆", "大会一覧を読み込んでいます…"));
    }
    return adminShellHtml(`
    ${adminTournamentListHtml()}
    ${adminCreateTournamentHtml()}
    ${appState.admin.selectedTournamentId ? adminSelectedTournamentSectionsHtml() : ""}
  `);
}

/** 管理者ダッシュボード共通のヘッダー部分（ログアウトボタン等）でコンテンツを包む */
function adminShellHtml(innerHtml) {
    return `
    <div class="flex gap-8" style="justify-content:space-between;align-items:center;">
      <span class="admin-badge">● 管理者モード</span>
      <button class="btn btn-ghost" data-action="adminLogout">ログアウト</button>
    </div>
    ${innerHtml}
  `;
}

/* ---------- 登録済み大会一覧 ---------- */
function adminTournamentListHtml() {
    const tournaments = appState.admin.tournaments;
    return `
    <div class="admin-section-title">登録済み大会（${tournaments.length}）</div>
    <div class="glass-card">
      ${tournaments.length ? tournaments.map(adminTournamentCardHtml).join("") : `<p class="text-dim">大会がまだ登録されていません。下のフォームから作成してください。</p>`}
    </div>
  `;
}
function adminTournamentCardHtml(t) {
    const isSelected = t.tournament_id === appState.admin.selectedTournamentId;
    return `
    <div class="admin-tournament-card ${isSelected ? "selected" : ""}" data-action="selectAdminTournament" data-tournament-id="${t.tournament_id}">
      <div class="flex" style="justify-content:space-between;align-items:flex-start;gap:10px;">
        <div>
          <div class="team-name">${escapeHtml(t.name)}</div>
          <div class="text-dim" style="font-size:12px;margin-top:2px;">${escapeHtml(t.event_date)} ・ ${statusLabel(t.status)}</div>
        </div>
        <div class="text-dim" style="font-size:12px;text-align:right;white-space:nowrap;">
          チーム ${t.team_count}<br>試合 ${t.match_count}
        </div>
      </div>
      ${isSelected ? `<div class="admin-selected-badge mt-8">操作対象に選択中</div>` : ""}
    </div>`;
}

/* ---------- 大会作成 ＆ チーム登録 ---------- */
function adminCreateTournamentHtml() {
    return `
    <div class="glass-card mt-16">
      <h3>大会作成 ＆ チーム登録</h3>
      <p class="text-dim mt-8">大会の基本情報と参加チームをまとめて登録します（後からチームを追加することもできます）。</p>

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

      <h4 class="mt-16">参加チーム</h4>
      <div id="newTeamList" class="mt-8">
        ${newTeamRowHtml(1)}
      </div>
      <button class="btn btn-ghost mt-8" data-action="addNewTeamRow">＋ チームを追加</button>

      <button class="btn btn-primary btn-block mt-16" data-action="createTournament">大会を作成する</button>
    </div>
  `;
}

/** 選択中の大会に対する操作セクション（チーム追加・登録済みチーム・対戦表自動生成） */
function adminSelectedTournamentSectionsHtml() {
    const t = appState.admin.selectedTournament;
    if (!t) return "";
    const teams = appState.admin.selectedTeams;

    return `
    ${adminAddTeamHtml(t)}
    ${adminTeamListHtml(t, teams)}
    ${adminScheduleHtml(t, teams)}
  `;
}

function adminAddTeamHtml(t) {
    return `
    <div class="glass-card mt-16">
      <h3>チームを追加登録</h3>
      <p class="text-dim mt-8">対象の大会: <strong>${escapeHtml(t.name)}</strong>（${escapeHtml(t.event_date)}）</p>
      <div class="form-group mt-16">
        <label class="field-label" for="addTeamName">チーム名</label>
        <input class="field" id="addTeamName" placeholder="例：営業企画部 A" maxlength="30">
      </div>
      <div class="form-group">
        <label class="field-label">参加形態</label>
        <div class="select-chip-group" id="addTeamTypeGroup">
          <button type="button" class="select-chip selected" data-action="selectChip" data-value="SINGLE">単一部署</button>
          <button type="button" class="select-chip" data-action="selectChip" data-value="JOINT">合同チーム</button>
        </div>
      </div>
      <button class="btn btn-primary" data-action="createTeam">チームを追加</button>
    </div>
  `;
}

function adminTeamListHtml(t, teams) {
    return `
    <div class="admin-section-title">登録済みチーム（${escapeHtml(t.name)} ・ ${teams.length}）</div>
    <div class="glass-card">
      ${teams.length ? teams.map((tm) => {
        const memberCount = appState.admin.selectedUsers.filter((u) => u.team_id === tm.team_id).length;
        return `<div class="pending-row">
          <span>${escapeHtml(tm.name)} <span class="text-dim">(${tm.type === "JOINT" ? "合同" : "単一"} ・ ${memberCount}名登録済み)</span></span>
        </div>`;
    }).join("") : `<p class="text-dim">登録済みのチームはありません。</p>`}
    </div>
  `;
}

/**
 * 対戦表自動生成セクション。
 * 管理者の利用シナリオ（チーム数を見て時間配分を調整する／既存の対戦表を誤って上書きしたくない）を
 * 想定し、以下を追加している:
 *   - 対象大会・登録チーム数を明示
 *   - チーム数から試合数・終了予定時刻をその場で見積もり表示（入力を変えるとリアルタイムに再計算）
 *   - チーム数が2未満、または大会が終了済み(FINISHED)の場合はボタンを無効化し理由を表示
 *   - 既に対戦表が生成済みの場合は警告バナーを出し、実行時に上書き確認を必須にする
 */
function adminScheduleHtml(t, teams) {
    const teamCount = teams.length;
    const matchCount = appState.admin.selectedMatches.length;
    const canGenerate = teamCount >= 2 && t.status !== "FINISHED";
    const alreadyGenerated = matchCount > 0;

    let disabledReason = "";
    if (t.status === "FINISHED") disabledReason = "この大会は終了済みのため、対戦表は生成できません。";
    else if (teamCount < 2) disabledReason = "対戦表を生成するには、チームを2チーム以上登録してください。";

    return `
    <div class="glass-card mt-16">
      <h3>対戦表自動生成</h3>
      <p class="text-dim mt-8">対象の大会: <strong>${escapeHtml(t.name)}</strong>（${escapeHtml(t.event_date)}） ／ 登録チーム数: ${teamCount}</p>

      ${alreadyGenerated ? `
        <div class="schedule-warning mt-8">
          ⚠️ この大会には既に対戦表が生成されています（現在 ${matchCount}試合）。<br>
          再生成すると、これまでの試合結果はすべて上書きされます。
        </div>` : ""}

      <div class="form-group mt-16">
        <label class="field-label" for="scheduleMatchDuration">試合時間（分）</label>
        <input class="field" id="scheduleMatchDuration" type="number" min="1" value="8">
      </div>
      <div class="form-group">
        <label class="field-label" for="scheduleInterval">インターバル（分）</label>
        <input class="field" id="scheduleInterval" type="number" min="0" value="2">
      </div>
      <div class="form-group">
        <label class="field-label" for="scheduleStartTime">試合開始時間</label>
        <input class="field" id="scheduleStartTime" type="time" value="19:15">
      </div>

      <div class="schedule-estimate" id="scheduleEstimateBox"></div>

      ${!canGenerate ? `<p class="error-text mt-8" style="display:block;">${disabledReason}</p>` : ""}
      <button class="btn btn-primary mt-16" data-action="generateSchedule" ${canGenerate ? "" : "disabled"}>
        ${alreadyGenerated ? "対戦表を再生成する" : "対戦表を生成する"}
      </button>
    </div>
  `;
}

/** チーム数・試合時間設定から、総試合数と終了予定時刻をその場で見積もる（入力変更のたびに呼ばれる） */
function updateScheduleEstimate() {
    const box = document.getElementById("scheduleEstimateBox");
    if (!box) return;
    const t = appState.admin.selectedTournament;
    const teamCount = appState.admin.selectedTeams.length;
    const durationInput = document.getElementById("scheduleMatchDuration");
    const intervalInput = document.getElementById("scheduleInterval");
    const startInput = document.getElementById("scheduleStartTime");
    if (!t || !durationInput) { box.innerHTML = ""; return; }

    const duration = Number(durationInput.value) || 0;
    const interval = Number(intervalInput.value) || 0;
    const startTime = startInput.value || "";
    const courts = String(t.courts || "").split(",").map((c) => c.trim()).filter(Boolean);
    const courtCount = courts.length || 1;

    if (teamCount < 2) {
        box.innerHTML = `<p class="text-dim mt-8">チームを2チーム以上登録すると、試合数の見積もりが表示されます。</p>`;
        return;
    }

    const totalMatches = (teamCount * (teamCount - 1)) / 2; // 総当たり戦の試合数
    const rounds = Math.ceil(totalMatches / courtCount);
    const totalMinutes = rounds * (duration + interval);

    let endLabel = "-";
    if (startTime && (duration + interval) > 0) {
        const [h, m] = startTime.split(":").map(Number);
        const endTotal = h * 60 + m + totalMinutes;
        const eh = Math.floor(endTotal / 60) % 24;
        const em = endTotal % 60;
        endLabel = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
    }

    box.innerHTML = `
    <div class="schedule-estimate-row"><span>総当たり試合数</span><strong>${totalMatches}試合</strong></div>
    <div class="schedule-estimate-row"><span>使用コート数</span><strong>${courtCount}面</strong></div>
    <div class="schedule-estimate-row"><span>終了予定時刻</span><strong>${startTime || "-"} 〜 ${endLabel}（約${totalMinutes}分）</strong></div>
  `;
}

/** 大会一覧の取得。成否に関わらず tournamentsLoaded を立てて自動再取得ループを防止する。 */
async function loadAdminTournaments() {
    const res = await apiPostAuthed("getAdminTournaments", {});
    if (res.status === "success") {
        appState.admin.tournaments = res.data.tournaments || [];
    } else {
        showToast(res.message || "大会一覧の取得に失敗しました", "error");
        appState.admin.tournaments = [];
    }
    appState.admin.tournamentsLoaded = true;

    // デフォルトの選択対象: 一般画面の「現在の大会」があればそれを、無ければ一覧の先頭を選択する
    if (!appState.admin.selectedTournamentId && appState.admin.tournaments.length) {
        const currentInList = appState.admin.tournaments.find((t) => t.tournament_id === appState.tournament?.tournament_id);
        appState.admin.selectedTournamentId = (currentInList || appState.admin.tournaments[0]).tournament_id;
    }
    if (appState.admin.selectedTournamentId) {
        await loadAdminSelectedTournamentDetail(appState.admin.selectedTournamentId);
    } else if (appState.route === "adminDashboard") {
        render();
    }
}

/** 選択中の大会の詳細（チーム・出場メンバー・試合）を取得する */
async function loadAdminSelectedTournamentDetail(tournamentId) {
    const res = await apiGet("getTournament", { tournament_id: tournamentId });
    if (res.status === "success") {
        appState.admin.selectedTournament = res.data.tournament;
        appState.admin.selectedTeams = res.data.teams || [];
        appState.admin.selectedUsers = res.data.users || [];
        appState.admin.selectedMatches = res.data.matches || [];
    }
    if (appState.route === "adminDashboard") render();
}

async function onSelectAdminTournament(tournamentId) {
    if (tournamentId === appState.admin.selectedTournamentId) return;
    appState.admin.selectedTournamentId = tournamentId;
    showLoadingSpinner(true);
    await loadAdminSelectedTournamentDetail(tournamentId);
    showLoadingSpinner(false);
}

/** 大会作成フォーム内で、参加チームを1件ずつ入力する行 */
function newTeamRowHtml(idx) {
    return `
    <div class="new-team-row" data-row="${idx}">
      <div class="row-top">
        <input class="field new-team-name" placeholder="チーム名（例：営業企画部 A）" maxlength="30">
        <button type="button" class="remove-btn" data-action="removeNewTeamRow">×</button>
      </div>
      <div class="select-chip-group">
        <button type="button" class="select-chip selected" data-action="selectChip" data-value="SINGLE">単一部署</button>
        <button type="button" class="select-chip" data-action="selectChip" data-value="JOINT">合同チーム</button>
      </div>
    </div>`;
}
function addNewTeamRow() {
    const list = document.getElementById("newTeamList");
    const nextIdx = list.children.length + 1;
    list.insertAdjacentHTML("beforeend", newTeamRowHtml(nextIdx));
}
function removeNewTeamRow(btn) {
    const rows = document.querySelectorAll(".new-team-row");
    if (rows.length <= 1) return; // 最低1枠は残す
    btn.closest(".new-team-row").remove();
}

/** 大会作成＋チーム一括登録（通常の運用フロー） */
async function onCreateTournament() {
    const name = document.getElementById("newTournamentName").value.trim();
    const eventDate = document.getElementById("newTournamentDate").value;
    const courts = document.getElementById("newTournamentCourts").value.trim();
    if (!name || !eventDate) { showToast("大会名と開催日を入力してください", "error"); return; }

    const teams = [...document.querySelectorAll(".new-team-row")]
        .map((row) => ({
            name: row.querySelector(".new-team-name").value.trim(),
            type: row.querySelector(".select-chip.selected").dataset.value,
        }))
        .filter((t) => t.name); // チーム名未入力の行は無視（大会だけ作ることも可能）

    showLoadingSpinner(true);
    const res = await apiPostAuthed("createTournament", { name, event_date: eventDate, courts, teams });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast(res.message || "大会を作成しました", "success");
        // 作成した大会を操作対象として選択し、一覧・現行大会情報を更新する
        appState.admin.selectedTournamentId = res.data.tournament_id;
        appState.admin.tournamentsLoaded = false;
        await loadTournament();
        await loadAdminTournaments();
        render();
    } else {
        showToast(res.message, "error");
    }
}

/** 選択中の大会に、チームを1件追加登録する */
async function onCreateTeam() {
    const name = document.getElementById("addTeamName").value.trim();
    const type = document.querySelector("#addTeamTypeGroup .select-chip.selected").dataset.value;
    const tournamentId = appState.admin.selectedTournamentId;
    if (!tournamentId) { showToast("大会を選択してください", "error"); return; }
    if (!name) { showToast("チーム名を入力してください", "error"); return; }
    showLoadingSpinner(true);
    const res = await apiPostAuthed("createTeam", { tournament_id: tournamentId, name, type });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast("チームを登録しました", "success");
        document.getElementById("addTeamName").value = "";
        await loadTournament();
        appState.admin.tournamentsLoaded = false;
        await loadAdminTournaments();
        render();
    } else {
        showToast(res.message, "error");
    }
}

/** 対戦表自動生成（試合時間・インターバル・開始時刻を管理者が編集可能） */
async function onGenerateSchedule() {
    const tournamentId = appState.admin.selectedTournamentId;
    if (!tournamentId) { showToast("大会を選択してください", "error"); return; }
    const existingMatchCount = appState.admin.selectedMatches.length;

    const matchDuration = Number(document.getElementById("scheduleMatchDuration").value);
    const interval = Number(document.getElementById("scheduleInterval").value);
    const startTime = document.getElementById("scheduleStartTime").value;

    if (!matchDuration || matchDuration <= 0) { showToast("試合時間を正しく入力してください", "error"); return; }
    if (Number.isNaN(interval) || interval < 0) { showToast("インターバルを正しく入力してください", "error"); return; }
    if (!startTime) { showToast("試合開始時間を入力してください", "error"); return; }

    // 既に対戦表が生成済みの場合は、上書きしてよいか明示的に確認する（誤操作による事故防止）
    if (existingMatchCount > 0) {
        const confirmed = window.confirm(
            `この大会には既に対戦表が生成されています（現在 ${existingMatchCount}試合）。\n再生成すると、これまでの試合結果はすべて上書きされます。\n本当によろしいですか？`
        );
        if (!confirmed) return;
    }

    showLoadingSpinner(true);
    const res = await apiPostAuthed("generateSchedule", {
        tournament_id: tournamentId,
        match_duration_min: matchDuration,
        interval_min: interval,
        start_time: startTime,
    });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast("対戦表を生成しました", "success");
        await loadTournament();
        appState.admin.tournamentsLoaded = false;
        await loadAdminTournaments();
        render();
    } else {
        showToast(res.message, "error");
    }
}

/* ---------- 6. 共通UIヘルパー ---------- */
function emptyState(icon, text) {
    return `<div class="empty-state"><div class="icon">${icon}</div><p>${escapeHtml(text)}</p></div>`;
}
function emptyStateWithReload(icon, text, reloadAction) {
    return `<div class="empty-state">
    <div class="icon">${icon}</div>
    <p>${escapeHtml(text)}</p>
    <button class="btn mt-16" data-action="${reloadAction}">再読み込み</button>
  </div>`;
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
/** ローディング表示中は背面のスクロールを禁止する（htmlとbody両方にno-scrollを付与） */
function showLoadingSpinner(show) {
    document.getElementById("loadingOverlay").classList.toggle("show", !!show);
    document.documentElement.classList.toggle("no-scroll", !!show);
    document.body.classList.toggle("no-scroll", !!show);
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