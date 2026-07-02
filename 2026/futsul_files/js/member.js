/** メンバー管理画面 **/
var data = [
    {
        teamId: '104',
        memberId: '10000',
        memberName: '掛川　夏海'
    },
    {
        teamId: '104',
        memberId: '10001',
        memberName: '小磯　佑斗'
    }
];

document.addEventListener('DOMContentLoaded', function () {
    setMemberData();
});

function setMemberData() {
    const memberlist = document.getElementById('mem_list');
    const memberName = document.getElementsByClassName('mem_name');
    const memberNameInput = document.getElementsByClassName('mem_nameInput');

    for (let i = 0; i < data.length; i++) {
        const li = `<li>
    <div class="mem_list_left">
        <p class="c_typo_bodyM c_typo_BLK10 mem_name">${data[i].memberName}</p>
        <div class="c_textField01 mem_nameInput mem_hidden">
            <div class="c_textField01_inputForm"><input value="${data[i].memberName}" class="c_textField01_inputText" placeholder="明安　太郎" /></div>
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