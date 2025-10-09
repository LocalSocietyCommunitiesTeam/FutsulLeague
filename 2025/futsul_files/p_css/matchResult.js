// matchResult.js (完全修正版 - 部署対抗フットサル向け)

// 部署対抗フットサルリーグのデータ構造に合わせて修正
// const matchesData = [
//   {
//     matchId: 53,
//     round: 26,
//     matchStartTime: "2025/10/10 19:15",
//     matchEndTime: "2025/10/10 19:25",
//     courtName: "クラブハウス側",
//     homeTeamName: "営企",
//     awayTeamName: "情シス",
//     homeScore: 3,
//     awayScore: 2,
//     // 部署対抗では得点者情報は不要だが、データ構造を維持するため空で定義
//     team1Goalscorers: [{ playerName: "仮", goals: 3 }], 
//     team2Goalscorers: [{ playerName: "仮", goals: 2 }],
//   },
//   {
//     matchId: 54,
//     round: 27,
//     matchStartTime: "2025/10/10 19:30",
//     matchEndTime: "2025/10/10 19:40",
//     courtName: "真ん中",
//     homeTeamName: "地リレ",
//     awayTeamName: "ブラ戦",
//     homeScore: 1,
//     awayScore: 4,
//     team1Goalscorers: [{ playerName: "仮", goals: 1 }],
//     team2Goalscorers: [{ playerName: "仮", goals: 4 }],
//   },
//   {
//     matchId: 55,
//     round: 28,
//     matchStartTime: "2026/01/01 10:00", // 未来の日時で「予定」をテスト
//     matchEndTime: "2026/01/01 10:10",
//     courtName: "北コート",
//     homeTeamName: "総務",
//     awayTeamName: "経理",
//     homeScore: 0,
//     awayScore: 0,
//     team1Goalscorers: [],
//     team2Goalscorers: [],
//   },
//   {
//     matchId: 56,
//     round: 29,
//     matchStartTime: "2025/10/06 09:35", // 現在時刻（例: 2025/10/06 09:40:41 JST）を含む日時で「進行中」をテスト
//     matchEndTime: "2025/10/06 09:45",
//     courtName: "南コート",
//     homeTeamName: "開発",
//     awayTeamName: "広報",
//     homeScore: 1,
//     awayScore: 1,
//     team1Goalscorers: [{ playerName: "仮", goals: 1 }],
//     team2Goalscorers: [{ playerName: "仮", goals: 1 }],
//   },
// ];

