/** メンバー登録 **/
window.addEventListener('DOMContentLoaded', function () {
    if (getQuery('type') == 'edit') {
        console.log('編集モード');
        const title = document.getElementById('mer_title');
        const exp = document.getElementById('mer_exp');
        title.innerText = '編集';
        exp.innerText = '参加メンバーを編集してください。';
    }

    const textField = document.getElementsByClassName('c_textField');
    for (let i = 0; i < textField.length; i++) {
        textField[i].addEventListener('blur', function () {
            if (this.id.startsWith('mer_shokuinNum')) {
                this.value = convertFullwidthAlphanumericToHalfwidth(this.value);
                this.value = convertToLowercaseToUppercase(this.value);
            } else if (this.id.startsWith('mer_name')) {
                this.value = convertFullwidthUnderscoreToHalfwidth(this.value);
                this.value = convertHalfwidthSpaceToFullwidth(this.value);
            }
        });
    }

    // メンバーを追加リンク押下時の処理
    const addLink = document.getElementById('mer_addLink');
    addLink.addEventListener('click', function () {
        const ul = document.getElementById('mer_inputList');
        const numOfLi = ul.children.length;
        const shokuinNumClone = ul.children.item(1).cloneNode(true);
        shokuinNumClone.getElementsByTagName('p')[0].innerText = shokuinNumClone.getElementsByTagName('p')[0].innerText + '（' + ((numOfLi - 1) / 2 + 1) + '人目）';
        shokuinNumClone.getElementsByClassName('c_textField')[0].id = 'mer_shokuinNum' + ((numOfLi - 1) / 2 + 1);
        shokuinNumClone.getElementsByClassName('c_textField')[0].value = '';
        const nameClone = ul.children.item(2).cloneNode(true);
        nameClone.getElementsByTagName('p')[0].innerText = nameClone.getElementsByTagName('p')[0].innerText + '（' + ((numOfLi - 1) / 2 + 1) + '人目）';
        nameClone.getElementsByClassName('c_textField')[0].id = 'mer_name' + ((numOfLi - 1) / 2 + 1);
        nameClone.getElementsByClassName('c_textField')[0].value = '';
        ul.appendChild(shokuinNumClone);
        ul.appendChild(nameClone);
    });
});