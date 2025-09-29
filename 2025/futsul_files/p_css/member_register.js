/** メンバー登録 **/
var members = getMembers(getQuery('teamId'));

// メンバー情報取得（仮データ）
// function getMembers(teamId) {
//     const data = {
//         teamName: "営業企画部",
//         member: [
//             {
//                 shokuinId: "A864192",
//                 shokuinName: "み_水野　大樹"
//             },
//             {
//                 shokuinId: "A481773",
//                 shokuinName: "ゆ_行光　隆昌"
//             },
//             {
//                 shokuinId: "A811534",
//                 shokuinName: "た_髙橋　祐貴"
//             },
//             {
//                 shokuinId: "A810514",
//                 shokuinName: "お_太田　竜司"
//             },
//             {
//                 shokuinId: "A853704",
//                 shokuinName: "く_窪田　航介"
//             },
//             {
//                 shokuinId: "A868574",
//                 shokuinName: "い_岩政　亮汰"
//             }
//         ]
//     };

//     const jsonData = JSON.stringify(data);

//     const parsedData = JSON.parse(jsonData);

//     return parsedData;
// }

// メンバー情報取得（サーバーデータ）
async function getMembers(teamId) {
    // 1. 送信するクエリパラメータを作成
    const params = new URLSearchParams({
        action: 'getMembers',
        teamId: teamId
    });

    // クエリパラメータを結合した完全なURL
    const fullUrl = GAS_WEB_APP_URL + '?' + params.toString();

    try {
        // 2. fetch APIでサーバーにデータを取得
        const response = await fetch(fullUrl);
        // const response = await fetch(fullUrl, {
        //     headers: {
        //         // リクエストボディがJSONであることを明示
        //         'Content-Type': 'application/json',
        //     }
        // });

        // --- エラー処理 (1): HTTPステータスエラーのチェック ---
        // response.ok はステータスコードが 200-299 の範囲内であれば true
        if (!response.ok) {
            // ステータスコードがエラー（4xx, 5xxなど）の場合
            const errorText = `HTTPエラーが発生しました。ステータス: ${response.status} (${response.statusText})`;

            // サーバーからのレスポンスボディもあれば取得して詳細情報としてログに出力
            try {
                const errorData = await response.json();
                console.error('GASサーバーからの詳細エラー:', errorData);
            } catch (e) {
                // JSON解析が失敗しても、HTTPステータスエラーとして処理を続行
                console.warn('エラーレスポンスボディのJSON解析に失敗しました。');
            }

            // エラーを投げてcatchブロックで捕捉させる
            throw new Error(errorText);
        }

        // 3. レスポンスボディをJSONとして解析
        const data = await response.json();
        window.alert(data);

        return data;
    } catch (error) {
        // --- エラー処理 (2): 通信中のエラーやthrowされたエラーの捕捉 ---
        console.error('メンバー情報取得中に予期せぬエラーが発生しました。', error.message);

        // ユーザーに表示するなど、適切なエラー通知処理をここに追加
        // 例: document.getElementById('error-message').textContent = 'データの取得に失敗しました。';

        return null; // 失敗したことを示すため、nullを返す
    }
}

