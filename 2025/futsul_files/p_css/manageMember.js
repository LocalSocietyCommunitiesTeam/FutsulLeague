window.addEventListener('DOMContentLoaded', function() {
  initPulldown();
  updateMemberCount();
  enableUnselectedMessage();
});

/* メンバー数をカウントして表示*/
function updateMemberCount() {
  var countMembers = document.querySelectorAll(".pt_mgMem_personCard").length;
  var memberCountDisplay = document.getElementById("pt_mgMem_countMembers");

  if (memberCountDisplay) {
    memberCountDisplay.textContent = countMembers + "名";
  }
}

/*プルダウン（部署選択）を初期化*/
function initPulldown() {
  var departments = [
    "営企", "法人事務オペ", "デジhub", "IT・デジ戦", "情シス", 
    "金法業", "商サ開発", "地リレ", "業務", "営人", 
    "事務企", "事務オペ", "サ相談・CC", "ブラ戦", "監査"
  ];

  var select = document.getElementById("departmentSelect");
  var teamName = document.getElementById("pt_mgMem_addMemberBox");

  if (!select || !teamName) return;

  // 一度クリア（重複防止）
  select.innerHTML = "";

  // デフォルトの「選択してください」を先頭に追加
  var defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "選択してください";
  defaultOption.selected = true;
  select.appendChild(defaultOption);

  // 部署リストを追加
  for (var i = 0; i < departments.length; i++) {
    var option = document.createElement("option");
    option.value = departments[i];
    option.textContent = departments[i];
    select.appendChild(option);
  }

  // 初期表示は一旦「選択してください」にしておく
  teamName.textContent = "選択してください";

  // 選択が変わったら表示を更新
  select.addEventListener("change", function() {
    teamName.textContent = select.value;
  });
}

function enableUnselectedMessage() {
  var select = document.getElementById("departmentSelect");
  var teamName = document.getElementById("pt_mgMem_addMemberBox");
  var newLabel = document.getElementById("pt_mgMem_textNewLabel");

  if (!select || !teamName || !newLabel) return;

  // 初期状態（未選択時は「所属チームを選んでください」だけ）
  teamName.textContent = "";
  newLabel.textContent = "所属チームを選んでください";

  // プルダウン選択時に更新
  select.addEventListener("change", function() {
    if (select.value === "") {
      teamName.textContent = "";
      newLabel.textContent = "新規登録";
    } else {
      teamName.textContent = select.value;
      newLabel.textContent = "・新規登録";
    }
  });
}

var select = document.getElementById("departmentSelect");
var cards = document.querySelectorAll(".pt_mgMem_personCard");
var memberCountDisplay = document.getElementById("pt_mgMem_countMembers");

// 初期表示
filterMembers(select.value);

// プルダウン切り替え時
select.addEventListener("change", function() {
  filterMembers(select.value);
});

function filterMembers(selectedDept) {
  var visibleCount = 0;

  cards.forEach(function(card) {
    var dept = card.getAttribute("data-department");

    if (selectedDept === "" || dept === selectedDept) {
      card.style.display = "flex"; // 表示
      visibleCount++;              // 表示した分だけカウント
    } else {
      card.style.display = "none"; // 非表示
    }
  });

  // 表示されている人数だけを反映
  memberCountDisplay.textContent = visibleCount + "名";
}
