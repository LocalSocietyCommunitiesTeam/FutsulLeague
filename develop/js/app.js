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
        showCreateForm: false,                          // 「①大会作成」フォームの開閉状態（大会が既にある場合は畳んでおく）
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
    document.addEventListener("change", onGlobalInput); // <select>のchangeはブラウザによりinputが飛ばないことがあるため両方拾う
    document.addEventListener("keydown", onGlobalKeydown);
}

/**
 * テキスト入力欄で Enter キーを押したら、同じ入力エリア内の主要な送信ボタン
 * （data-enter-submit を付けた要素）をクリックしたことにする。
 * 現状は管理者ログインのパスワード欄で使用。
 */
function onGlobalKeydown(e) {
    if (e.key !== "Enter") return;
    const input = e.target.closest("[data-enter-submit]");
    if (!input) return;
    const targetSelector = input.dataset.enterSubmit;
    const submitBtn = document.querySelector(targetSelector);
    if (submitBtn) {
        e.preventDefault();
        submitBtn.click();
    }
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
        ranking: { title: "順位", back: false },
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
        addScorerRow: () => addScorerRow(el.dataset.side, el.dataset.teamId),
        goToEntryForTeam: () => goToEntryForTeam(el.dataset.teamId),
        addMember: () => addMemberRow(),
        removeMember: () => removeMemberRow(el),
        addCourtRow: () => addCourtRow(),
        removeCourtRow: () => removeCourtRow(el),
        copyCourtTimesToAll: () => copyCourtTimesToAll(),
        saveCourts: () => onSaveCourts(),
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
        deleteTournament: () => onDeleteTournament(el.dataset.tournamentId),
        updateTournamentStatus: () => onUpdateTournamentStatus(el.dataset.tournamentId, el.dataset.status),
        toggleCreateTournamentForm: () => toggleCreateTournamentForm(),
        confirmSchedule: () => onConfirmSchedule(),
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
    if (["scheduleMatchDuration", "scheduleInterval", "scheduleFirstMatchTime", "scheduleLastMatchEndTime"].includes(e.target.id)) {
        updateScheduleUI();
    }
    if (e.target.classList && (e.target.classList.contains("court-name") || e.target.classList.contains("court-start") || e.target.classList.contains("court-end"))) {
        updateSimpleCourtTimeline();
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
    const fiscalYear = getCurrentFiscalYear();
    const res = await apiGet("getRankings", { fiscal_year: fiscalYear });
    if (res.status === "success") {
        appState.rankings = res.data;
    } else {
        showToast(res.message || "順位の取得に失敗しました", "error");
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
    if (appState.route === "adminDashboard") { updateSimpleCourtTimeline(); updateScheduleUI(); enableMatchDragDrop(); }
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
      <p class="text-dim">${escapeHtml(formatDateDisplay(t.event_date))} 開催 ／ ステータス: ${statusLabel(t.status)}</p>
      <div class="flex gap-8 mt-16">
        <button class="btn btn-primary" data-action="goSchedule">対戦表を見る</button>
        <button class="btn btn-ghost" data-action="goEntry">出場メンバー登録</button>
      </div>
    </div>
    <div class="glass-card tilt mt-16">
      <span class="eyebrow">RANKING</span>
      <h2>順位・個人得点</h2>
      <p class="text-dim mt-8">チーム・個人の順位をリアルタイムで確認できます。</p>
      <button class="btn mt-16" data-action="goRanking">順位を見る</button>
    </div>
    <div class="glass-card tilt mt-16">
      <span class="eyebrow">ARCHIVE</span>
      <h2>過去大会アーカイブ</h2>
      <p class="text-dim mt-8">過去の試合結果・最終順位を振り返る。</p>
      <button class="btn mt-16" data-action="goArchive">アーカイブを見る</button>
    </div>
  `;
}

/** トロフィー写真を使ったヒーローバナー（ホーム・順位画面で使用） */
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
    return { PLANNING: "これから", IN_PROGRESS: "開催中", FINISHED: "終了" }[s] || s;
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
        <span>${formatTimeDisplay(m.start_time)}〜${formatTimeDisplay(m.end_time)}</span>
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
    const tournamentFinished = appState.tournament && appState.tournament.status === "FINISHED";

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
        <div class="scoreboard-court">${escapeHtml(m.court_name)} ／ ${formatTimeDisplay(m.start_time)}〜${formatTimeDisplay(m.end_time)}</div>
      </div>
    </div>

    ${tournamentFinished ? `
    <div class="glass-card">
      <h3>結果を入力する</h3>
      <p class="text-dim mt-8">この大会は終了しているため、結果の入力はできません。</p>
    </div>
    ` : `
    <div class="glass-card">
      <h3>結果を入力する</h3>
      <p class="text-dim mt-8">自チームを選択すると、そのチームの入力欄のみ操作できます。</p>
      <div class="select-chip-group mt-8">
        <button type="button" class="select-chip ${side === "home" ? "selected" : ""}" data-action="selectSide" data-side="home">${escapeHtml(home)} として入力</button>
        <button type="button" class="select-chip ${side === "away" ? "selected" : ""}" data-action="selectSide" data-side="away">${escapeHtml(away)} として入力</button>
      </div>

      <div class="mt-16">
        ${teamEntryPanelHtml("home", home, m.home_team_id, side)}
        ${teamEntryPanelHtml("away", away, m.away_team_id, side)}
      </div>

      <button class="btn btn-primary btn-block mt-16" id="submitScoreBtn" data-action="submitScore" disabled>結果を送信</button>
      <p class="error-text hidden" id="scoreError"></p>
    </div>
    `}
  `;
}

function teamEntryPanelHtml(sideKey, name, teamId, activeSide) {
    const isActive = activeSide === sideKey;
    const disabledAttr = isActive ? "" : "disabled";
    const members = appState.users.filter((u) => u.team_id === teamId);
    return `
    <div class="team-panel glass-card ${isActive ? "" : "opponent-locked"} mt-16" data-side-panel="${sideKey}">
      <h4>${escapeHtml(name)}</h4>
      <label class="field-label mt-8">総得点</label>
      <input class="field score-total" data-side="${sideKey}" data-team-id="${teamId}" type="number" min="0" inputmode="numeric" ${disabledAttr}>

      <div data-scorer-section="${sideKey}">
        <label class="field-label mt-8">得点者内訳（選手・得点）</label>
        ${members.length ? `
          <div class="scorer-list" data-scorer-list="${sideKey}" data-team-id="${teamId}">
            ${scorerRowHtml(sideKey, teamId, disabledAttr)}
          </div>
          ${isActive ? `<button type="button" class="btn btn-ghost mt-8 scorer-add-btn" data-action="addScorerRow" data-side="${sideKey}" data-team-id="${teamId}">＋ 得点者を追加</button>` : ""}
        ` : `
          <div class="scorer-empty-state mt-8">
            <p class="text-dim">出場メンバーが登録されていません。得点者を選ぶには、先に出場メンバー登録が必要です。</p>
            ${isActive ? `<button type="button" class="btn btn-primary mt-8" data-action="goToEntryForTeam" data-team-id="${teamId}">出場メンバーを登録する</button>` : ""}
          </div>
        `}
      </div>
    </div>`;
}
/** 得点者1名分の入力行。選手は登録済みメンバーからプルダウンで選ぶ（自由記述の氏名入力は行わない）。 */
function scorerRowHtml(sideKey, teamId, disabledAttr) {
    const members = appState.users.filter((u) => u.team_id === teamId);
    const options = members.map((u) => `<option value="${u.user_id}">${escapeHtml(u.name)}</option>`).join("");
    return `
    <div class="scorer-row">
      <div class="scorer-row-inputs">
        <select class="field scorer-name" data-side="${sideKey}" ${disabledAttr}>
          <option value="">選手を選択</option>
          ${options}
          <option value="__unregistered__">↳ リストにいない選手</option>
        </select>
        <input class="field scorer-points" data-side="${sideKey}" type="number" min="0" placeholder="得点" ${disabledAttr}>
      </div>
      <div class="scorer-unregistered-hint">
        リストにない選手は、先に
        <button type="button" class="link-btn" data-action="goToEntryForTeam" data-team-id="${teamId}">出場メンバー登録</button>
        を行ってください。
      </div>
    </div>`;
}
function addScorerRow(sideKey, teamId) {
    const disabledAttr = appState.scoreEntry.side === sideKey ? "" : "disabled";
    document.querySelector(`[data-scorer-list="${sideKey}"]`).insertAdjacentHTML("beforeend", scorerRowHtml(sideKey, teamId, disabledAttr));
    validateScoreForm();
}
/** チーム未選択のまま得点画面を離れて出場メンバー登録（U02）へ移動し、そのチームを選んだ状態にする */
function goToEntryForTeam(teamId) {
    appState.entry.selectedTeamId = teamId;
    navigate("entry");
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

    // リストにない選手が選択されている得点者行には、行ごとに登録を促すヒントを表示する
    document.querySelectorAll(`[data-scorer-list="${side}"] .scorer-row`).forEach((row) => {
        const select = row.querySelector(".scorer-name");
        row.classList.toggle("show-hint", select && select.value === "__unregistered__");
    });

    const totalInput = document.querySelector(`.score-total[data-side="${side}"]`);
    const total = Number(totalInput.value);
    const totalValid = totalInput.value !== "" && total >= 0 && Number.isInteger(total);

    const scorerSection = document.querySelector(`[data-scorer-section="${side}"]`);
    // 0点の場合は得点者の入力自体が不要なため、内訳セクションを畳んで必須チェックから外す
    if (scorerSection) scorerSection.classList.toggle("scorer-section-collapsed", totalValid && total === 0);

    if (totalValid && total === 0) {
        totalInput.classList.remove("error");
        errorEl.classList.add("hidden");
        btn.disabled = false;
        return;
    }

    const scorerRows = [...document.querySelectorAll(`[data-scorer-list="${side}"] .scorer-row`)];
    const hasUnresolvedRow = scorerRows.some((row) => row.querySelector(".scorer-name")?.value === "__unregistered__");
    const breakdownSum = scorerRows.reduce((sum, row) => {
        const pts = Number(row.querySelector(".scorer-points").value || 0);
        return sum + pts;
    }, 0);

    const sumMatches = totalValid && breakdownSum === total;
    totalInput.classList.toggle("error", totalInput.value !== "" && !sumMatches);

    if (hasUnresolvedRow) {
        errorEl.textContent = "リストにない選手が選択されています。出場メンバー登録を行ってください";
        errorEl.classList.remove("hidden");
    } else if (totalInput.value !== "" && !sumMatches) {
        errorEl.textContent = "総得点と内訳が一致しません";
        errorEl.classList.remove("hidden");
    } else {
        errorEl.classList.add("hidden");
    }
    btn.disabled = !sumMatches || hasUnresolvedRow;
}

async function onSubmitScore() {
    const side = appState.scoreEntry.side;
    const m = appState.matches.find((x) => x.match_id === appState.selectedMatchId);
    const teamId = side === "home" ? m.home_team_id : m.away_team_id;
    const total = Number(document.querySelector(`.score-total[data-side="${side}"]`).value);
    const scorers = total === 0 ? [] : [...document.querySelectorAll(`[data-scorer-list="${side}"] .scorer-row`)]
        .map((row) => ({
            user_id: row.querySelector(".scorer-name").value,
            points: Number(row.querySelector(".scorer-points").value || 0),
        }))
        .filter((s) => s.user_id && s.user_id !== "__unregistered__");

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
   U05 : 順位画面
   ・データが無い場合の自動読み込みは1回のみ。以降は手動リロードボタンで対応。
   ========================================================================= */
function renderRanking() {
    if (!appState.rankingsLoaded) {
        loadRankings();
        return emptyState("🏆", "順位を読み込んでいます…");
    }
    const isEmpty = !appState.rankings.team_rankings.length && !appState.rankings.individual_rankings.length;
    if (isEmpty) {
        return emptyStateWithReload("🏆", "順位データがありません。", "reloadRankings");
    }
    return `
    ${heroTrophyHtml("RANKING", "順位・個人得点")}
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
    // 全チームの試合数が0（まだ1試合も行われていない）場合も、個人得点データが無い場合と同様の空表示にする
    if (!list.length || list.every((r) => r.played === 0)) return emptyState("🏆", "チーム順位データがありません。");
    return list.map((r) => `
    <div class="rank-row">
      <div class="rank-num ${r.rank <= 3 ? "medal" : ""}">${r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</div>
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
    // 年度が複数ある場合のみ選択チップを表示する（1年度しかなければ選ばせず、そのまま表示する）
    const showYearSelector = appState.archive.years.length > 1;
    const yearChips = appState.archive.years.map((y) => `
    <button type="button" class="select-chip ${appState.archive.selectedYear === y ? "selected" : ""}" data-action="selectArchiveYear" data-year="${y}">${y}年度</button>
  `).join("");

    return `
    ${showYearSelector ? `<div class="select-chip-group">${yearChips}</div>` : ""}
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
    // 年度が1つしかない場合は、選択させずそのままそのデータを表示する
    if (appState.archive.years.length === 1 && !appState.archive.selectedYear) {
        await onSelectArchiveYear(appState.archive.years[0]);
        return; // onSelectArchiveYear内でrender()される
    }
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
        appState.archive.data = { team_rankings: [], individual_rankings: [], tournaments: [] };
    }
    render();
}
function switchArchiveRankingTab(tab) {
    appState.archive.rankingTab = tab;
    render();
}
function archiveRankingSectionHtml() {
    const data = appState.archive.data || { team_rankings: [], individual_rankings: [], tournaments: [] };
    const teamList = data.team_rankings || [];
    const indivList = data.individual_rankings || [];
    const tournamentList = data.tournaments || [];

    if (!teamList.length && !indivList.length) {
        return `<div class="glass-card mt-16">${emptyStateWithReload("🏆", `${appState.archive.selectedYear}年度の順位データがありません。`, "reloadArchiveYearData")}</div>`;
    }

    return `
    ${archiveTournamentSummaryHtml(tournamentList)}
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
/** 選択中の年度・その年度に属する大会名の一覧を表示する（1年度に複数大会があり得るため）。 */
function archiveTournamentSummaryHtml(tournamentList) {
    return `
    <div class="glass-card mt-16 archive-tournament-summary">
      <span class="eyebrow">${appState.archive.selectedYear}年度</span>
      ${tournamentList.length
            ? `<ul class="archive-tournament-list">${tournamentList.map((t) => `<li>${escapeHtml(t.name)}<span class="text-dim">（${escapeHtml(formatDateDisplay(t.event_date))}）</span></li>`).join("")}</ul>`
            : `<p class="text-dim mt-8">この年度の大会情報がありません。</p>`}
    </div>
  `;
}
/**
 * アーカイブ用チーム順位表示。
 * 表示項目: 順位・チーム名・平均勝点・試合数・勝点(勝/引/敗)・得失点(得/失)。全件表示（上位5件などの制限なし）。
 */
function archiveTeamRankingHtml(list) {
    if (!list.length || list.every((r) => r.played === 0)) return emptyState("🏆", "チーム順位データがありません。");
    return list.map((r) => `
    <div class="rank-row">
      <div class="rank-num ${r.rank <= 3 ? "medal" : ""}">${r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</div>
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
        <input class="field" id="adminPassword" type="password" data-enter-submit="#adminLoginSubmitBtn">
      </div>
      <button class="btn btn-primary btn-block" id="adminLoginSubmitBtn" data-action="submitAdminLogin">ログイン</button>
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
        showCreateForm: false,
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
    ${adminCreateTournamentSectionHtml()}
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
      ${tournaments.length ? tournaments.map(adminTournamentCardHtml).join("") : `<p class="text-dim">大会がまだ登録されていません。下の「＋ 新しい大会を作成する」から作成してください。</p>`}
    </div>
  `;
}
function adminTournamentCardHtml(t) {
    const isSelected = t.tournament_id === appState.admin.selectedTournamentId;
    const canDelete = t.status !== "FINISHED"; // 終了済み(過去)の大会は削除不可
    return `
    <div class="admin-tournament-card ${isSelected ? "selected" : ""}" data-action="selectAdminTournament" data-tournament-id="${t.tournament_id}">
      <div class="flex" style="justify-content:space-between;align-items:flex-start;gap:10px;">
        <div>
          <div class="team-name">${escapeHtml(t.name)}</div>
          <div class="text-dim" style="font-size:12px;margin-top:2px;">${escapeHtml(formatDateDisplay(t.event_date))} ・ ${statusLabel(t.status)}</div>
        </div>
        <div class="flex gap-8" style="align-items:flex-start;">
          <div class="text-dim" style="font-size:12px;text-align:right;white-space:nowrap;">
            チーム ${t.team_count}<br>試合 ${t.match_count}
          </div>
          ${canDelete
            ? `<button type="button" class="tournament-delete-btn" data-action="deleteTournament" data-tournament-id="${t.tournament_id}" title="この大会を削除" aria-label="この大会を削除">✕</button>`
            : `<span class="tournament-delete-locked" title="終了済みの大会は削除できません">🔒</span>`}
        </div>
      </div>
      ${isSelected ? `<div class="admin-selected-badge mt-8">操作対象に選択中</div>` : ""}
    </div>`;
}

/* ---------- ① 大会作成（大会が既にある場合は畳んでおき、「新規作成モード」だと誤解させない） ---------- */
/* =========================================================================
   運用フロー: ① 大会作成 → ② コート予約 → ③ チーム登録 → ④ 対戦表自動生成（下書き） →
              ⑤ 内容確認・試合順入れ替え → ⑥ 確定（参加者に公開）
   ========================================================================= */
function adminCreateTournamentSectionHtml() {
    const hasTournaments = appState.admin.tournaments.length > 0;
    const isOpen = !hasTournaments || appState.admin.showCreateForm;

    if (!isOpen) {
        // 大会が既にある場合、フォームを常時表示すると「また作らないといけないのか」と誤解されるため、
        // ボタン1つに畳んでおき、必要なときだけ開く。
        return `<button class="btn btn-ghost btn-block mt-16" data-action="toggleCreateTournamentForm">＋ 新しい大会を作成する</button>`;
    }

    return `
    <div class="glass-card mt-16">
      <h3><span class="step-badge">①</span> 大会作成</h3>
      <p class="text-dim mt-8">まずは大会の名前と開催日を登録します。コートの予約やチーム登録は、大会を選択した後の手順で行います。</p>

      <div class="form-group mt-16">
        <label class="field-label" for="newTournamentName">大会名</label>
        <input class="field" id="newTournamentName" placeholder="例：2026年度 第1回大会">
      </div>
      <div class="form-group">
        <label class="field-label" for="newTournamentDate">開催日</label>
        <input class="field" id="newTournamentDate" type="date">
      </div>

      <button class="btn btn-primary btn-block mt-16" data-action="createTournament">大会を作成する</button>
      ${hasTournaments ? `<button class="btn btn-ghost btn-block mt-8" data-action="toggleCreateTournamentForm">キャンセル</button>` : ""}
    </div>
  `;
}

/** 選択中の大会に対する操作セクション（②コート予約 → ③チーム登録 → ④対戦表自動生成 → ⑤確認・確定） */
function adminSelectedTournamentSectionsHtml() {
    const t = appState.admin.selectedTournament;
    if (!t) return "";
    const teams = appState.admin.selectedTeams;
    const matches = appState.admin.selectedMatches;

    return `
    ${adminNextStepBannerHtml(t, teams, matches)}
    ${adminTournamentStatusHtml(t)}
    ${adminCourtsHtml(t)}
    ${adminAddTeamHtml(t, teams)}
    ${adminTeamListHtml(t, teams)}
    ${adminScheduleHtml(t, teams)}
    ${matches.length ? adminScheduleReviewHtml(t, teams, matches) : ""}
  `;
}

/**
 * 「管理者が入力すべきステップを分かるように」するための案内バナー。
 * 選択中の大会の完了状況（コート予約／チーム数／対戦表生成／確定）から、
 * 次に何をすればよいかを1行で示す。全て完了している場合はチェック表示にする。
 */
function adminNextStepBannerHtml(t, teams, matches) {
    const hasCourts = parseCourtsJson(t.courts).length > 0;
    const hasEnoughTeams = teams.length >= 2;
    const hasSchedule = matches.length > 0;
    const isConfirmed = t.schedule_status === "CONFIRMED";

    let text;
    if (!hasCourts) text = "次にやること: ② でコートの予約情報を保存してください。";
    else if (!hasEnoughTeams) text = "次にやること: ③ でチームを2チーム以上登録してください。";
    else if (!hasSchedule) text = "次にやること: ④ で対戦表を生成してください。";
    else if (!isConfirmed) text = "次にやること: ⑤ で内容を確認し、対戦表を確定してください。";
    else text = "✓ すべての手順が完了しています。当日の急な変更があれば ⑤ から試合順を調整できます。";

    const isDone = text.startsWith("✓");
    return `<div class="admin-next-step ${isDone ? "done" : ""}">${escapeHtml(text)}</div>`;
}

/** 大会ステータス（これから／開催中／終了）の選択。「終了」にすると参加者は結果を入力できなくなる。 */
function adminTournamentStatusHtml(t) {
    const options = [
        { value: "PLANNING", label: "これから" },
        { value: "IN_PROGRESS", label: "開催中" },
        { value: "FINISHED", label: "終了" },
    ];
    return `
    <div class="glass-card mt-16">
      <h3>大会ステータス</h3>
      <p class="text-dim mt-8">「終了」にすると、参加者はこの大会の結果・得点者を入力できなくなります。</p>
      <div class="select-chip-group mt-8">
        ${options.map((o) => `<button type="button" class="select-chip ${t.status === o.value ? "selected" : ""}" data-action="updateTournamentStatus" data-tournament-id="${t.tournament_id}" data-status="${o.value}">${o.label}</button>`).join("")}
      </div>
    </div>
  `;
}

/* ---------- ② コート予約（チーム登録より先に行う） ---------- */
/**
 * 運用シナリオ: 運営はまずコートを予約する（普段は19-21時で3コート、空き状況によっては
 * 2コートだったり、時間帯によって使えるコート数が変わることもある）。この予約内容は
 * 対戦表自動生成（④）とは切り離して、ここで先に保存できるようにしている。
 */
function adminCourtsHtml(t) {
    const savedCourts = parseCourtsJson(t.courts);
    const initialCourts = savedCourts.length ? savedCourts : [{ name: "", start: "19:00", end: "21:00" }];
    const courtRows = initialCourts.map((c, i) => courtRowHtml(i + 1, c)).join("");
    const savedBadge = savedCourts.length
        ? `<span class="admin-selected-badge">${savedCourts.length}面 予約済み</span>`
        : `<span class="text-dim" style="font-size:12px;">未予約</span>`;

    return `
    <div class="glass-card mt-16">
      <h3>${stepBadgeHtml(2, savedCourts.length > 0)} コート予約 ${savedBadge}</h3>
      <p class="text-dim mt-8">対象の大会: <strong>${escapeHtml(t.name)}</strong>（${escapeHtml(formatDateDisplay(t.event_date))}）</p>
      <p class="text-dim mt-8">コートごとに予約時間（15分刻み）を入力してください。空き状況によりコート数が少ない場合や、時間帯によって使えるコート数が変わる場合も、コートごとの実際の予約時間をそのまま入力すれば大丈夫です。</p>

      <div id="courtList" class="mt-8">${courtRows}</div>
      <div class="flex-col gap-8 mt-8">
        <button class="btn btn-ghost btn-block" data-action="addCourtRow">＋ コートを追加</button>
        <button class="btn btn-ghost btn-block" data-action="copyCourtTimesToAll" title="1面目の予約時間を、他のすべてのコートにもコピーします">⧉ 1面目の時間に揃える</button>
      </div>

      <div class="court-timeline" id="courtTimelineSimple"></div>

      <button class="btn btn-primary mt-16" data-action="saveCourts">コート予約を保存する</button>
    </div>
  `;
}

/** Tournaments.courts（JSON文字列）をパースする。旧形式（カンマ区切り文字列）や未設定時は空配列にフォールバック。 */
function parseCourtsJson(raw) {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {
        // 旧形式（カンマ区切りのコート名のみ）は自動移行できないため、初期表示にフォールバックする
    }
    return [];
}

/** コート1面分の入力行（名称・予約開始・予約終了） */
function courtRowHtml(idx, court) {
    const c = court || { name: "", start: "19:00", end: "21:00" };
    return `
    <div class="court-row" data-row="${idx}">
      <div class="row-top">
        <input class="field court-name" placeholder="コート名（例：Aコート）" maxlength="20" value="${escapeHtml(c.name || "")}">
        <button type="button" class="remove-btn" data-action="removeCourtRow">×</button>
      </div>
      <div class="court-time-row">
        <div>
          <label class="field-label">予約開始</label>
          <input class="field court-start" type="time" step="900" value="${c.start || "19:00"}">
        </div>
        <div>
          <label class="field-label">予約終了</label>
          <input class="field court-end" type="time" step="900" value="${c.end || "21:00"}">
        </div>
      </div>
    </div>`;
}
function addCourtRow() {
    const list = document.getElementById("courtList");
    const nextIdx = list.children.length + 1;
    list.insertAdjacentHTML("beforeend", courtRowHtml(nextIdx, { name: "", start: "19:00", end: "21:00" }));
    updateSimpleCourtTimeline();
}
function removeCourtRow(btn) {
    const rows = document.querySelectorAll(".court-row");
    if (rows.length <= 1) return; // 最低1面は残す
    btn.closest(".court-row").remove();
    updateSimpleCourtTimeline();
}
/** 1面目の予約開始・終了時刻を、他のすべてのコート行にコピーする */
function copyCourtTimesToAll() {
    const rows = [...document.querySelectorAll(".court-row")];
    if (rows.length < 2) { showToast("コートが1面しかありません", "error"); return; }
    const start = rows[0].querySelector(".court-start").value;
    const end = rows[0].querySelector(".court-end").value;
    rows.slice(1).forEach((row) => {
        row.querySelector(".court-start").value = start;
        row.querySelector(".court-end").value = end;
    });
    updateSimpleCourtTimeline();
    showToast("1面目の時間をすべてのコートに揃えました", "success");
}

/** "HH:mm" が15分刻みかを判定する（フロント側の事前チェック用。最終判定はサーバー側でも行う） */
function isQuarterHourTime(str) {
    if (!/^\d{2}:\d{2}$/.test(str || "")) return false;
    return Number(str.split(":")[1]) % 15 === 0;
}

/**
 * コート予約ステップ用のシンプルなタイムライン。
 * まだ試合時間・第1試合開始時間が決まっていない段階なので、予約時間の帯だけを表示し、
 * 「使える／使えない」の判定はしない（それは④対戦表自動生成のタイムラインで行う）。
 */
function updateSimpleCourtTimeline() {
    const box = document.getElementById("courtTimelineSimple");
    if (!box) return;
    const courtRows = [...document.querySelectorAll(".court-row")].map((row) => ({
        name: row.querySelector(".court-name").value.trim() || "(名称未設定)",
        start: row.querySelector(".court-start").value,
        end: row.querySelector(".court-end").value,
    })).filter((c) => c.start && c.end);

    if (!courtRows.length) { box.innerHTML = ""; return; }
    renderCourtTimeline(box, courtRows, null, null);
}

/** コート予約を保存する（対戦表はまだ生成しない）。運用上「まずコートを押さえる」ための独立した操作。 */
async function onSaveCourts() {
    const tournamentId = appState.admin.selectedTournamentId;
    if (!tournamentId) { showToast("大会を選択してください", "error"); return; }

    const courts = [...document.querySelectorAll(".court-row")].map((row) => ({
        name: row.querySelector(".court-name").value.trim(),
        start: row.querySelector(".court-start").value,
        end: row.querySelector(".court-end").value,
    }));
    if (!courts.length) { showToast("コートを1面以上設定してください", "error"); return; }
    if (courts.some((c) => !c.name)) { showToast("すべてのコートにコート名を入力してください", "error"); return; }
    if (courts.some((c) => !c.start || !c.end)) { showToast("すべてのコートに予約時間を入力してください", "error"); return; }
    if (courts.some((c) => !isQuarterHourTime(c.start) || !isQuarterHourTime(c.end))) {
        showToast("コートの予約時間は15分刻みで入力してください", "error"); return;
    }
    if (courts.some((c) => c.start >= c.end)) { showToast("コートの予約終了時刻は開始時刻より後にしてください", "error"); return; }

    showLoadingSpinner(true);
    const res = await apiPostAuthed("saveCourts", { tournament_id: tournamentId, courts });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast(res.message || "コート予約を保存しました", "success");
        await loadAdminSelectedTournamentDetail(tournamentId);
        render();
    } else {
        showToast(res.message, "error");
    }
}

/* ---------- ③ チーム登録（コート予約の後に行う） ---------- */
function adminAddTeamHtml(t, teams) {
    return `
    <div class="glass-card mt-16">
      <h3>${stepBadgeHtml(3, teams.length >= 2)} チーム登録</h3>
      <p class="text-dim mt-8">対象の大会: <strong>${escapeHtml(t.name)}</strong>（${escapeHtml(formatDateDisplay(t.event_date))}）</p>
      <p class="text-dim mt-8">部署からのエントリーが決まり次第、1件ずつ追加してください（1大会あたり目安12部署程度。人数が少ない部署は合同チームで参加できます）。</p>
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

/* ---------- ④ 対戦表自動生成 ---------- */
/**
 * 対戦表自動生成セクション。
 *
 * 【アルゴリズムの前提（実運用シナリオに合わせて変更）】
 *   12チーム規模だと総当たり戦は時間的に組めないため、総当たりを保証するのではなく、
 *   「全チームの試合数をできるだけ揃える」「同一チームが3試合以上連続にならない」ことを
 *   優先したラウンドベースの割り当てにしている（詳細は schedule.gs 参照）。
 *   そのため、以前のような「枠が足りずエラーで止まる」ことは無く、入力した時間の中で
 *   できるだけ公平に組んだ対戦表が必ず生成される。
 *
 * 【UI】
 *   - コートは②で保存済みの内容を読み取り専用のサマリーとして表示する（変更は②で行う）
 *   - 試合時間・インターバル・第1試合開始時間を入力すると、コートごとの使用可否・
 *     見積もり試合数をその場でビジュアルタイムライン＋数値で確認できる
 *   - 生成すると「下書き」状態になり、まだ参加者には公開されない（⑤で確定して初めて公開）
 */
function adminScheduleHtml(t, teams) {
    const teamCount = teams.length;
    const savedCourts = parseCourtsJson(t.courts);
    const hasCourts = savedCourts.length > 0;
    const alreadyGenerated = appState.admin.selectedMatches.length > 0;
    const canGenerate = teamCount >= 2 && hasCourts && t.status !== "FINISHED";

    let disabledReason = "";
    if (t.status === "FINISHED") disabledReason = "この大会は終了済みのため、対戦表は生成できません。";
    else if (!hasCourts) disabledReason = "先に②でコート予約を保存してください。";
    else if (teamCount < 2) disabledReason = "対戦表を生成するには、チームを2チーム以上登録してください。";

    return `
    <div class="glass-card mt-16">
      <h3>${stepBadgeHtml(4, alreadyGenerated)} 対戦表自動生成</h3>
      <p class="text-dim mt-8">対象の大会: <strong>${escapeHtml(t.name)}</strong>（${escapeHtml(formatDateDisplay(t.event_date))}） ／ 登録チーム数: ${teamCount}</p>

      <div class="admin-section-title" style="margin-top:14px;">使用コート（②で予約済みの内容）</div>
      ${hasCourts
            ? `<div class="court-summary-list">${savedCourts.map((c) => `<div class="court-summary-row"><span>${escapeHtml(c.name)}</span><span>${c.start} 〜 ${c.end}</span></div>`).join("")}</div>`
            : `<p class="text-dim mt-8">まだコートが予約されていません。②のセクションで保存してください。</p>`}

      ${alreadyGenerated ? `
        <div class="schedule-warning mt-16">
          ⚠️ この大会には既に対戦表が生成されています（現在 ${appState.admin.selectedMatches.length}試合、${scheduleStatusLabel(t.schedule_status)}）。<br>
          再生成すると、これまでの試合結果と試合順の入れ替えはすべて上書きされます。
        </div>` : ""}

      <p class="admin-section-title" style="margin-top:16px;">試合の時間設定（上から順に入力してください）</p>
      <div class="form-group mt-8">
        <label class="field-label" for="scheduleMatchDuration">① 試合時間（分）</label>
        <input class="field" id="scheduleMatchDuration" type="number" min="1" value="8">
      </div>
      <div class="form-group">
        <label class="field-label" for="scheduleInterval">② インターバル（分）</label>
        <input class="field" id="scheduleInterval" type="number" min="0" value="2">
      </div>
      <div class="form-group">
        <label class="field-label" for="scheduleFirstMatchTime">③ 第1試合開始時間</label>
        <input class="field" id="scheduleFirstMatchTime" type="time" step="900" value="19:15">
        <p class="text-dim mt-8" style="font-size:12px;">コートの予約開始時刻より後になることがあります。各コートの実際の開始時刻は「そのコートの予約開始時刻」と「第1試合開始時間」の遅い方になります。</p>
      </div>
      <div class="form-group">
        <label class="field-label" for="scheduleLastMatchEndTime">④ 最終試合終了時間（任意）</label>
        <input class="field" id="scheduleLastMatchEndTime" type="time" step="900" value="20:45">
        <p class="text-dim mt-8" style="font-size:12px;">最も遅い試合の終了時刻の上限です。①〜③をもとに算出される終了時刻がこれを超えないよう調整されます。コートの予約終了時刻より前でも指定できます（未入力なら各コートの予約終了時刻のみが上限になります）。</p>
      </div>

      <div class="court-timeline" id="courtTimelineDetailed"></div>
      <div class="schedule-estimate" id="scheduleEstimateBox"></div>

      ${!canGenerate ? `<p class="error-text mt-8" style="display:block;">${disabledReason}</p>` : ""}
      <button class="btn btn-primary mt-16" data-action="generateSchedule" ${canGenerate ? "" : "disabled"}>
        ${alreadyGenerated ? "対戦表を再生成する（下書き）" : "対戦表を生成する（下書き）"}
      </button>
    </div>
  `;
}

/** 運用ステップの番号バッジ。完了していればチェックマーク＋ライム色、未完了なら番号＋控えめな色で表示する。 */
function stepBadgeHtml(number, isComplete) {
    return `<span class="step-badge ${isComplete ? "complete" : ""}">${isComplete ? "✓" : number}</span>`;
}

function scheduleStatusLabel(s) {
    return { DRAFT: "下書き", CONFIRMED: "確定済み" }[s] || "下書き";
}

/** ④用の詳細タイムライン共通描画ロジック（コート予約バー＋使える範囲＋第1試合開始線＋最終試合終了の上限） */
function renderCourtTimeline(box, courtRows, firstMatchTime, matchDuration, lastMatchEndTime) {
    const toMin = (hhmm) => { const p = hhmm.split(":").map(Number); return p[0] * 60 + p[1]; };
    const toLabel = (min) => { const h = Math.floor(min / 60) % 24, m = min % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };
    const showUsable = !!firstMatchTime && !!matchDuration;
    const firstMin = showUsable ? toMin(firstMatchTime) : null;

    const allTimes = courtRows.flatMap((c) => [toMin(c.start), toMin(c.end)]);
    if (showUsable) allTimes.push(firstMin);
    if (lastMatchEndTime) allTimes.push(toMin(lastMatchEndTime));
    let rangeMin = Math.floor((Math.min(...allTimes) - 15) / 30) * 30;
    let rangeMax = Math.ceil((Math.max(...allTimes) + 15) / 30) * 30;
    const totalSpan = Math.max(rangeMax - rangeMin, 30);
    const pct = (min) => Math.max(0, Math.min(100, ((min - rangeMin) / totalSpan) * 100));

    const tickStep = totalSpan > 300 ? 60 : 30;
    const ticks = [];
    for (let t = rangeMin; t <= rangeMax; t += tickStep) ticks.push(t);

    const rowsHtml = courtRows.map((c) => {
        const startMin = toMin(c.start), endMin = toMin(c.end);
        const fullLeft = pct(startMin), fullWidth = Math.max(pct(endMin) - pct(startMin), 0.5);
        let usableHtml = "", markerHtml = "", unusableHtml = "";
        if (showUsable) {
            const effStart = Math.max(startMin, firstMin);
            let effEnd = endMin;
            if (lastMatchEndTime) effEnd = Math.min(effEnd, toMin(lastMatchEndTime));
            const usable = effStart + matchDuration <= effEnd;
            const effLeft = pct(effStart), effWidth = usable ? Math.max(pct(effEnd) - pct(effStart), 0.5) : 0;
            if (usable) usableHtml = `<div class="timeline-bar-usable" style="left:${effLeft}%;width:${effWidth}%;"></div>`;
            markerHtml = `<div class="timeline-marker-line" style="left:${pct(firstMin)}%;"></div>`;
            if (lastMatchEndTime) markerHtml += `<div class="timeline-marker-line end" style="left:${pct(toMin(lastMatchEndTime))}%;"></div>`;
            if (!usable) unusableHtml = `<div class="timeline-unusable-label">使用不可</div>`;
        }
        return `
      <div class="timeline-grid-row">
        <div class="timeline-label">${escapeHtml(c.name)}</div>
        <div class="timeline-track">
          <div class="timeline-bar-full" style="left:${fullLeft}%;width:${fullWidth}%;"></div>
          ${usableHtml}${markerHtml}${unusableHtml}
        </div>
      </div>`;
    }).join("");

    const axisTicksHtml = ticks.map((t) => `<span class="timeline-tick" style="left:${pct(t)}%;">${toLabel(t)}</span>`).join("");

    box.innerHTML = `
    <div class="timeline-legend">
      ${showUsable ? `<span><i class="dot dot-usable"></i>試合に使える時間</span>` : ""}
      <span><i class="dot dot-full"></i>コート予約時間${showUsable ? "（全体）" : ""}</span>
      ${showUsable ? `<span><i class="dot dot-marker"></i>第1試合開始時間</span>` : ""}
      ${showUsable && lastMatchEndTime ? `<span><i class="dot dot-marker-end"></i>最終試合終了時間</span>` : ""}
    </div>
    <div class="timeline-wrap">
      ${rowsHtml}
      <div class="timeline-grid-row timeline-axis-row">
        <div class="timeline-label"></div>
        <div class="timeline-track timeline-axis-track">${axisTicksHtml}</div>
      </div>
    </div>
  `;
}

/** ④の入力（試合時間・インターバル・第1試合開始時間）が変わるたびに、詳細タイムラインと見積もりを更新する */
function updateScheduleUI() {
    updateDetailedCourtTimeline();
    updateScheduleEstimate();
}

function updateDetailedCourtTimeline() {
    const box = document.getElementById("courtTimelineDetailed");
    if (!box) return;
    const t = appState.admin.selectedTournament;
    const savedCourts = t ? parseCourtsJson(t.courts) : [];
    if (!savedCourts.length) { box.innerHTML = ""; return; }

    const firstMatchTime = document.getElementById("scheduleFirstMatchTime")?.value || "";
    const duration = Number(document.getElementById("scheduleMatchDuration")?.value) || 0;
    const lastMatchEndTime = document.getElementById("scheduleLastMatchEndTime")?.value || "";
    if (!firstMatchTime || !duration) { box.innerHTML = ""; return; }

    renderCourtTimeline(box, savedCourts, firstMatchTime, duration, lastMatchEndTime || null);
}

/**
 * チーム数・コート予約・試合時間設定から、総試合数（の見込み）とチームあたりの試合数目安を見積もる。
 * 総当たりを前提にしないため、「不足エラー」ではなく「このコート・時間だとチームあたり何試合になるか」を示す。
 */
function updateScheduleEstimate() {
    const box = document.getElementById("scheduleEstimateBox");
    if (!box) return;
    const t = appState.admin.selectedTournament;
    const teamCount = appState.admin.selectedTeams.length;
    const savedCourts = t ? parseCourtsJson(t.courts) : [];
    const durationInput = document.getElementById("scheduleMatchDuration");
    if (!durationInput) { box.innerHTML = ""; return; }

    if (!savedCourts.length) {
        box.innerHTML = `<p class="text-dim mt-8">②でコートを予約すると、試合数の見積もりが表示されます。</p>`;
        return;
    }
    if (teamCount < 2) {
        box.innerHTML = `<p class="text-dim mt-8">チームを2チーム以上登録すると、試合数の見積もりが表示されます。</p>`;
        return;
    }

    const duration = Number(durationInput.value) || 0;
    const interval = Number(document.getElementById("scheduleInterval")?.value) || 0;
    const firstMatchTime = document.getElementById("scheduleFirstMatchTime")?.value || "";
    const lastMatchEndTime = document.getElementById("scheduleLastMatchEndTime")?.value || "";
    if (!duration || !firstMatchTime) {
        box.innerHTML = `<p class="text-dim mt-8">試合時間・第1試合開始時間を入力すると、見積もりが表示されます。</p>`;
        return;
    }

    const toMin = (hhmm) => { const p = hhmm.split(":").map(Number); return p[0] * 60 + p[1]; };
    const firstMin = toMin(firstMatchTime);
    const lastMin = lastMatchEndTime ? toMin(lastMatchEndTime) : null;
    const span = duration + interval;

    let totalSlots = 0;
    const perCourtRowsHtml = savedCourts.map((c) => {
        const startMin = Math.max(toMin(c.start), firstMin);
        let endMin = toMin(c.end);
        if (lastMin !== null) endMin = Math.min(endMin, lastMin);
        let count = 0, cursor = startMin;
        while (cursor + duration <= endMin) { count++; cursor += span; }
        totalSlots += count;
        return `<div class="schedule-estimate-row"><span>${escapeHtml(c.name)}</span><strong>${count}枠</strong></div>`;
    }).join("");

    const totalPossiblePairs = (teamCount * (teamCount - 1)) / 2;
    const cappedMatches = Math.min(totalSlots, totalPossiblePairs);
    const avgPerTeam = teamCount > 0 ? (2 * cappedMatches) / teamCount : 0;
    const roundsCompletable = totalSlots >= totalPossiblePairs;

    box.innerHTML = `
    <div class="schedule-estimate-row"><span>確保できる枠の合計</span><strong>${totalSlots}枠</strong></div>
    ${perCourtRowsHtml}
    <div class="schedule-estimate-row"><span>総当たりに必要な試合数</span><strong>${totalPossiblePairs}試合</strong></div>
    <div class="schedule-estimate-row"><span>生成される試合数（見込み）</span><strong>約${cappedMatches}試合</strong></div>
    <p class="text-dim mt-8">
      ${roundsCompletable
            ? "✓ この設定なら総当たり戦を組めます。"
            : `1チームあたり約${Math.floor(avgPerTeam)}〜${Math.ceil(avgPerTeam)}試合になる見込みです（全チーム総当たりには枠が足りないため、できるだけ均等になるよう自動調整されます）。`}
    </p>
  `;
}

/* ---------- ⑤ 対戦表の確認・試合順の入れ替え・確定 ---------- */
/**
 * 生成された対戦表（下書き／確定済み）を確認し、
 *   - チームごとの試合数を一覧できるようにする（均等になっているか確認するため）
 *   - 2試合を選んで「時間・コート」を入れ替えられるようにする（当日の遅刻対応など）
 *   - 下書きの間だけ「確定」でき、確定すると参加者の画面に公開される
 * 確定後も試合順の入れ替えは引き続き可能（当日の急な変更に対応するため）。
 */
function adminScheduleReviewHtml(t, teams, matches) {
    const counts = {};
    teams.forEach((tm) => { counts[tm.team_id] = 0; });
    matches.forEach((m) => { counts[m.home_team_id] = (counts[m.home_team_id] || 0) + 1; counts[m.away_team_id] = (counts[m.away_team_id] || 0) + 1; });
    const countValues = Object.values(counts);
    const minCount = countValues.length ? Math.min(...countValues) : 0;
    const maxCount = countValues.length ? Math.max(...countValues) : 0;

    const balanceRows = teams.map((tm) => `
    <div class="schedule-estimate-row"><span>${escapeHtml(tm.name)}</span><strong>${counts[tm.team_id] || 0}試合</strong></div>
  `).join("");

    const isConfirmed = t.schedule_status === "CONFIRMED";

    return `
    <div class="glass-card mt-16">
      <h3>${stepBadgeHtml(5, isConfirmed)} 対戦表の確認・確定 <span class="admin-selected-badge ${isConfirmed ? "" : "draft"}">${scheduleStatusLabel(t.schedule_status)}</span></h3>

      <div class="admin-section-title" style="margin-top:14px;">チームごとの試合数（${minCount === maxCount ? "均等です" : `${minCount}〜${maxCount}試合`}）</div>
      <div class="mt-8">${balanceRows}</div>

      <div class="admin-section-title" style="margin-top:18px;">試合順の入れ替え</div>
      <p class="text-dim mt-8">試合をドラッグして、別の試合の上にドロップすると時間・コートが入れ替わります（対戦カードはそのまま。当日の遅刻対応などにご利用ください）。</p>
      ${festivalTimetableHtml(matches, teams)}

      ${!isConfirmed ? `
        <div class="admin-section-title" style="margin-top:18px;">公開</div>
        <p class="text-dim mt-8">内容を確認し、試合数のバランスに問題なければ確定してください。確定すると参加者の画面（対戦表・順位）に表示されます。</p>
        <button class="btn btn-primary btn-block mt-16" data-action="confirmSchedule">この対戦表を確定して参加者に公開する</button>
      ` : `<p class="text-dim mt-16">✓ 確定済みです。参加者の画面に表示されています。入れ替えを行うと即座に反映されます。</p>`}
    </div>
  `;
}

/**
 * 「試合順の入れ替え」を夏フェスのタイムテーブルのような見た目で表示する。
 * 横軸=コート（列）、縦軸=時刻。各試合をブロックとして時間に応じた高さ・位置で配置する。
 * ドラッグ&ドロップの実際の挙動は afterRenderHook から呼ばれる enableMatchDragDrop() が担当する
 * （描画のたびにDOMを丸ごと差し替える都合上、ドラッグ操作自体は描画後に別途バインドする）。
 */
function festivalTimetableHtml(matches, teams) {
    if (!matches.length) return `<p class="text-dim mt-8">試合がありません。</p>`;
    const teamName = (id) => (teams.find((x) => x.team_id === id) || {}).name || "?";

    const toMin = (hhmm) => { const p = String(hhmm).split(":").map(Number); return p[0] * 60 + p[1]; };
    const toLabel = (min) => { const h = Math.floor(min / 60) % 24, m = min % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };

    const courts = [...new Set(matches.map((m) => m.court_name))];
    const allMin = matches.flatMap((m) => [toMin(m.start_time), toMin(m.end_time)]);
    const rangeStart = Math.min(...allMin);
    const rangeEnd = Math.max(...allMin);
    const totalMin = Math.max(rangeEnd - rangeStart, 30);

    // ブロックが文字サイズ分の高さを確保しても、同一コート内で隣の試合と重ならないよう、
    // 実際の試合間隔（同一コート内で連続する試合の開始時刻の差）から1分あたりの高さを動的に算出する。
    // 試合時間・インターバルの設定値に関わらず、常に安全な余白を確保できる。
    const MIN_BLOCK_HEIGHT = 46; // ブロックが確保すべき最低高さ(px)。文字サイズに合わせて調整
    let minGapMin = Infinity;
    courts.forEach((court) => {
        const times = matches.filter((m) => m.court_name === court).map((m) => toMin(m.start_time)).sort((a, b) => a - b);
        for (let i = 1; i < times.length; i++) {
            const gap = times[i] - times[i - 1];
            if (gap > 0 && gap < minGapMin) minGapMin = gap;
        }
    });
    if (!isFinite(minGapMin)) minGapMin = 10; // 各コート1試合のみ等、間隔が算出できない場合のフォールバック

    const PX_PER_MIN = Math.max(2.4, MIN_BLOCK_HEIGHT / minGapMin);
    const gridHeight = Math.round(totalMin * PX_PER_MIN);

    const tickStepMin = 15;
    const firstTick = Math.ceil(rangeStart / tickStepMin) * tickStepMin;
    const ticks = [];
    for (let tmin = firstTick; tmin <= rangeEnd; tmin += tickStepMin) ticks.push(tmin);

    const timeAxisHtml = `
    <div class="festival-col festival-time-axis">
      <div class="festival-col-header"></div>
      <div class="festival-col-body" style="height:${gridHeight}px;">
        ${ticks.map((tmin) => `<div class="festival-time-label" style="top:${Math.round((tmin - rangeStart) * PX_PER_MIN)}px;">${toLabel(tmin)}</div>`).join("")}
      </div>
    </div>`;

    const courtColumnsHtml = courts.map((court) => {
        const courtMatches = matches.filter((m) => m.court_name === court);
        const blocksHtml = courtMatches.map((m) => {
            const startMin = toMin(m.start_time), endMin = toMin(m.end_time);
            const top = Math.round((startMin - rangeStart) * PX_PER_MIN);
            const height = Math.max(Math.round((endMin - startMin) * PX_PER_MIN), MIN_BLOCK_HEIGHT);
            return `
        <div class="festival-block" data-match-id="${m.match_id}" style="top:${top}px; height:${height}px;">
          <div class="festival-block-time">${formatTimeDisplay(m.start_time)}</div>
          <div class="festival-block-teams">${escapeHtml(teamName(m.home_team_id))}<span class="text-dim">×</span>${escapeHtml(teamName(m.away_team_id))}</div>
        </div>`;
        }).join("");
        return `
      <div class="festival-col">
        <div class="festival-col-header">${escapeHtml(court)}</div>
        <div class="festival-col-body" style="height:${gridHeight}px;">
          ${ticks.map((tmin) => `<div class="festival-gridline" style="top:${Math.round((tmin - rangeStart) * PX_PER_MIN)}px;"></div>`).join("")}
          ${blocksHtml}
        </div>
      </div>`;
    }).join("");

    return `
    <div class="festival-timetable-scroll mt-8">
      <div class="festival-timetable">
        ${timeAxisHtml}
        ${courtColumnsHtml}
      </div>
    </div>`;
}

/**
 * フェス風タイムテーブルのドラッグ&ドロップを有効化する。
 * ポインターイベント（マウス／タッチ両対応）で、ブロックを掴んで別ブロックの上に離すと入れ替わる。
 * 描画のたびに呼び直す必要があるため afterRenderHook から呼ぶ。
 */
function enableMatchDragDrop() {
    document.querySelectorAll(".festival-block").forEach((block) => {
        block.addEventListener("pointerdown", onFestivalBlockPointerDown);
    });
}

let festivalDragState = null;

function onFestivalBlockPointerDown(e) {
    const block = e.currentTarget;
    e.preventDefault();
    try { block.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }

    festivalDragState = {
        pointerId: e.pointerId,
        block,
        matchId: block.dataset.matchId,
        startX: e.clientX,
        startY: e.clientY,
        dropTargetId: null,
    };
    block.classList.add("dragging");

    block.addEventListener("pointermove", onFestivalBlockPointerMove);
    block.addEventListener("pointerup", onFestivalBlockPointerUp);
    block.addEventListener("pointercancel", onFestivalBlockPointerUp);
}

function onFestivalBlockPointerMove(e) {
    if (!festivalDragState || e.pointerId !== festivalDragState.pointerId) return;
    const dx = e.clientX - festivalDragState.startX;
    const dy = e.clientY - festivalDragState.startY;
    festivalDragState.block.style.transform = `translate(${dx}px, ${dy}px)`;

    // ポインタ直下にある別ブロックをドロップ候補として検出・ハイライトする
    festivalDragState.block.style.pointerEvents = "none";
    const elUnder = document.elementFromPoint(e.clientX, e.clientY);
    festivalDragState.block.style.pointerEvents = "";
    const targetBlock = elUnder ? elUnder.closest(".festival-block") : null;

    document.querySelectorAll(".festival-block.drop-target").forEach((b) => b.classList.remove("drop-target"));
    if (targetBlock && targetBlock !== festivalDragState.block) {
        targetBlock.classList.add("drop-target");
        festivalDragState.dropTargetId = targetBlock.dataset.matchId;
    } else {
        festivalDragState.dropTargetId = null;
    }
}

async function onFestivalBlockPointerUp(e) {
    if (!festivalDragState || e.pointerId !== festivalDragState.pointerId) return;
    const { block, matchId, dropTargetId } = festivalDragState;

    block.removeEventListener("pointermove", onFestivalBlockPointerMove);
    block.removeEventListener("pointerup", onFestivalBlockPointerUp);
    block.removeEventListener("pointercancel", onFestivalBlockPointerUp);
    block.classList.remove("dragging");
    block.style.transform = "";
    document.querySelectorAll(".festival-block.drop-target").forEach((b) => b.classList.remove("drop-target"));

    festivalDragState = null;

    if (dropTargetId && dropTargetId !== matchId) {
        await performMatchSwap(matchId, dropTargetId);
    }
}

/** 2試合の時間・コートを入れ替える（対戦カード自体は維持） */
async function performMatchSwap(matchIdA, matchIdB) {
    showLoadingSpinner(true);
    const res = await apiPostAuthed("swapMatches", { match_id_a: matchIdA, match_id_b: matchIdB });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast(res.message || "試合を入れ替えました", "success");
        await loadAdminSelectedTournamentDetail(appState.admin.selectedTournamentId);
        render();
    } else {
        showToast(res.message, "error");
    }
}

async function onConfirmSchedule() {
    const tournamentId = appState.admin.selectedTournamentId;
    if (!tournamentId) return;
    const confirmed = window.confirm("対戦表を確定します。確定すると参加者の画面（対戦表・順位）に表示されます。よろしいですか？");
    if (!confirmed) return;

    showLoadingSpinner(true);
    const res = await apiPostAuthed("confirmSchedule", { tournament_id: tournamentId });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast(res.message || "対戦表を確定しました", "success");
        await loadTournament();
        appState.admin.tournamentsLoaded = false;
        await loadAdminTournaments();
        render();
    } else {
        showToast(res.message, "error");
    }
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

/**
 * 選択中の大会の詳細（コート・チーム・出場メンバー・試合）を取得する。
 * 管理者専用の getAdminTournamentDetail を使用し、下書き状態の対戦表も表示できるようにする
 * （参加者向けの getTournament は、対戦表が確定するまで matches を返さない）。
 */
async function loadAdminSelectedTournamentDetail(tournamentId) {
    const res = await apiPostAuthed("getAdminTournamentDetail", { tournament_id: tournamentId });
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

/** 大会作成（名前・開催日のみ。コート予約・チーム登録は選択後の各ステップで行う） */
async function onCreateTournament() {
    const name = document.getElementById("newTournamentName").value.trim();
    const eventDate = document.getElementById("newTournamentDate").value;
    if (!name || !eventDate) { showToast("大会名と開催日を入力してください", "error"); return; }

    showLoadingSpinner(true);
    const res = await apiPostAuthed("createTournament", { name, event_date: eventDate });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast(res.message || "大会を作成しました", "success");
        // 作成した大会を操作対象として選択し、一覧・現行大会情報を更新する
        appState.admin.selectedTournamentId = res.data.tournament_id;
        appState.admin.showCreateForm = false; // 作成後はフォームを畳み、選択中の大会の手順に注目を戻す
        appState.admin.tournamentsLoaded = false;
        await loadTournament();
        await loadAdminTournaments();
        render();
    } else {
        showToast(res.message, "error");
    }
}

function toggleCreateTournamentForm() {
    appState.admin.showCreateForm = !appState.admin.showCreateForm;
    render();
}

/** 大会を削除する（関連するチーム・出場メンバー・対戦表もすべて削除される取り消せない操作） */
async function onDeleteTournament(tournamentId) {
    const t = appState.admin.tournaments.find((x) => x.tournament_id === tournamentId);
    const name = t ? t.name : "この大会";
    const confirmed = window.confirm(
        `「${name}」を削除します。\nチーム・出場メンバー・対戦表もすべて削除され、元に戻せません。\n本当によろしいですか？`
    );
    if (!confirmed) return;

    showLoadingSpinner(true);
    const res = await apiPostAuthed("deleteTournament", { tournament_id: tournamentId });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast(res.message || "大会を削除しました", "success");
        if (appState.admin.selectedTournamentId === tournamentId) {
            appState.admin.selectedTournamentId = null;
            appState.admin.selectedTournament = null;
            appState.admin.selectedTeams = [];
            appState.admin.selectedUsers = [];
            appState.admin.selectedMatches = [];
        }
        appState.admin.tournamentsLoaded = false;
        await loadAdminTournaments();
        render();
    } else {
        showToast(res.message, "error");
    }
}

/** 大会ステータス（これから／開催中／終了）を更新する */
async function onUpdateTournamentStatus(tournamentId, newStatus) {
    if (!tournamentId || !newStatus) return;
    const current = appState.admin.selectedTournament;
    if (current && current.status === newStatus) return; // 変更なし

    if (newStatus === "FINISHED") {
        const confirmed = window.confirm(
            "この大会を「終了」にします。以降、参加者はこの大会の結果・得点者を入力できなくなります。よろしいですか？"
        );
        if (!confirmed) return;
    }

    showLoadingSpinner(true);
    const res = await apiPostAuthed("updateTournamentStatus", { tournament_id: tournamentId, status: newStatus });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast(res.message || "大会のステータスを更新しました", "success");
        await loadAdminSelectedTournamentDetail(tournamentId);
        appState.admin.tournamentsLoaded = false;
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

/** 対戦表自動生成（下書き状態で作成される。参加者への公開は⑤の確定操作で行う） */
async function onGenerateSchedule() {
    const tournamentId = appState.admin.selectedTournamentId;
    if (!tournamentId) { showToast("大会を選択してください", "error"); return; }
    const existingMatchCount = appState.admin.selectedMatches.length;

    const matchDuration = Number(document.getElementById("scheduleMatchDuration").value);
    const interval = Number(document.getElementById("scheduleInterval").value);
    const firstMatchTime = document.getElementById("scheduleFirstMatchTime").value;
    const lastMatchEndTime = document.getElementById("scheduleLastMatchEndTime").value; // 任意入力

    if (!matchDuration || matchDuration <= 0) { showToast("試合時間を正しく入力してください", "error"); return; }
    if (Number.isNaN(interval) || interval < 0) { showToast("インターバルを正しく入力してください", "error"); return; }
    if (!firstMatchTime) { showToast("第1試合開始時間を入力してください", "error"); return; }
    if (!isQuarterHourTime(firstMatchTime)) { showToast("第1試合開始時間は15分刻みで入力してください", "error"); return; }
    if (lastMatchEndTime) {
        if (!isQuarterHourTime(lastMatchEndTime)) { showToast("最終試合終了時間は15分刻みで入力してください", "error"); return; }
        if (lastMatchEndTime <= firstMatchTime) { showToast("最終試合終了時間は、第1試合開始時間より後にしてください", "error"); return; }
    }

    // 既に対戦表が生成済みの場合は、上書きしてよいか明示的に確認する（誤操作による事故防止）
    if (existingMatchCount > 0) {
        const confirmed = window.confirm(
            `この大会には既に対戦表が生成されています（現在 ${existingMatchCount}試合）。\n再生成すると、これまでの試合結果と試合順の入れ替えはすべて上書きされます。\n本当によろしいですか？`
        );
        if (!confirmed) return;
    }

    showLoadingSpinner(true);
    const res = await apiPostAuthed("generateSchedule", {
        tournament_id: tournamentId,
        match_duration_min: matchDuration,
        interval_min: interval,
        first_match_start_time: firstMatchTime,
        last_match_end_time: lastMatchEndTime || null,
    });
    showLoadingSpinner(false);
    if (res.status === "success") {
        showToast(res.message || "対戦表を下書き作成しました", "success");
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
/** 画面表示用の日付フォーマット。スプレッドシート/フォームは "YYYY-MM-DD" だが、表示は "YYYY/MM/DD" に統一する。 */
function formatDateDisplay(dateStr) {
    const datePart = String(dateStr || "").split("T")[0]; // 万一ISO日時文字列が来ても日付部分のみを使う
    return datePart.replace(/-/g, "/");
}
/** 万一ISO日時文字列（例: "1899-12-30T10:15:00.000Z"）が来ても "HH:mm" 部分のみを取り出す */
function formatTimeDisplay(timeStr) {
    const str = String(timeStr || "");
    const match = str.match(/(\d{2}:\d{2})/);
    return match ? match[1] : str;
}
/**
 * 「今日」が属する年度（4月始まり〜翌3月）を返す。バックエンドの getCurrentFiscalYear（ranking.gs）と
 * 同じルール。単純な暦年（getFullYear()）だと、1〜3月に開催中のランキング画面を開いたとき
 * 実際の年度とズレた fiscal_year をリクエストしてしまうため、フロント側もこのルールに合わせる。
 */
function getCurrentFiscalYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth()は0始まりのため+1
    return month >= 4 ? year : year - 1;
}
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);
}
/** ローディング表示中は背面のスクロールを禁止する（htmlとbody両方にno-scrollを付与） */
// showLoadingSpinner はネストして呼ばれることがある（例: onXxx内でtrue→内部でloadTournament()が
// 独自にtrue/falseを呼ぶ→onXxxがfalseで閉じる）。単純なbool切替だと、内側のfalseで
// 外側の処理が終わる前にオーバーレイが消えてしまう（＝ローディングUIの表示崩れ）。
// 参照カウント方式にし、すべてのtrueに対応するfalseが揃うまで表示し続けるようにする。
let loadingSpinnerDepth = 0;
function showLoadingSpinner(show) {
    loadingSpinnerDepth = Math.max(0, loadingSpinnerDepth + (show ? 1 : -1));
    const isShowing = loadingSpinnerDepth > 0;
    document.getElementById("loadingOverlay").classList.toggle("show", isShowing);
    document.documentElement.classList.toggle("no-scroll", isShowing);
    document.body.classList.toggle("no-scroll", isShowing);
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