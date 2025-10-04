window.addEventListener('DOMContentLoaded', function () {
  // 初期化処理
  initPulldown();
  updateMemberCount();
  filterMembers("");
  

  // 初期表示時メンバーカード生成未実装
  //　DBからメンバー情報を取得してカードを生成する処理をここに追加予定
  // createMemberCard(dept, empId, name)メソッドを使用

  // 登録ボタンにイベント付与
  var addButton = document.querySelector(".pt_mgMem_addMemberButton");
  if (addButton) {
    addButton.addEventListener("click", function () {
      addMember();
    });
  }
  // 既存カードに編集・削除イベントをセット
  document.querySelectorAll(".pt_mgMem_personCard").forEach(function (card) {
    setCardEvents(card);
  });

  // 部署選択プルダウンにイベント付与
  var select = document.getElementById("departmentSelect");
  if (select) {
    select.addEventListener("change", function () {
      filterMembers(select.value);
    });
  }
});

/* メンバー数をカウントして表示*/
function updateMemberCount() {
  var countMembers = document.querySelectorAll(".pt_mgMem_personCard").length;
  var memberCountDisplay = document.getElementById("pt_mgMem_countMembers");

  if (memberCountDisplay) {
    memberCountDisplay.textContent = countMembers + "名";
  };
}

/*プルダウン（部署選択）を初期化*/
function initPulldown() {
  // 部署リストを定義
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

  // デフォルトの「選択してください」を追加
  var defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "選択してください";
  defaultOption.selected = true;
  select.appendChild(defaultOption);

  // 部署リストを選択肢として追加
  departments.forEach(d => {
    var option = document.createElement("option");
    option.value = d;
    option.textContent = d;
    select.appendChild(option);
  });

  // 初期表示
  teamName.textContent = "選択してください";

  // 入力欄とプルダウンの監視をまとめて登録
  const empIdInput = document.querySelectorAll(".pt_mgMem_addMemberInputField")[0];
  const nameInput  = document.querySelectorAll(".pt_mgMem_addMemberInputField")[1];
  const addButton  = document.querySelector(".pt_mgMem_addMemberButton");

  [empIdInput, nameInput, select].forEach(el => {
    if (el) {
      el.addEventListener("input", toggleAddButton);
      el.addEventListener("change", toggleAddButton);
    }
  });

  toggleAddButton(); // 初期チェック
}

/* 部署でメンバーをフィルタリング */
function addMember() {
  var select = document.getElementById("departmentSelect");
  var dept = select.value;
  var empId = document.querySelectorAll(".pt_mgMem_addMemberInputField")[0].value;
  var name = document.querySelectorAll(".pt_mgMem_addMemberInputField")[1].value;

  // メンバーカードを生成（戻り値を受け取る）
  var card = createMemberCard(dept, empId, name);

  // メンバー一覧の末尾に追加
  var memberList = document.querySelector(".pt_mgMem_textShowMember");
  memberList.appendChild(card);

  // 編集・削除イベントをセット
  setCardEvents(card);

  // 追加後のフィルタリングと人数更新
  filterMembers(select.value);


  // 入力欄をリセット
  document.querySelectorAll(".pt_mgMem_addMemberInputField")[0].value = "";
  document.querySelectorAll(".pt_mgMem_addMemberInputField")[1].value = "";

}

/* 登録ボタンの有効/無効を切り替える関数 */
function toggleAddButton() {
  const empIdInput = document.querySelectorAll(".pt_mgMem_addMemberInputField")[0];
  const nameInput  = document.querySelectorAll(".pt_mgMem_addMemberInputField")[1];
  const deptSelect = document.getElementById("departmentSelect");
  const addButton  = document.querySelector(".pt_mgMem_addMemberButton");

  if (!empIdInput || !nameInput || !deptSelect || !addButton) return;

  const empId = empIdInput.value.trim();
  const name  = nameInput.value.trim();
  const dept  = deptSelect.value.trim();

  // 部署 + 職員コード + 氏名 のすべて必須
  const isValid = empId && name && dept;

  addButton.disabled = !isValid; // ← disabled属性で管理
  addButton.classList.toggle("pt_mgMem_addMemberButton_disabled", !isValid);
}



