/** メンバー **/
window.addEventListener('DOMContentLoaded', function () {
    const memberData = getMemberLists();

    const teamList = document.getElementById('mem_teamList');

    if (memberData.length == 0) {
        // チームリストが未登録の場合
        const li = document.createElement('li');
        const p = document.createElement('p');
        p.classList.add('c_typo_bodyL c_typo_WHT c_typo_center');
        p.innerText = 'チームデータが未登録です。管理者に問い合わせてください。';
        li.appendChild(p);
        teamList.appendChild(li);
    } else {
        // チームが1つ以上登録済みの場合
        for (let i = 0; i < memberData.length; i++) {
            const li = document.createElement('li');
            const p1 = document.createElement('p');
            p1.classList.add('c_typo_headerM', 'c_typo_WHT');
            p1.innerText = memberData[i].teamName;
            if (memberData[i].member.length == 0) {
                // チームメンバーが未登録の場合
                li.appendChild(p1);

                const div1 = document.createElement('div');
                div1.classList.add('mem_memberBtnArea');
                const div2 = document.createElement('div');
                div2.classList.add('com_btnWidth280');
                const a = document.createElement('a');
                a.classList.add('c_btn', 'c_btn_sizeM', 'c_btn_GRN');
                a.href = '.\/member_register.html' + `?teamId=${memberData[i].teamId}`;
                const p2 = document.createElement('p');
                p2.classList.add('c_typo_headerS', 'c_typo_WHT', 'c_typo_center');
                p2.innerText = 'メンバー登録';
                a.appendChild(p2);
                div2.appendChild(a);
                div1.appendChild(div2);
                li.appendChild(div1);
            } else {
                // チームメンバーが1人以上登録済みの場合
                const div1 = document.createElement('div');
                div1.classList.add('mem_teamHeader');
                div1.appendChild(p1);
                const div2 = document.createElement('div');
                div2.classList.add('mem_editLink');
                const div3 = document.createElement('div');
                div3.classList.add('c_textLink');
                const a = document.createElement('a');
                a.href = '.\/member_register.html' + `?type=edit&teamId=${memberData[i].teamId}`;
                const p2 = document.createElement('p');
                p2.classList.add('c_typo_headerS', 'c_typo_WHT');
                p2.innerText = '変更';
                const img = document.createElement('img');
                img.classList.add('c_textLink_icon_right');
                img.src = '..\/futsul_files\/p_image\/pencil.svg?20251010';
                img.alt = '変更';
                a.appendChild(p2);
                a.appendChild(img);
                div3.appendChild(a);
                div2.appendChild(div3);
                div1.appendChild(div2);
                li.appendChild(div1);

                const div4 = document.createElement('div');
                div4.classList.add('mem_memberTableWrapper');
                const table = document.createElement('table');
                table.classList.add('mem_memberTable');
                const thead = document.createElement('thead');
                const tr1 = document.createElement('tr');
                const th1 = document.createElement('th');
                const p3 = document.createElement('p');
                p3.classList.add('c_typo_headerS', 'c_typo_BLK01', 'c_typo_center');
                p3.innerText = 'No';
                th1.appendChild(p3);
                tr1.appendChild(th1);
                const th2 = document.createElement('th');
                const p4 = document.createElement('p');
                p4.classList.add('c_typo_headerS', 'c_typo_BLK01', 'c_typo_center');
                p4.innerText = '氏名';
                th2.appendChild(p4);
                tr1.appendChild(th2);
                thead.appendChild(tr1);
                table.appendChild(thead);
                const tbody = document.createElement('tbody');
                for (let j = 0; j < memberData[i].member.length; j++) {
                    const tr2 = document.createElement('tr');
                    const td1 = document.createElement('td');
                    const p5 = document.createElement('p');
                    p5.classList.add('c_typo_bodyM', 'c_typo_BLK01');
                    p5.innerText = (j + 1).toString();
                    td1.appendChild(p5);
                    tr2.appendChild(td1);
                    const td2 = document.createElement('td');
                    const p6 = document.createElement('p');
                    p6.classList.add('c_typo_bodyM', 'c_typo_BLK01');
                    p6.innerText = memberData[i].member[j].shokuinName;
                    td2.appendChild(p6);
                    tr2.appendChild(td2);
                    tbody.appendChild(tr2);
                }
                table.appendChild(tbody);
                div4.appendChild(table);
                li.appendChild(div4);
            }
            teamList.appendChild(li);
        }
    }
});

// メンバー情報取得（仮データ）
function getMemberLists() {
    const data = [
        {
            teamId: "101",
            teamName: "営業企画部",
            member: [
                {
                    shokuinName: "み_水野　大樹"
                },
                {
                    shokuinName: "ゆ_行光　隆昌"
                },
                {
                    shokuinName: "た_髙橋　祐貴"
                },
                {
                    shokuinName: "お_太田　竜司"
                },
                {
                    shokuinName: "く_窪田　航介"
                },
                {
                    shokuinName: "い_岩政　亮汰"
                }
            ]
        },
        {
            teamId: "102",
            teamName: "法人事務オペレーション部",
            member: [
                {
                    shokuinName: "お_大浦　優輝"
                },
                {
                    shokuinName: "た_高橋　輝也"
                },
                {
                    shokuinName: "あ_安居院　康平"
                },
                {
                    shokuinName: "か_笠原　幹夫"
                },
                {
                    shokuinName: "わ_若林　教和"
                },
                {
                    shokuinName: "や_山井　舜也"
                }
            ]
        },
        {
            teamId: "103",
            teamName: "デジタルイノベーションHub",
            member: [
                {
                    shokuinName: "い_伊藤　優"
                },
                {
                    shokuinName: "ふ_藤田　真吾"
                },
                {
                    shokuinName: "は_原田　真吾"
                }
            ]
        },
        {
            teamId: "105",
            teamName: "情報システム部",
            member: []
        },
        {
            teamId: "999",
            teamName: "テスト部",
            member: []
        }
    ];

    const jsonData = JSON.stringify(data);

    const parsedData = JSON.parse(jsonData);

    return parsedData;
}

// async function getMemberLists() {
//     // 1. 送信するクエリパラメータを作成
//     const params = new URLSearchParams({
//         action: 'getMembers'
//     });

//     // 2. GASのURLにクエリ文字列を結合
//     const fullUrl = `${GAS_WEB_APP_URL}?${params.toString()}`;

//     try {
//         // 3. GETリクエストの実行
//         const response = await fetch(fullUrl, {
//             method: 'GET'
//         });

//         // 4. レスポンスの確認
//         if (!response.ok) {
//             throw new Error(`HTTPエラー！ステータス: ${response.status}`);
//         }

//         // 5. GASからのJSONデータを取得
//         const data = await response.json();

//         console.log('--- GASからの応答 ---');
//         console.log('ステータス:', data.status);
//         console.log('受信した名前:', data.received.name);
//         console.log('受信したメッセージ:', data.received.message);
//         console.log('タイムスタンプ:', data.timestamp);

//         return data;
//     } catch (error) {
//         console.error('GASへの通信エラー:', error);
//     }
// }