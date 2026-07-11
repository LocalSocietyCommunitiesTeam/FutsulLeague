/** メンバー管理画面 **/

// 現在どのメンバーを削除しようとしているかを一時的に保持する変数
let activeDeleteMemberId = null;
// GASから取得した最新のメンバーデータを保持するグローバル（またはスコープ内）変数
let cachedMemberData = null;

// 読み込み完了時の処理
document.addEventListener('DOMContentLoaded', async function () {
    showLoader();
    
    try {
        // 1. メンバーデータの初回取得
        cachedMemberData = await fetchMembers();
        const pulldown = document.getElementById('mem_pulldown');
        
        if (cachedMemberData && pulldown) {
            // プルダウンの選択肢を設定
            setTeamData(cachedMemberData);
            
            // プルダウン変更時にメンバーリストを更新
            pulldown.addEventListener('change', function() {
                setMemberData(cachedMemberData, this.value);
            });
        }
    } catch (error) {
        console.error("初期化エラー:", error);
    } finally {
        closeLoader();
    }

    // ダイアログ内の共通クローズ処理を登録
    const closeDialog = function() {
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
        dialogDeleteBtn.addEventListener('click', async function() {
            if (!activeDeleteMemberId) return;

            showLoader();
            const success = await deleteMemberPost(activeDeleteMemberId);

            if (success) {
                // 💡 【変更】DOMを直接消すのではなく、GASから全量を再取得して画面を再描画
                cachedMemberData = await fetchMembers();
                const pulldown = document.getElementById('mem_pulldown');
                
                if (cachedMemberData && pulldown) {
                    setMemberData(cachedMemberData, pulldown.value);
                }
                
                closeDialog();
                activeDeleteMemberId = null; // 初期化
            }
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

        console.log("リクエスト送信:", url.toString());

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error("HTTPエラー! ステータス: " + response.status);
        }

        const result = await response.json();

        if (result.success) {
            console.log("メンバーデータ:", result.data);
            return result.data;
        }
        
        console.error("エラーが発生しました:", result.message);
        if (result.error) console.error("詳細:", result.error);
        return null;

    } catch (error) {
        console.error("通信エラー:", error);
        return null;
    }
    // 💡 `finally { closeLoader(); }` は呼び出し元（親）の処理フローとバッティングするため削除しました
}

// 〜〜 deleteMemberPost / updateMemberPost / setTeamData / setMemberData は既存のまま（省略） 〜〜

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
                // 【保存時の処理】
                const oldName = nameText.innerText;
                const newName = inputField.value.trim();

                if (oldName !== newName && newName !== "") {
                    showLoader();
                    const success = await updateMemberPost(memberId, newName);

                    if (success) {
                        // 💡 【変更】画面上の文字を書き換えるのではなく、GASから全量を再取得して画面を再描画
                        cachedMemberData = await fetchMembers();
                        const pulldown = document.getElementById('mem_pulldown');
                        
                        if (cachedMemberData && pulldown) {
                            setMemberData(cachedMemberData, pulldown.value);
                        }
                    } else {
                        // 失敗した場合は入力欄の値を元に戻し、編集モードを解除
                        inputField.value = oldName;
                        listItem.classList.remove('mem_editMode');
                        btnText.innerText = '編集';
                        nameText.classList.remove('mem_hidden');
                        nameInputContainer.classList.add('mem_hidden');
                    }
                    closeLoader();
                } else {
                    // 変更がない場合はそのまま編集モードを解除
                    listItem.classList.remove('mem_editMode');
                    btnText.innerText = '編集';
                    nameText.classList.remove('mem_hidden');
                    nameInputContainer.classList.add('mem_hidden');
                }
                
            } else {
                // 【編集モード開始時の処理】
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