window.addEventListener('DOMContentLoaded', async function () {
  const matchesData = await getAllMatchSchedule();

  // プレイヤーデータは今回不要だが、得点者入力で仮に必要になるため一部残す
  const players = [
    { name: "営企 選手A", team: "営企" },
    { name: "情シス 選手B", team: "情シス" },
    { name: "地リレ 選手C", team: "地リレ" },
    { name: "ブラ戦 選手D", team: "ブラ戦" },
    { name: "総務 選手E", team: "総務" },
    { name: "経理 選手F", team: "経理" },
    { name: "開発 選手G", team: "開発" },
    { name: "広報 選手H", team: "広報" },
  ];

  // チームリストは部署名で動的に作成
  const teams = Array.from(
    new Set(matchesData.flatMap(m => [m.homeTeamName, m.awayTeamName]))
  );

  // LocalStorage UtilitiesはDBデータ構造に合わせてデータを変換
  function loadMatches() {
    const data = localStorage.getItem("matches");
    if (data) return JSON.parse(data);

    // 初回ロード時はダミーデータにステータスを追加して保存
    const initialMatches = matchesData.map(m => ({
      id: String(m.matchId),
      round: `第${m.round}節`,
      status: calcStatus(m.matchStartTime, m.matchEndTime),
      date: m.matchStartTime.split(" ")[0].replace(/\//g, "-"), // date: YYYY-MM-DD
      // startTime: m.matchStartTime.split(" ")[1],
      startTime: m.startHour + ":" + m.startMinute,
      // endTime: m.matchEndTime.split(" ")[1],
      endTime: m.endHour + ":" + m.endMinute,
      team1: m.homeTeamName,
      team2: m.awayTeamName,
      team1Score: m.homeScore,
      team2Score: m.awayScore,
      venue: m.courtName,
      team1Goalscorers: m.team1Goalscorers || [],
      team2Goalscorers: m.team2Goalscorers || [],
    }));
    saveMatches(initialMatches);
    return initialMatches;
  }

  function saveMatches(matches) {
    localStorage.setItem("matches", JSON.stringify(matches));
  }

  // ===== Status Calculator (修正) =====
  // 試合開始時刻と終了時刻を比較してステータスを決定
  function calcStatus(startDateTimeStr, endDateTimeStr) {
    const now = new Date();
    const start = new Date(startDateTimeStr);
    const end = new Date(endDateTimeStr);

    if (now < start) return "予定";
    if (now >= start && now <= end) return "進行中";
    return "終了";
  }

  // ===== Match List Page (修正) =====
  if (document.getElementById("match-list-view")) {
    let matches = loadMatches();
    // 画面表示前に最新のステータスに更新
    matches = matches.map(m => {
      const startDateTimeStr = `${m.date.replace(/-/g, "/")} ${m.startTime}`;
      const endDateTimeStr = `${m.date.replace(/-/g, "/")} ${m.endTime}`;
      m.status = calcStatus(startDateTimeStr, endDateTimeStr);
      return m;
    });
    saveMatches(matches); // 更新したステータスを保存

    const container = document.getElementById("match-list-container");

    function renderList(filter = "すべて") {
      container.innerHTML = "";

      let filtered = matches;
      if (filter !== "すべて")
        filtered = matches.filter((m) => m.status === filter);

      // roundでグループ化
      const grouped = {};
      filtered.forEach((m) => {
        if (!grouped[m.round]) grouped[m.round] = [];
        grouped[m.round].push(m);
      });

      Object.entries(grouped).forEach(([round, list]) => {
        const roundDiv = document.createElement("div");
        roundDiv.className = "card";
        roundDiv.innerHTML = `<h3 class="badge">${round}</h3>`; // 節のカード
        list.forEach((m) => {
          const div = document.createElement("div");
          div.className = "card";
          // 修正: 日付不要、試合時間はHH:MM〜HH:MM、得点者表示不要
          div.innerHTML = `
            <div class="flex-between">
              <!-- <span class="badge status">${m.status}</span> -->
              <button class="edit-btn" data-id="${m.id}">編集</button>
            </div>
            <p style="font-size: 0.9rem; color: #666;">${m.startTime}〜${m.endTime}</p>
            <div class="score-display">
              <div>${m.team1}<br><span class="score">${m.team1Score}</span></div>
              <span class="vs">-</span>
              <div>${m.team2}<br><span class="score">${m.team2Score}</span></div>
            </div>
            <p style="font-size: 0.9rem; color: #999;">📍 ${m.venue}</p>
          `;
          roundDiv.appendChild(div);
        });
        container.appendChild(roundDiv);
      });

      document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          localStorage.setItem("currentMatchId", e.target.dataset.id);
          location.href = "resultForm.html";
        });
      });
    }

    // フィルターボタンの処理は変更なし
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderList(btn.dataset.status);
      });
    });

    renderList();
  }

  // ===== Result Form Page (修正) =====
  if (document.getElementById("match-entry-view")) {
    const matches = loadMatches();
    const id = localStorage.getItem("currentMatchId");
    const match = matches.find((m) => m.id === id);

    if (!match) location.href = "matchResult.html";

    // ヘッダー表示
    document.getElementById("match-round").textContent = match.round;
    // 画面を開いた時点で最新のステータスを再計算して表示
    const startDateTimeStr = `${match.date.replace(/-/g, "/")} ${match.startTime}`;
    const endDateTimeStr = `${match.date.replace(/-/g, "/")} ${match.endTime}`;
    match.status = calcStatus(startDateTimeStr, endDateTimeStr);

    // チームセレクトボックス
    const t1Sel = document.getElementById("team1-select");
    const t2Sel = document.getElementById("team2-select");

    // 修正: 日時、会場、節の入力欄を削除し、表示専用の要素に値を設定
    const dateTimeDisplay = document.getElementById("match-datetime-display");
    const venueDisplay = document.getElementById("venue-display");
    const roundHiddenInput = document.getElementById("round-select");
    const venueInput = document.getElementById("venue-input"); // hidden input

    // 試合日時表示 (例: 10/10 19:15〜19:25)
    const [month, day] = match.date.substring(5).split('-'); // YYYY-MM-DD から MM-DD
    dateTimeDisplay.textContent = `${month}/${day} ${match.startTime}〜${match.endTime}`;

    // 会場表示
    venueDisplay.textContent = match.venue;
    venueInput.value = match.venue; // hidden inputに値を保持

    // 節の値を保持 (ヘッダー表示用)
    roundHiddenInput.value = match.round;


    // チーム名とセレクタの設定
    t1Sel.innerHTML = teams
      .map(
        (t) => `<option ${t === match.team1 ? "selected" : ""}>${t}</option>`
      )
      .join("");
    t2Sel.innerHTML = teams
      .map(
        (t) => `<option ${t === match.team2 ? "selected" : ""}>${t}</option>`
      )
      .join("");

    // チーム選択変更時の得点者リスト/スコア更新
    t1Sel.addEventListener("change", renderGoals);
    t2Sel.addEventListener("change", renderGoals);

    // チーム名の表示を更新
    function updateTeamNames() {
      document.getElementById("team1-name").textContent = t1Sel.value;
      document.getElementById("team2-name").textContent = t2Sel.value;
      document.getElementById("team1-goal-title").textContent = `${t1Sel.value}の得点`;
      document.getElementById("team2-goal-title").textContent = `${t2Sel.value}の得点`;
    }
    t1Sel.addEventListener("change", updateTeamNames);
    t2Sel.addEventListener("change", updateTeamNames);

    let team1Goals = [...match.team1Goalscorers];
    let team2Goals = [...match.team2Goalscorers];

    function updateScores() {
      match.team1Score = team1Goals.reduce((sum, g) => sum + g.goals, 0);
      match.team2Score = team2Goals.reduce((sum, g) => sum + g.goals, 0);
      document.getElementById("team1-score").textContent = match.team1Score;
      document.getElementById("team2-score").textContent = match.team2Score;
    }

    function renderGoals() {
      const t1Area = document.getElementById("team1-goals");
      const t2Area = document.getElementById("team2-goals");
      t1Area.innerHTML = "";
      t2Area.innerHTML = "";

      const currentTeam1 = t1Sel.value;
      const currentTeam2 = t2Sel.value;

      // 選択されたチームのプレイヤーにフィルター
      const t1Players = players.filter((p) => p.team === currentTeam1);
      const t2Players = players.filter((p) => p.team === currentTeam2);

      updateTeamNames();

      const createEntry = (g, team, i, list, area) => {
        const div = document.createElement("div");
        div.className = "goal-entry";
        div.innerHTML = `
          <select data-team="${team}" data-index="${i}">
            <option value="">選手を選択</option>
            ${list
            .map(
              (p) =>
                `<option value="${p.name}" ${p.name === g.playerName ? "selected" : ""
                }>${p.name}</option>`
            )
            .join("")}
          </select>
          <input type="number" data-team="${team}" data-index="${i}" value="${g.goals
          }" min="1">
          <button class="remove-btn" data-team="${team}" data-index="${i}">×</button>
        `;
        area.appendChild(div);
      };

      team1Goals.forEach((g, i) => createEntry(g, "1", i, t1Players, t1Area));
      team2Goals.forEach((g, i) => createEntry(g, "2", i, t2Players, t2Area));

      // イベント登録（選手名と得点数の変更）
      document.querySelectorAll(".remove-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const { team, index } = e.target.dataset;
          if (team === "1") team1Goals.splice(index, 1);
          else team2Goals.splice(index, 1);
          renderGoals();
          updateScores();
        });
      });

      document.querySelectorAll("select[data-team]").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const { team, index } = e.target.dataset;
          // スコアラーがまだ空配列の時は再構築
          const targetList = team === "1" ? team1Goals : team2Goals;
          if (!targetList[index]) {
            // スコアラーが削除されている場合に備えて再レンダリング
            renderGoals();
            return;
          }
          targetList[index].playerName = e.target.value;
          // 得点者名はスコアに影響しないため updateScores は不要
        });
      });

      document.querySelectorAll("input[data-team]").forEach((inp) => {
        inp.addEventListener("change", (e) => {
          const { team, index } = e.target.dataset;
          const val = parseInt(e.target.value) || 0; // 不正な値は0として扱う
          const targetList = team === "1" ? team1Goals : team2Goals;
          if (!targetList[index]) {
            renderGoals();
            return;
          }
          targetList[index].goals = Math.max(1, val); // 最低1点
          e.target.value = targetList[index].goals; // 表示を修正
          updateScores();
        });
      });

      updateScores();
    }

    renderGoals();

    // 得点者追加ボタンの処理は変更なし
    document.querySelectorAll(".add-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const team = e.target.dataset.team;
        if (team === "1") team1Goals.push({ playerName: "", goals: 1 });
        else team2Goals.push({ playerName: "", goals: 1 });
        renderGoals();
      });
    });

    // 修正: 時刻モーダル関連のコードを削除 (HTMLで入力不要になったため)

    // 保存 (修正: 日付/時間は変更不可、節も変更不可)
    document.getElementById("save-entry").onclick = () => {
      // チーム選択と得点者リストのみ更新
      match.team1 = t1Sel.value;
      match.team2 = t2Sel.value;
      match.team1Goalscorers = team1Goals;
      match.team2Goalscorers = team2Goals;

      // スコアを再計算
      match.team1Score = team1Goals.reduce((s, g) => s + g.goals, 0);
      match.team2Score = team2Goals.reduce((s, g) => s + g.goals, 0);

      // ステータスを最新に更新
      const newStartDateTimeStr = `${match.date.replace(/-/g, "/")} ${match.startTime}`;
      const newEndDateTimeStr = `${match.date.replace(/-/g, "/")} ${match.endTime}`;
      match.status = calcStatus(newStartDateTimeStr, newEndDateTimeStr);

      saveMatches(matches);
      location.href = "matchResult.html";
    };

    // 初回ロード時にもチーム名を表示
    updateTeamNames();
  }
});
// チームリストを取得
async function getAllMatchSchedule() {
  // クエリパラメータを付与したURLを作成
  const params = new URLSearchParams({
    action: "getAllMatchSchedule",
  });

  const newUrl = `${WEB_APP_URL}?${params.toString()}`;

  try {
    console.log('try');
    // GASエンドポイントへのGETリクエスト
    const response = await fetch(newUrl);

    // HTTPステータスコードをチェック
    if (!response.ok) {
      // エラーを表示
      showError(`HTTPエラー! ステータス: ${response.status}`);
    }

    // レスポンスボディをJSONとしてパース
    const data = await response.json();
    console.log('data');
    console.log(data);

    return data;
  } catch (error) {
    console.log('catch');
    showError(`データ取得中にエラーが発生しました:${error}`);
  }
}
