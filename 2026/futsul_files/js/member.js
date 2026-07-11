/** メンバー管理画面 **/

// 現在どのメンバーを削除しようとしているかを一時的に保持する変数
var activeDeleteMemberId = null;

// 読み込み完了時の処理
document.addEventListener('DOMContentLoaded', async function () {
    showLoader();
    
    try {
        // メンバーデータの取得（引数で特定の大会IDを指定可能）
        var memberData = await fetchMembers();
        var pulldown = document.getElementById('mem_pulldown');
        
        if (memberData) {
            // プルダウンの選択肢を設定
            setTeamData(memberData);
            
            // プルダウン変更時にメンバーリストを更新
            pulldown.addEventListener('change', function() {
                setMemberData(memberData, this.value);
            });
        }
    } catch (error) {
        console.error("初期化エラー:", error);
    }

    // ダイアログ内の共通クローズ処理を登録
    var closeDialog = function() {
        var dialog = document.getElementById('mem_dialog');
        if (dialog) {
            var closeButtons = dialog.getElementsByClassName('c_dialog02_CloseBtn');
            if (closeButtons.length > 0) {
                closeButtons[0].click();
            }
        }
    };

    // ダイアログ内のキャンセルボタン処理
    var cancelBtn = document.getElementById('mem_cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeDialog);
    }

    // ダイアログ内の削除実行ボタン処理（POST通信を行い、成功したらDOMを消す）
    var dialogDeleteBtn = document.getElementById('mem_deleteBtn');
    if (dialogDeleteBtn) {
        dialogDeleteBtn.addEventListener('click', async function() {
            if (!activeDeleteMemberId) return;

            showLoader();
            var success = await deleteMemberPost(activeDeleteMemberId);
            closeLoader();

            if (success) {
                // 画面上から対象のメンバー要素を削除
                var targetLi = document.getElementById('member_row_' + activeDeleteMemberId);
                if (targetLi) {
                    targetLi.remove();
                }
                closeDialog();
                activeDeleteMemberId = null; // 初期化
            }
        });
    }

    // リスト内のイベント（編集・保存・ダイアログ表示）は親要素で一括管理（イベント委譲）
    initMemberListEvents();
});

/**
 * GASのWebアプリからメンバーデータを取得する（GET）
 * @param {string} [tournamentId] - 大会ID（指定がなければ全量取得）
 * @returns {Promise<Array|null>} メンバーデータの配列
 */
async function fetchMembers(tournamentId) {
    try {
        var url = new URL(GAS_WEB_APP_URL);
        url.searchParams.append("action", "getMembers");

        if (tournamentId) {
            url.searchParams.append("tournamentId", tournamentId);
        }

        console.log("リクエスト送信:", url.toString());

        var response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error("HTTPエラー! ステータス: " + response.status);
        }

        var result = await response.json();

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
    } finally {
        closeLoader();
    }
}

/**
 * メンバーの削除リクエストを送信する（POST）
 * @param {string} memberId - 削除対象のメンバーID
 * @returns {Promise<boolean>} 成功したかどうか
 */
async function deleteMemberPost(memberId) {
    try {
        var response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: new URLSearchParams({
                action: 'deleteMember',
                memberId: memberId
            })
        });

        if (!response.ok) throw new Error("削除リクエストに失敗しました");

        var result = await response.json();
        if (result.success) {
            console.log("削除成功:", memberId);
            return true;
        } else {
            alert("削除に失敗しました: " + result.message);
            return false;
        }
    } catch (error) {
        console.error("削除通信エラー:", error);
        alert("通信エラーが発生しました");
        return false;
    }
}

/**
 * メンバー名の編集リクエストを送信する（POST）
 * @param {string} memberId - 編集対象のメンバーID
 * @param {string} newName - 新しいメンバー名
 * @returns {Promise<boolean>} 成功したかどうか
 */
async function updateMemberPost(memberId, newName) {
    try {
        var response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: new URLSearchParams({
                action: 'updateMember',
                memberId: memberId,
                memberName: newName
            })
        });

        if (!response.ok) throw new Error("更新リクエストに失敗しました");

        var result = await response.json();
        if (result.success) {
            console.log("更新成功:", memberId, newName);
            return true;
        } else {
            alert("更新に失敗しました: " + result.message);
            return false;
        }
    } catch (error) {
        console.error("更新通信エラー:", error);
        alert("通信エラーが発生しました");
        return false;
    }
}

