/** メンバー管理画面 **/
// var data = [
//     {
//         teamId: '104',
//         memberId: '10000',
//         memberName: '掛川　夏海'
//     },
//     {
//         teamId: '104',
//         memberId: '10001',
//         memberName: '小磯　佑斗'
//     }
// ];

document.addEventListener('DOMContentLoaded', async function () {
    // 💡 大会ID（teamId）として "104" を指定してデータを取得
    const memberData = await fetchMembers();

    // データが取得できていれば画面にセットする
    if (memberData) {
        setMemberData(memberData);
    }
});

/**
 * メンバーシートからデータを取得する
 * @param {string} [tournamentId] - 大会ID（指定がなければ全量取得）
 */
async function fetchMembers(tournamentId) {
    try {
        const url = new URL(GAS_WEB_APP_URL);
        url.searchParams.append("action", "getMembers");

        if (tournamentId) {
            url.searchParams.append("tournamentId", tournamentId);
        }

        console.log("リクエスト送信:", url.toString());

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTPエラー! ステータス: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log("メンバーデータ:", result.data);
            return result.data;
        } else {
            console.error("エラーが発生しました:", result.message);
            if (result.error) console.error("詳細:", result.error);
        }

    } catch (error) {
        console.error("通信エラー:", error);
    }
}

// 💡 引数でデータ(配列)を受け取れるように変更
function setMemberData(data) {
    const memberlist = document.getElementById('mem_list');

    // リストを一度初期化（重複防止）
    memberlist.innerHTML = '';

    for (let i = 0; i < data.length; i++) {
        // 💡 GASからのレスポンスは2次元配列のため、A列のデータを名前として扱う場合は data[i][0] とします
        if (data[i].teamId == '104') {
            const memberData = data[i].member;
            for (j = 0; j < memberData.length; j++) {
                const memberName = memberData[j].memberName;
                const li = `<li>
    <div class="mem_list_left">
        <p class="c_typo_bodyM c_typo_BLK10 mem_name">${memberName}</p>
        <div class="c_textField01 mem_nameInput mem_hidden">
            <div class="c_textField01_inputForm"><input value="${memberName}" class="c_textField01_inputText" placeholder="明安 太郎" /></div>
        </div>
    </div>
    <div class="mem_list_right">
        <a href="javascript: void(0);" class="mem_editBtn">
            <p class="c_typo_ctaS c_typo_WHT">編集</p>
        </a>
        <a href="javascript: void(0);" class="mem_deleteBtn">
            <p class="c_typo_ctaS c_typo_GRN10">削除</p>
        </a>
    </div>
</li>`;
                memberlist.innerHTML += li;
            }
        }

        const editBtn = document.getElementsByClassName('mem_editBtn');

        for (let i = 0; i < editBtn.length; i++) {
            editBtn[i].addEventListener('click', function () {
                if (this.parentElement.parentElement.classList.contains('mem_editMode')) {
                    this.parentElement.parentElement.classList.remove('mem_editMode');
                    this.firstElementChild.innerText = '編集';
                    this.parentElement.previousElementSibling.getElementsByTagName('p')[0].classList.remove('mem_hidden');
                    this.parentElement.previousElementSibling.getElementsByClassName('mem_nameInput')[0].classList.add('mem_hidden');
                } else {
                    this.parentElement.parentElement.classList.add('mem_editMode');
                    this.firstElementChild.innerText = '保存';
                    this.parentElement.previousElementSibling.getElementsByTagName('p')[0].classList.add('mem_hidden');
                    this.parentElement.previousElementSibling.getElementsByClassName('mem_nameInput')[0].classList.remove('mem_hidden');
                    this.parentElement.previousElementSibling.getElementsByTagName('input')[0].focus();
                    const memberNameLen = this.parentElement.previousElementSibling.getElementsByTagName('input')[0].value.length;
                    this.parentElement.previousElementSibling.getElementsByTagName('input')[0].setSelectionRange(memberNameLen, memberNameLen);
                }
            });
        }
    }
}