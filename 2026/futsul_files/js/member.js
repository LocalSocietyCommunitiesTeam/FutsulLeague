/** メンバー管理画面 **/

// 現在どのメンバーを削除しようとしているかを一時的に保持する変数
let activeDeleteMemberId = null;
// GASから取得した最新のメンバーデータを保持する変数
let cachedMemberData = null;

// 読み込み完了時の処理
document.addEventListener('DOMContentLoaded', async function () {
    showLoader();

    try {
        // メンバーデータの初回取得
        cachedMemberData = await fetchMembers();
        const pulldown = document.getElementById('mem_pulldown');

        if (cachedMemberData && pulldown) {
            // プルダウンの選択肢を設定
            setTeamData(cachedMemberData);

            // プルダウン変更時にメンバーリストを更新
            pulldown.addEventListener('change', function () {
                setMemberData(cachedMemberData, this.value);
            });
        }
    } catch (error) {
        console.error("初期化エラー:", error);
    } finally {
        closeLoader();
    }

    // ダイアログ内の共通クローズ処理を登録
    const closeDialog = function () {
        const dialog = document.getElementById('mem_dialog');
        if (dialog) {
            const closeButtons = dialog.getElementsByClassName('c_dialog02_CloseBtn');
            if (closeButtons.length > 0) {
                closeButtons[0].click();
            }
        }
    };

    // ダイアログ内のキャンセルボタン処理
    const cancelBtn = document.getElementById('mem_cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeDialog);
    }

    // ダイアログ内の削除実行ボタン処理（POST通信を行い、成功したら全量再取得＆再描画）
    const dialogDeleteBtn = document.getElementById('mem_deleteBtn');
    if (dialogDeleteBtn) {
        dialogDeleteBtn.addEventListener('click', async function () {
            if (!activeDeleteMemberId) return;

            showLoader();
            const success = await deleteMemberPost(activeDeleteMemberId);

            // 同時実行制御：成功・失敗に関わらず最新状態を再取得して描画を同期する
            cachedMemberData = await fetchMembers();
            const pulldown = document.getElementById('mem_pulldown');

            if (cachedMemberData && pulldown) {
                setMemberData(cachedMemberData, pulldown.value);
            }

            closeDialog();
            activeDeleteMemberId = null; // 初期化
            closeLoader();
        });
    }

    // リスト内のイベント（編集・保存・ダイアログ表示）は親要素で一括管理（イベント委譲）
    initMemberListEvents();
});

/**
 * GASのWebアプリからメンバーデータを取得する（GET）
 */
async function fetchMembers(tournamentId) {
    try {
        const url = new URL(GAS_WEB_APP_URL);
        url.searchParams.append("action", "getMembers");

        if (tournamentId) {
            url.searchParams.append("tournamentId", tournamentId);
        }

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error("HTTPエラー! ステータス: " + response.status);

        const result = await response.json();
        if (result.success) return result.data;

        console.error("エラー:", result.message);
        return null;
    } catch (error) {
        console.error("通信エラー:", error);
        return null;
    }
}

/**
 * メンバーの削除リクエストを送信する（POST）
 */
async function deleteMemberPost(memberId) {
    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: new URLSearchParams({ action: 'deleteMember', memberId: memberId })
        });
        if (!response.ok) throw new Error("削除リクエストに失敗しました");

        const result = await response.json();
        if (result.success) return true;

        alert("削除に失敗しました: " + result.message);
        return false;
    } catch (error) {
        console.error("削除通信エラー:", error);
        alert("通信エラーが発生しました");
        return false;
    }
}

/**
 * メンバー名の編集リクエストを送信する（POST）
 */
async function updateMemberPost(memberId, newName) {
    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: new URLSearchParams({ action: 'updateMember', memberId: memberId, memberName: newName })
        });
        if (!response.ok) throw new Error("更新リクエストに失敗しました");

        const result = await response.json();
        if (result.success) return true;

        alert("更新に失敗しました: " + result.message);
        return false;
    } catch (error) {
        console.error("更新通信エラー:", error);
        alert("通信エラーが発生しました");
        return false;
    }
}

/**
 * チームプルダウンの選択肢（option）を生成・追加する
 */
function setTeamData(data) {
    const pulldown = document.getElementById('mem_pulldown');
    if (!pulldown) return;

    let optionsHtml = '<option value="">チームを選択してください</option>';
    for (let i = 0; i < data.length; i++) {
        optionsHtml += '<option value="' + data[i].teamId + '">' + data[i].teamNameAbbreviation + '</option>';
    }
    pulldown.innerHTML = optionsHtml;
}

/**
 * 選択されたチームに応じたメンバーリストを表示する
 */