/**
 * チームプルダウンの選択肢（option）を生成・追加する
 * @param {Array} data - チーム情報の配列
 */
function setTeamData(data) {
    var pulldown = document.getElementById('mem_pulldown');
    if (!pulldown) return;

    var optionsHtml = '<option value="">チームを選択してください</option>';
    for (var i = 0; i < data.length; i++) {
        optionsHtml += '<option value="' + data[i].teamId + '">' + data[i].teamNameAbbreviation + '</option>';
    }
    pulldown.innerHTML = optionsHtml;
}

/**
 * 選択されたチームに応じたメンバーリストを表示する
 * @param {Array} data - チームとメンバーのデータ全体
 * @param {string} selectedTeamId - 選択されたチームID
 */
function setMemberData(data, selectedTeamId) {
    var memberlist = document.getElementById('mem_list');
    if (!memberlist) return;

    var listHtml = '';

    for (var i = 0; i < data.length; i++) {
        var team = data[i];
        if (team.teamId === selectedTeamId) {
            for (var j = 0; j < team.member.length; j++) {
                var member = team.member[j];
                // 各行のliタグにIDとデータ属性としてmemberIdを付与
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
            break;
        }
    }

    memberlist.innerHTML = listHtml;
}

/**
 * メンバーリスト内のボタン操作（編集・保存・削除）を監視・制御する（イベント委譲）
 */
function initMemberListEvents() {
    var memberlist = document.getElementById('mem_list');
    if (!memberlist) return;

    memberlist.addEventListener('click', async function (e) {
        // クリックされたターゲット要素の親を遡り、対象のボタン（aタグ）を探す
        var targetElement = e.target;
        var editBtn = null;
        var deleteBtn = null;

        // aタグに到達するまでループ（最大3階層上まで探索）
        for (var k = 0; k < 3; k++) {
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

        // ーーー 編集・保存ボタンが押された場合 ーーー
        if (editBtn) {
            var listItem = editBtn.parentElement.parentElement;
            var memberId = listItem.getAttribute('data-member-id');
            
            var listLeft = listItem.getElementsByClassName('mem_list_left')[0];
            var nameText = listLeft.getElementsByClassName('mem_name')[0];
            var nameInputContainer = listLeft.getElementsByClassName('mem_nameInput')[0];
            var inputField = nameInputContainer.getElementsByTagName('input')[0];
            var btnText = editBtn.getElementsByTagName('p')[0];

            var isEditMode = listItem.classList.contains('mem_editMode');

            if (isEditMode) {
                // 【保存時の処理】
                var oldName = nameText.innerText;
                var newName = inputField.value.trim();

                // 以前の名前から変更がある場合のみPOST通信を実行
                if (oldName !== newName && newName !== "") {
                    showLoader();
                    var success = await updateMemberPost(memberId, newName);
                    closeLoader();

                    if (success) {
                        nameText.innerText = newName; // 画面上の名前を変更
                    } else {
                        // 失敗した場合は入力欄の値を元に戻す
                        inputField.value = oldName;
                    }
                }

                // 編集モードの解除と見た目のリセット
                listItem.classList.remove('mem_editMode');
                btnText.innerText = '編集';
                nameText.classList.remove('mem_hidden');
                nameInputContainer.classList.add('mem_hidden');
                
            } else {
                // 【編集モード開始時の処理】
                listItem.classList.add('mem_editMode');
                btnText.innerText = '保存';
                nameText.classList.add('mem_hidden');
                nameInputContainer.classList.remove('mem_hidden');
                
                // テキストの末尾にカーソルを合わせてフォーカス
                inputField.focus();
                var textLength = inputField.value.length;
                inputField.setSelectionRange(textLength, textLength);
            }
        }

        // ーーー 行内の「削除」ボタンが押された場合 ーーー
        if (deleteBtn) {
            var listItem = deleteBtn.parentElement.parentElement;
            // どのメンバーIdを削除しようとしているかをグローバルに記録
            activeDeleteMemberId = listItem.getAttribute('data-member-id');

            // 削除確認ダイアログを表示
            var dialog = document.getElementById('mem_dialog');
            if (dialog) {
                var showModalBtns = dialog.getElementsByClassName('c_dialog02_showModal');
                if (showModalBtns.length > 0) {
                    showModalBtns[0].click();
                }
            }
        }
    });
}
