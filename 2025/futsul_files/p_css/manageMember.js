// チームデータを定義
var teamsData;

window.addEventListener('DOMContentLoaded', async function () {
  // 初期化処理
  await getTeams();
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

  // チーム選択プルダウンにイベント付与
  // 部署選択プルダウンにイベント付与
  var select = document.getElementById("departmentSelect");
  if (select) {
    // メンバーの絞り込み
    select.addEventListener("change", function () {
      setMembers(select.value);
      filterMembers(select.value);
    });

    // ✅ タイトル更新処理（修正版）
    select.addEventListener("change", function () {
      const teamName = document.getElementById("pt_mgMem_addMemberBox");

      if (select.value === "" || select.value === "選択してください") {
        teamName.textContent = "新規登録";
      } else {
        for (let i = 0; i < teamsData.length; i++) {
          if (teamsData[i].teamId == select.value) {
            teamName.textContent = teamsData[i].omittedTeamName + "・新規登録";
            break;
          }
        }
      }
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

/*プルダウン（チーム選択）を初期化*/
function initPulldown() {
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

  // チームリストを選択肢として追加
  for (let i = 0; i < teamsData.length; i++) {
    const option = document.createElement("option");
    option.value = teamsData[i].teamId;
    option.textContent = teamsData[i].omittedTeamName;
    select.appendChild(option);
  }

  // 初期表示
  teamName.textContent = "新規登録";

  // 入力欄とプルダウンの監視をまとめて登録
  const empIdInput = document.querySelectorAll(".pt_mgMem_addMemberInputField")[0];
  const nameInput = document.querySelectorAll(".pt_mgMem_addMemberInputField")[1];
  const addButton = document.querySelector(".pt_mgMem_addMemberButton");

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

  // 登録ボタンを無効化
  toggleAddButton();

}

/* 登録ボタンの有効/無効を切り替える関数 */
function toggleAddButton() {
  const empIdInput = document.querySelectorAll(".pt_mgMem_addMemberInputField")[0];
  const nameInput = document.querySelectorAll(".pt_mgMem_addMemberInputField")[1];
  const deptSelect = document.getElementById("departmentSelect");
  const addButton = document.querySelector(".pt_mgMem_addMemberButton");

  if (!empIdInput || !nameInput || !deptSelect || !addButton) return;

  const empId = empIdInput.value.trim();
  const name = nameInput.value.trim();
  const dept = deptSelect.value.trim();

  // 部署 + 職員コード + 氏名 のすべて必須
  const isValid = empId && name && dept;

  addButton.disabled = !isValid;
  addButton.classList.toggle("pt_mgMem_addMemberButton_disabled", !isValid);
} // ←★これを忘れてた


/* メンバーカードを生成する関数 */
function createMemberCard(dept, empId, name) {
  // メンバーカードのHTMLを生成// カード要素を作成
  var card = document.createElement("div");
  card.className = "pt_mgMem_personCard";
  card.setAttribute("data-department", dept);
  card.setAttribute("data-employee-id", empId);
  card.setAttribute("data-name", name);

  card.innerHTML =
    `<div class="pt_mgMem_personCard_left c_typo_heading_md c_typo_color_black">
  ${name}
</div>
<div class="pt_mgMem_personCard_right">
  <!-- 完了アイコン（チェック） -->
  <div href="javascript:void(0);" class="pt_mgMem_checkIcon c_typo_heading_md pt_mgMem_hidden"><svg class="pt_mgMem_ItemIcon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="完了">
      <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
    </svg></div>

  <!-- 編集アイコン（鉛筆） -->
  <div href="javascript:void(0);" class="pt_mgMem_correctIcon c_typo_heading_md"><svg class="pt_mgMem_ItemIcon icon_edit" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="編集">
      <!-- ペン本体 -->
      <path d="M3 17.25V21h3.75L18.81 8.94a1.5 1.5 0 0 0 0-2.12l-1.69-1.69a1.5 1.5 0 0 0-2.12 0L3 17.25z" stroke="currentColor" stroke-width="1.5" fill="none" />
      <!-- ペン先の線 -->
      <path d="M13.5 6l4.5 4.5M12 21h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" />
    </svg></div>

  <!-- 削除アイコン（バツ） -->
  <div href="javascript:void(0);" class="pt_mgMem_deleteIcon c_typo_heading_md c_typo_color_white"><svg class="pt_mgMem_ItemIcon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="閉じる">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg></div>
</div>`;

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
      nameDiv.innerHTML = `<input type=\"text\" class=\"pt_mgMem_editNameInput\" value=\"${currentName}\" />`;

      editBtn.classList.add("pt_mgMem_hidden");
      doneBtn.classList.remove("pt_mgMem_hidden");
    });

    // 編集完了（チェック押下）
    doneBtn.addEventListener("click", async function () {
      const input = card.querySelector(".pt_mgMem_editNameInput");
      const newName = input.value.trim() || card.getAttribute("data-name");
      const empId = card.getAttribute("data-employee-id");
      const dept = card.getAttribute("data-department");

      card.setAttribute("data-name", newName);
      nameDiv.textContent = newName;

      // クライアントの変数データを更新
      for (let i = 0; i < teamsData.length; i++) {
        if (teamsData[i].teamId == dept) {
          for (let j = 0; j < teamsData[i].member.length; j++) {
            if (teamsData[i].member[j].shokuinId == empId) {
              teamsData[i].member[j].shokuinName = newName;
              break;
            }
          }
        }
      }

      // DBのメンバーデータを更新（empId をキーに newName と dept を保存）
      await updateMember(empId, newName, dept);

      doneBtn.classList.add("pt_mgMem_hidden");
      editBtn.classList.remove("pt_mgMem_hidden");
    });
  }
}

/* チーム選択プルダウン選択時にメンバーカードを生成する処理 */
function setMembers(selectedDept) {
  for (let i = 0; i < teamsData.length; i++) {
    if (teamsData[i].teamId == selectedDept) {
      for (let j = 0; j < teamsData[i].member.length; j++) {
        // メンバーカードを生成（戻り値を受け取る）
        const card = createMemberCard(teamsData[i].teamId, teamsData[i].member[j].shokuinId, teamsData[i].member[j].shokuinName);

        // メンバー一覧の末尾に追加
        const memberList = document.querySelector(".pt_mgMem_textShowMember");
        memberList.appendChild(card);

        // 編集・削除イベントをセット
        setCardEvents(card);
      }
      break;
    }
  }
}

function filterMembers(selectedDept) {
  const memberList = document.querySelector(".pt_mgMem_textShowMember");
  const memberCountDisplay = document.getElementById("pt_mgMem_countMembers");
  const cards = document.querySelectorAll(".pt_mgMem_personCard");

  if (!memberList || !memberCountDisplay) return;

  // ✅ プルダウン未選択時は非表示
  if (!selectedDept) {
    memberList.style.display = "none";
    cards.forEach(c => (c.style.display = "none"));
    memberCountDisplay.textContent = "";
    return;
  }

  // ✅ 選択されたら再表示
  memberList.style.display = "block";
  let visibleCount = 0;

  cards.forEach(card => {
    const dept = card.getAttribute("data-department");
    if (dept === selectedDept) {
      card.style.display = "flex";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
  });

  memberCountDisplay.textContent = visibleCount + "名";

}

/* DBからチームデータを取得 */
async function getTeams() {
  console.log('getTeams()');
  console.log('ローディング開始');
  // showLoader();

  // テスト用に仮データを定義
  // teamsData = [
  //   {
  //     teamId: "101",
  //     teamName: "テスト部１",
  //     omittedTeamName: "テスト01",
  //     member: [
  //       {
  //         shokuinId: "A000001",
  //         shokuinName: "め_明安　太郎"
  //       },
  //       {
  //         shokuinId: "A000002",
  //         shokuinName: "め_明安　花子"
  //       }
  //     ]
  //   },
  //   {
  //     teamId: "102",
  //     teamName: "テスト部２",
  //     omittedTeamName: "テスト02",
  //     member: [
  //       {
  //         shokuinId: "A000011",
  //         shokuinName: "か_竈門　丹次郎"
  //       },
  //       {
  //         shokuinId: "A000012",
  //         shokuinName: "そ_孫　悟空"
  //       },
  //       {
  //         shokuinId: "A000013",
  //         shokuinName: "え_円堂　守"
  //       },
  //       {
  //         shokuinId: "A000014",
  //         shokuinName: "い_潔　世一"
  //       },
  //       {
  //         shokuinId: "A000015",
  //         shokuinName: "ご_五条　悟"
  //       },
  //       {
  //         shokuinId: "A000016",
  //         shokuinName: "え_江戸川　コナン"
  //       },
  //       {
  //         shokuinId: "A000017",
  //         shokuinName: "さ_坂田　銀時"
  //       }
  //     ]
  //   },
  //   {
  //     teamId: "103",
  //     teamName: "テスト部３",
  //     omittedTeamName: "テスト03",
  //     member: []
  //   }
  // ];

  // クエリパラメータを付与したURLを作成
  const params = new URLSearchParams({
    action: "getTeams"
  });

  const newUrl = `${WEB_APP_URL}?${params.toString()}`;

  try {
    console.log('try開始');
    // GASエンドポイントへのGETリクエスト
    const response = await fetch(newUrl);

    // HTTPステータスコードをチェック
    if (!response.ok) {
      // エラーを表示
      throw new Error(`HTTPエラー! ステータス: ${response.status}`);
    }

    // レスポンスボディをJSONとしてパース
    teamsData = await response.json();
    console.log('teamsData', teamsData);
    console.log('try終了');
  } catch (error) {
    console.log('catch開始');
    console.error('データ取得中にエラーが発生しました,', error);
    console.log('catch終了');
  } finally {
    console.log('ローディング終了');
    hideLoader();
  }
}

/* DBのメンバーデータを更新 */
async function updateMember(empId, newName, dept) {
  console.log(`updateMember(${empId}, ${newName}, ${dept})`);
  console.log('ローディング開始');
  showLoader();

  // クエリパラメータを付与したURLを作成
  const params = new URLSearchParams({
    action: "updateMember"
  });

  const newUrl = `${WEB_APP_URL}?${params.toString()}`;

  // 送信するデータをJavaScriptのオブジェクトとして準備
  const dataToSend = {
    shokuinId: empId,
    shokuinName: newName,
    teamId: dept
  };

  try {
    const response = await fetch(newUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: JSON.stringify(dataToSend)
    });

    // HTTPステータスコードをチェック
    if (!response.ok) {
      throw new Error(`HTTPエラー! ステータス: ${response.status}`);
    }

    // GASからのレスポンスをJSONとして受け取る
    const result = await response.json();
  } catch (error) {
    console.error("データ送信中にエラーが発生しました:", error);
  } finally {
    console.log('ローディング終了');
    hideLoader();
  }
}