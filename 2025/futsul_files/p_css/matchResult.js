// matchResult.js (完全修正版)

(function () {
  const teams = [
    "FCドラゴン",
    "神戸ユナイテッド",
    "大阪ドリームス",
    "みなみフィールズ",
    "電気ライジング",
    "さざ波フィールズ",
    "神戸ウィングス",
    "豆田サムライ",
    "横浜シーガルズ",
    "こめむしドリーマーズ",
  ];

  const players = [
    { name: "佐藤 太郎", team: "FCドラゴン" },
    { name: "田中 次郎", team: "神戸ユナイテッド" },
    { name: "高橋 三郎", team: "神戸ユナイテッド" },
    { name: "山田 四郎", team: "大阪ドリームス" },
    { name: "鈴木 五郎", team: "大阪ドリームス" },
  ];

  // ===== LocalStorage Utilities =====
  function loadMatches() {
    const data = localStorage.getItem("matches");
    return data ? JSON.parse(data) : [];
  }
  function saveMatches(matches) {
    localStorage.setItem("matches", JSON.stringify(matches));
  }

  // ===== Status Calculator =====
  function calcStatus(date, time) {
    const now = new Date();
    const target = new Date(`${date}T${time}`);
    if (now < target) return "予定";
    if (now - target < 2 * 3600000) return "進行中";
    return "終了";
  }

  // ===== Match List Page =====
  if (document.getElementById("match-list-view")) {
    let matches = loadMatches();
    if (matches.length === 0) {
      matches = [
        {
          id: "1",
          round: "第3節",
          status: "終了",
          date: "2024-10-01",
          time: "18:00",
          team1: "FCドラゴン",
          team2: "神戸ユナイテッド",
          team1Score: 3,
          team2Score: 2,
          venue: "神戸体育館",
          team1Goalscorers: [{ playerName: "佐藤 太郎", goals: 3 }],
          team2Goalscorers: [{ playerName: "田中 次郎", goals: 2 }],
        },
      ];
      saveMatches(matches);
    }

    const container = document.getElementById("match-list-container");

    function renderList(filter = "すべて") {
      container.innerHTML = "";

      let filtered = matches;
      if (filter !== "すべて")
        filtered = matches.filter((m) => m.status === filter);

      const grouped = {};
      filtered.forEach((m) => {
        if (!grouped[m.round]) grouped[m.round] = [];
        grouped[m.round].push(m);
      });

      Object.entries(grouped).forEach(([round, list]) => {
        const roundDiv = document.createElement("div");
        roundDiv.className = "card";
        roundDiv.innerHTML = `<h3 class="badge">${round}</h3>`;
        list.forEach((m) => {
          const div = document.createElement("div");
          div.className = "card";
          div.innerHTML = `
            <div class="flex-between">
              <span class="badge status">${m.status}</span>
              <button class="edit-btn" data-id="${m.id}">編集</button>
            </div>
            <p>${m.date} ${m.time}</p>
            <div class="score-display">
              <div>${m.team1}<br><span class="score">${m.team1Score}</span></div>
              <span class="vs">-</span>
              <div>${m.team2}<br><span class="score">${m.team2Score}</span></div>
            </div>
            <p>📍 ${m.venue}</p>
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

  // ===== Result Form Page =====
  if (document.getElementById("match-entry-view")) {
    const matches = loadMatches();
    const id = localStorage.getItem("currentMatchId");
    const match = matches.find((m) => m.id === id);

    if (!match) location.href = "matchResult.html";

    // ヘッダー表示修正
    document.getElementById("match-round").textContent = match.round;
    document.getElementById("match-status").textContent = match.status;

    // 戻るボタン機能
    document.getElementById("back-to-list").addEventListener("click", () => {
      location.href = "matchResult.html";
    });

    document
      .getElementById("cancel-entry")
      .addEventListener("click", () => (location.href = "matchResult.html"));

    // チームと節ドロップダウン修正
    const t1Sel = document.getElementById("team1-select");
    const t2Sel = document.getElementById("team2-select");
    const roundSel = document.getElementById("round-select");
    const dateInput = document.getElementById("match-date");
    const timeSpan = document.getElementById("match-time");
    const venueInput = document.getElementById("venue-input");

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
    roundSel.innerHTML = Array.from({ length: 10 }, (_, i) => {
      const val = `第${i + 1}節`;
      return `<option ${match.round === val ? "selected" : ""}>${val}</option>`;
    }).join("");

    dateInput.value = match.date;
    timeSpan.textContent = match.time;
    venueInput.value = match.venue;

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

      const t1Players = players.filter((p) => p.team === t1Sel.value);
      const t2Players = players.filter((p) => p.team === t2Sel.value);

      const createEntry = (g, team, i, list, area) => {
        const div = document.createElement("div");
        div.className = "goal-entry";
        div.innerHTML = `
          <select data-team="${team}" data-index="${i}">
            <option value="">選手を選択</option>
            ${list
              .map(
                (p) =>
                  `<option value="${p.name}" ${
                    p.name === g.playerName ? "selected" : ""
                  }>${p.name}</option>`
              )
              .join("")}
          </select>
          <input type="number" data-team="${team}" data-index="${i}" value="${
          g.goals
        }" min="1">
          <button class="remove-btn" data-team="${team}" data-index="${i}">×</button>
        `;
        area.appendChild(div);
      };

      team1Goals.forEach((g, i) => createEntry(g, "1", i, t1Players, t1Area));
      team2Goals.forEach((g, i) => createEntry(g, "2", i, t2Players, t2Area));

      // イベント登録
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
          if (team === "1") team1Goals[index].playerName = e.target.value;
          else team2Goals[index].playerName = e.target.value;
          updateScores();
        });
      });

      document.querySelectorAll("input[data-team]").forEach((inp) => {
        inp.addEventListener("change", (e) => {
          const { team, index } = e.target.dataset;
          const val = parseInt(e.target.value);
          if (team === "1") team1Goals[index].goals = val;
          else team2Goals[index].goals = val;
          updateScores();
        });
      });

      updateScores();
    }

    renderGoals();

    document.querySelectorAll(".add-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const team = e.target.dataset.team;
        if (team === "1") team1Goals.push({ playerName: "", goals: 1 });
        else team2Goals.push({ playerName: "", goals: 1 });
        renderGoals();
      });
    });

    // 時刻モーダル
    const modal = document.getElementById("time-picker-modal");
    const hourSel = document.getElementById("hour-select");
    const minSel = document.getElementById("minute-select");

    document.getElementById("open-time-picker").onclick = () => {
      hourSel.innerHTML = Array.from({ length: 24 }, (_, i) =>
        `<option>${String(i).padStart(2, "0")}</option>`
      ).join("");
      minSel.innerHTML = Array.from({ length: 60 }, (_, i) =>
        `<option>${String(i).padStart(2, "0")}</option>`
      ).join("");
      modal.classList.remove("hidden");
    };

    document.getElementById("cancel-time").onclick = () =>
      modal.classList.add("hidden");

    document.getElementById("confirm-time").onclick = () => {
      const h = hourSel.value;
      const m = minSel.value;
      timeSpan.textContent = `${h}:${m}`;
      modal.classList.add("hidden");
    };

    // 保存
    document.getElementById("save-entry").onclick = () => {
      match.round = roundSel.value;
      match.team1 = t1Sel.value;
      match.team2 = t2Sel.value;
      match.date = dateInput.value;
      match.time = timeSpan.textContent;
      match.venue = venueInput.value;
      match.team1Goalscorers = team1Goals;
      match.team2Goalscorers = team2Goals;
      match.team1Score = team1Goals.reduce((s, g) => s + g.goals, 0);
      match.team2Score = team2Goals.reduce((s, g) => s + g.goals, 0);
      match.status = calcStatus(match.date, match.time);

      saveMatches(matches);
      location.href = "matchResult.html";
    };
  }
})();
