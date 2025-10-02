window.addEventListener('DOMContentLoaded', function() {
  SetPulldown();
});

function SetPulldown() {
  var departments = ["法人事務オペレーション部", "情報システム部", "営業企画部", "デジタルイノベーションハブ"];
  var select = document.getElementById("departmentSelect");
  var teamName = document.getElementById("pt_manageMemb_addMemberBox");

  

  // 一度クリア（重複防止）
  select.innerHTML = "";

  departments.forEach(function(dept) {
    var option = document.createElement("option");
    option.value = dept;
    option.textContent = dept;
    select.appendChild(option);
  });
    // 初期表示（最初の部署を表示）
  teamName.textContent = select.value;

  // 選択が変わったら表示を更新
  select.addEventListener("change", function() {
    teamName.textContent = select.value;
  });

}

