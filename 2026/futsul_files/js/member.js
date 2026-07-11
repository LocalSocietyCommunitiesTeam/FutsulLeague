/** メンバー管理画面 **/
var data = [
    {
        teamId: '104',
        teamName: '情シス',
        member: [
            {
                memberId: '10000',
                memberName: '小礒　佑斗'
            },
            {
                memberId: '10001',
                memberName: '田中　利樹'
            },
            {
                memberId: '10002',
                memberName: '掛川　夏海'
            },
            {
                memberId: '10003',
                memberName: '松谷　浩子'
            },
            {
                memberId: '10004',
                memberName: '長谷川　賢'
            },
            {
                memberId: '10005',
                memberName: '松下　泰樹'
            },
            {
                memberId: '10008',
                memberName: '松本　康汰'
            },
            {
                memberId: '10009',
                memberName: '安田　泰仁'
            }
        ]
    },
    {
        teamId: '100',
        teamName: '営企',
        member: [
            {
                memberId: '10006',
                memberName: '今西　優羽'
            }
        ]
    },
    {
        teamId: '101',
        teamName: '法人事務オペ',
        member: [
            {
                memberId: '10007',
                memberName: '安居院　康平'
            }
        ]
    },
    {
        teamId: '102',
        teamName: 'デジHub',
        member: [
            {
                memberId: '10010',
                memberName: '宇和田　真琴'
            }
        ]
    },
    {
        teamId: '117',
        teamName: '地域共創戦略',
        member: [
            {
                memberId: '10011',
                memberName: '川原　志帆'
            }
        ]
    },
    {
        teamId: '118',
        teamName: 'サイバー・シスリス',
        member: [
            {
                memberId: '10012',
                memberName: '中西　拓実'
            }
        ]
    }
];

document.addEventListener('DOMContentLoaded', async function () {
    showLoader();
    
    // 💡 大会ID（teamId）として "104" を指定してデータを取得
    const memberData = await fetchMembers();

    // データが取得できていれば画面にセットする
    if (memberData) {
        setTeamData();
        setMemberData(memberData);
        
        const deleteBtn = document.getElementsByClassName('mem_deleteBtn');
        for(let i = 0; i < deleteBtn.length; i++) {
            deleteBtn[i].addEventListener('click', function() {
                const dialog = document.getElementById('mem_dialog');
                dialog.getElementsByClassName('c_dialog02_showModal')[0].click();
            });
        }
    }
    
    const dialogDeleteBtn = document.getElementById('mem_deleteBtn');
    dialogDeleteBtn.addEventListener('click', function() {
        const dialog = document.getElementById('mem_dialog');
        dialog.getElementsByClassName('c_dialog02_CloseBtn')[0].click();
    });
    
    const cancelBtn = document.getElementById('mem_cancelBtn');
    cancelBtn.addEventListener('click', function() {
        const dialog = document.getElementById('mem_dialog');
        dialog.getElementsByClassName('c_dialog02_CloseBtn')[0].click();
    });
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
    } finally {
        closeLoader();
    }
}

function setTeamData() {
    const pulldown = document.getElementById('mem_pulldown');
    for(let i = 0; i < data.lengh; i++) {
        const option = document.createElement('option');
        option.value = data[i].teamId;
        option.innerText = data[i].teamName;
        pulldown.append(option);
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