/* メンバーカードを生成する関数 */
function createMemberCard(dept, empId, name) {
  // メンバーカードのHTMLを生成// カード要素を作成
  var card = document.createElement("div");
  card.className = "pt_mgMem_personCard";
  card.setAttribute("data-department", dept);
  card.setAttribute("data-employee-id", empId);
  card.setAttribute("data-name", name);

  card.innerHTML = `
<div class="pt_mgMem_personCard_left c_typo_heading_md c_typo_color_black">
  ${name}
</div>
<div class="pt_mgMem_personCard_right">
  <!-- 完了アイコン（チェック） -->
  <div href="#" class="pt_mgMem_checkIcon c_typo_heading_md pt_mgMem_hidden">
    <svg class="pt_mgMem_ItemIcon" width="24" height="24" viewBox="0 0 24 24" fill="none"
         xmlns="http://www.w3.org/2000/svg" role="img" aria-label="完了">
      <path d="M5 13l4 4L19 7"
            stroke="currentColor" stroke-width="2" fill="none"
            stroke-linecap="round" />
    </svg>
  </div>

  <!-- 編集アイコン（鉛筆） -->
  <div href="#" class="pt_mgMem_correctIcon c_typo_heading_md">
    <svg class="pt_mgMem_ItemIcon icon_edit" width="24" height="24" viewBox="0 0 24 24"
         fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="編集">
      <!-- ペン本体 -->
      <path d="M3 17.25V21h3.75L18.81 8.94a1.5 1.5 0 0 0 0-2.12l-1.69-1.69a1.5 1.5 0 0 0-2.12 0L3 17.25z"
            stroke="currentColor" stroke-width="1.5" fill="none" />
      <!-- ペン先の線 -->
      <path d="M13.5 6l4.5 4.5M12 21h9"
            stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" fill="none" />
    </svg>
  </div>

  <!-- 削除アイコン（バツ） -->
  <div href="#" class="pt_mgMem_deleteIcon c_typo_heading_md c_typo_color_white">
    <svg class="pt_mgMem_ItemIcon" width="24" height="24" viewBox="0 0 24 24" fill="none"
         xmlns="http://www.w3.org/2000/svg" role="img" aria-label="閉じる">
      <path d="M6 6l12 12M18 6L6 18"
            stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>
  </div>
</div>

  `;
  return card;
}

// カードにイベントを付与する共通関数
function setCardEvents(card) {
  // 削除イベント
  const delBtn = card.querySelector(".pt_mgMem_deleteIcon");
  if (delBtn) {
    delBtn.addEventListener("click", function () {
      card.remove();
      filterMembers(document.getElementById("departmentSelect").value);
      //DB削除処理をここに追加する（empIdをキーに削除）
      // const empId = card.getAttribute("data-employee-id");
      // deleteFromDB(empId);
    });
  }

  // 編集アイコン（鉛筆）
  const editBtn = card.querySelector(".pt_mgMem_correctIcon");
  //削除アイコン（バツ） ← HTMLでは pt_mgMem_deleteIcon
  const deleteBtn = card.querySelector(".pt_mgMem_deleteIcon");
  // 完了アイコン（チェック） ← HTMLでは pt_mgMem_checkIcon
  const doneBtn = card.querySelector(".pt_mgMem_checkIcon");
  const nameDiv = card.querySelector(".pt_mgMem_personCard_left");


  if (editBtn && doneBtn) {
    // 編集開始（鉛筆押下）
    editBtn.addEventListener("click", function () {
      const currentName = card.getAttribute("data-name");
      nameDiv.innerHTML = `<input type="text" class="pt_mgMem_editNameInput" value="${currentName}" />`;

      editBtn.classList.add("pt_mgMem_hidden");
      doneBtn.classList.remove("pt_mgMem_hidden");
    });

    // 編集完了（チェック押下）
    doneBtn.addEventListener("click", function () {
      const input = card.querySelector(".pt_mgMem_editNameInput");
      const newName = input.value.trim() || card.getAttribute("data-name");

      card.setAttribute("data-name", newName);
      nameDiv.textContent = newName;

      // TODO: DB更新処理をここに追加する（empId をキーに newName を保存）
      // const empId = card.getAttribute("data-employee-id");
      // updateDB(empId, newName);

      doneBtn.classList.add("pt_mgMem_hidden");
      editBtn.classList.remove("pt_mgMem_hidden");
    });
  }
}

/* 部署ごとにメンバーをフィルタリングして人数を更新 */
function filterMembers(selectedDept) {
  var cards = document.querySelectorAll(".pt_mgMem_personCard");
  var visibleCount = 0;

  cards.forEach(function (card) {
    var dept = card.getAttribute("data-department");

    if (selectedDept === "" || dept === selectedDept) {
      card.style.display = "flex"; // 表示
      visibleCount++;
    } else {
      card.style.display = "none"; // 非表示
    }
  });

  // 部署ごとの人数を表示
  var memberCountDisplay = document.getElementById("pt_mgMem_countMembers");
  if (memberCountDisplay) {
    memberCountDisplay.textContent = visibleCount + "名";
  }
}