window.addEventListener('DOMContentLoaded', function () {
    const departmentName = document.getElementById('mer_departmentName');
    departmentName.innerText = members.teamName;

    if (getQuery('type') == 'edit') {
        const title = document.getElementById('mer_title');
        const exp = document.getElementById('mer_exp');
        title.innerText = '編集';
        exp.innerText = '参加メンバーを編集してください。';

        for (let i = 0; i < members.member.length; i++) {
            if (i == 0) {
                // 1人目は既存の要素を使用
                document.getElementsByClassName(`mer_shokuinNum`)[i].value = members.member[i].shokuinId;
                document.getElementsByClassName(`mer_name`)[i].value = members.member[i].shokuinName;
            } else {
                // 2人目以降は要素を複製して追加
                const ul = document.getElementById('mer_inputList');
                const numOfLi = ul.children.length;
                const li = ul.firstElementChild.cloneNode(true);
                li.getElementsByClassName('mer_inputItemArea')[0].getElementsByTagName('p')[0].innerText = li.getElementsByClassName('mer_inputItemArea')[0].getElementsByTagName('p')[0].innerText + '（' + (numOfLi + 1) + '人目）';
                li.getElementsByClassName('mer_shokuinNum')[0].name = 'mer_shokuinNum' + (numOfLi + 1);
                li.getElementsByClassName('mer_shokuinNum')[0].value = members.member[i].shokuinId;
                li.getElementsByClassName('mer_inputItemArea')[1].getElementsByTagName('p')[0].innerText = li.getElementsByClassName('mer_inputItemArea')[1].getElementsByTagName('p')[0].innerText + '（' + (numOfLi + 1) + '人目）';
                li.getElementsByClassName('mer_name')[0].name = 'mer_name' + (numOfLi + 1);
                li.getElementsByClassName('mer_name')[0].value = members.member[i].shokuinName;
                ul.appendChild(li);
            }
        }
    }

    // 自動入力
    autoInputValue();
    clickDeleteLink();

    // メンバーを追加リンク押下時の処理
    const addLink = document.getElementById('mer_addLink');
    addLink.addEventListener('click', function () {
        const ul = document.getElementById('mer_inputList');
        const numOfLi = ul.children.length;
        const li = ul.firstElementChild.cloneNode(true);
        li.getElementsByClassName('mer_inputItemArea')[0].getElementsByTagName('p')[0].innerText = li.getElementsByClassName('mer_inputItemArea')[0].getElementsByTagName('p')[0].innerText + '（' + (numOfLi + 1) + '人目）';
        li.getElementsByClassName('mer_shokuinNum')[0].name = 'mer_shokuinNum' + (numOfLi + 1);
        li.getElementsByClassName('mer_shokuinNum')[0].value = '';
        li.getElementsByClassName('mer_inputItemArea')[1].getElementsByTagName('p')[0].innerText = li.getElementsByClassName('mer_inputItemArea')[1].getElementsByTagName('p')[0].innerText + '（' + (numOfLi + 1) + '人目）';
        li.getElementsByClassName('mer_name')[0].name = 'mer_name' + (numOfLi + 1);
        li.getElementsByClassName('mer_name')[0].value = '';
        ul.appendChild(li);
        autoInputValue();
        clickDeleteLink();
    });
});

// 自動入力処理
function autoInputValue() {
    const textField = document.getElementsByClassName('c_textField');

    for (let i = 0; i < textField.length; i++) {
        textField[i].addEventListener('blur', function () {
            if (this.classList.contains('mer_shokuinNum')) {
                this.value = convertFullwidthAlphanumericToHalfwidth(this.value);
                this.value = convertToLowercaseToUppercase(this.value);
            } else if (this.classList.contains('mer_name')) {
                this.value = convertFullwidthUnderscoreToHalfwidth(this.value);
                this.value = convertHalfwidthSpaceToFullwidth(this.value);
            }
        });
    }
}

function clickDeleteLink() {
    const deleteLink = document.getElementsByClassName('mer_crossBtn');

    for (let i = 0; i < deleteLink.length; i++) {
        deleteLink[i].addEventListener('click', function () {
            const ul = document.getElementById('mer_inputList');
            if (ul.children.length > 1) {
                ul.removeChild(ul.children[i]);
                // 削除後に再度番号振り直し
                for (let j = 0; j < ul.children.length; j++) {
                    ul.children[j].getElementsByClassName('mer_inputItemArea')[0].getElementsByTagName('p')[0].innerText = '職員番号' + '（' + (j + 1) + '人目）';
                    ul.children[j].getElementsByClassName('mer_inputItemArea')[0].getElementsByClassName('mer_shokuinNum')[0].name = 'mer_shokuinNum' + (j + 1);
                    ul.children[j].getElementsByClassName('mer_inputItemArea')[1].getElementsByTagName('p')[0].innerText = '氏名' + '（' + (j + 1) + '人目）';
                    ul.children[j].getElementsByClassName('mer_inputItemArea')[1].getElementsByClassName('mer_name')[0].name = 'mer_name' + (j + 1);
                }
                autoInputValue();
            }
        });
    }
}