function setMemberData(data, selectedTeamId) {
    const memberlist = document.getElementById('mem_list');
    const emptyMessage = document.getElementById('mem_emptyMessage'); // 💡 親のdivタグをキャッチ
    if (!memberlist) return;

    let listHtml = '';
    let hasMember = false;

    for (let i = 0; i < data.length; i++) {
        const team = data[i];
        if (team.teamId === selectedTeamId) {
            if (team.member && team.member.length > 0) {
                hasMember = true;
                for (let j = 0; j < team.member.length; j++) {
                    const member = team.member[j];
                    listHtml += `
                        <li id="member_row_${member.memberId}" data-member-id="${member.memberId}">
                            <div class="mem_list_left">
                                <p class="c_typo_bodyM c_typo_BLK10 mem_name">${member.memberName}</p>
                                <div class="c_textField01 mem_nameInput mem_hidden">
                                    <div class="c_textField01_inputForm">
                                        <input value="${member.memberName}" class="c_textField01_inputText" placeholder="明安 太郎" />
                                    </div>
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
                }
            }
            break;
        }
    }

    memberlist.innerHTML = listHtml;

    // 表示の出し分け制御（div要素に対してクラスを着脱）
    if (!selectedTeamId) {
        memberlist.classList.add('mem_hidden');
        if (emptyMessage) emptyMessage.classList.add('mem_hidden');
    } else if (hasMember) {
        memberlist.classList.remove('mem_hidden');
        if (emptyMessage) emptyMessage.classList.add('mem_hidden');
    } else {
        memberlist.classList.add('mem_hidden');
        if (emptyMessage) emptyMessage.classList.remove('mem_hidden');
    }
}

/**
 * メンバーリスト内のボタン操作（編集・保存・削除）を監視・制御する（イベント委譲）
 */
function initMemberListEvents() {
    const memberlist = document.getElementById('mem_list');
    if (!memberlist) return;

    memberlist.addEventListener('click', async function (e) {
        let targetElement = e.target;
        let editBtn = null;
        let deleteBtn = null;

        for (let k = 0; k < 3; k++) {
            if (!targetElement) break;
            if (targetElement.classList && targetElement.classList.contains('mem_editBtn')) {
                editBtn = targetElement;
                break;
            }
            if (targetElement.classList && targetElement.classList.contains('mem_deleteBtn')) {
                deleteBtn = targetElement;
                break;
            }
            targetElement = targetElement.parentElement;
        }

        let listItem = null;
        if (editBtn || deleteBtn) {
            let pEl = (editBtn || deleteBtn).parentElement;
            while (pEl) {
                if (pEl.tagName === 'LI') {
                    listItem = pEl;
                    break;
                }
                pEl = pEl.parentElement;
            }
        }

        // ーーー 編集・保存ボタンが押された場合 ーーー
        if (editBtn && listItem) {
            const memberId = listItem.getAttribute('data-member-id');
            const listLeft = listItem.getElementsByClassName('mem_list_left')[0];
            const nameText = listLeft.getElementsByClassName('mem_name')[0];
            const nameInputContainer = listLeft.getElementsByClassName('mem_nameInput')[0];
            const inputField = nameInputContainer.getElementsByTagName('input')[0];
            const btnText = editBtn.getElementsByTagName('p')[0];

            const isEditMode = listItem.classList.contains('mem_editMode');

            if (isEditMode) {
                const oldName = nameText.innerText;
                const newName = inputField.value.trim();

                if (oldName !== newName && newName !== "") {
                    showLoader();
                    const success = await updateMemberPost(memberId, newName);

                    cachedMemberData = await fetchMembers();
                    const pulldown = document.getElementById('mem_pulldown');

                    if (cachedMemberData && pulldown) {
                        setMemberData(cachedMemberData, pulldown.value);
                    }
                    closeLoader();
                } else {
                    listItem.classList.remove('mem_editMode');
                    btnText.innerText = '編集';
                    nameText.classList.remove('mem_hidden');
                    nameInputContainer.classList.add('mem_hidden');
                    inputField.value = oldName;
                }
            } else {
                listItem.classList.add('mem_editMode');
                btnText.innerText = '保存';
                nameText.classList.add('mem_hidden');
                nameInputContainer.classList.remove('mem_hidden');

                inputField.focus();
                const textLength = inputField.value.length;
                inputField.setSelectionRange(textLength, textLength);
            }
        }

        // ーーー 行内の「削除」ボタンが押された場合 ーーー
        if (deleteBtn && listItem) {
            activeDeleteMemberId = listItem.getAttribute('data-member-id');
            const dialog = document.getElementById('mem_dialog');
            if (dialog) {
                const showModalBtns = dialog.getElementsByClassName('c_dialog02_showModal');
                if (showModalBtns.length > 0) {
                    showModalBtns[0].click();
                }
            }
        }
    });
}