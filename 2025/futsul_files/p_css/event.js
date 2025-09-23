/** コンポーネント **/
/* ダイアログ */
if (document.getElementsByClassName('c_dialog')) {
    // ダイアログが存在する場合
    // ダイアログを開く関数
    function showDialog(dialog) {
        dialog.show();
    }

    // ダイアログを閉じる関数
    function closeDialog(dialog) {
        dialog.close();
    }

    const dialog = document.getElementsByClassName('c_dialog');

    for (let i = 0; i < dialog.length; i++) {
        // ダイアログターゲット押下時の処理
        dialog[i].getElementsByClassName('c_dialog_target')[0].addEventListener('click', function () {
            if (dialog[i].getElementsByClassName('c_dialog_backGround')[0].open) {
                // bodyタグのスクロールを有効化
                document.body.classList.remove('c_bodyScroll');
                // ダイアログコンテンツを非表示
                closeDialog(dialog[i].getElementsByClassName('c_dialog_backGround')[0]);
            } else {
                // bodyタグのスクロールを無効化
                document.body.classList.add('c_bodyScroll');
                // ダイアログコンテンツを表示
                showDialog(dialog[i].getElementsByClassName('c_dialog_backGround')[0]);
            }
        });

        // ×ボタン押下時の処理
        dialog[i].getElementsByClassName('c_dialog_closeBtn')[0].addEventListener('click', function () {
            // bodyタグのスクロールを有効化
            document.body.classList.remove('c_bodyScroll');
            // ダイアログコンテンツを非表示
            closeDialog(dialog[i].getElementsByClassName('c_dialog_backGround')[0]);
        });

        // ×ボタンEnter時の処理
        dialog[i].getElementsByClassName('c_dialog_closeBtn')[0].firstElementChild.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                this.parentElement.click();
            }
        });

        // ダイアログ押下時の処理
        dialog[i].getElementsByClassName('c_dialog_backGround')[0].addEventListener('click', function () {
            if (dialog[i].getElementsByClassName('c_dialog_backGround')[0].open) {
                // bodyタグのスクロールを有効化
                document.body.classList.remove('c_bodyScroll');
                // ダイアログコンテンツを非表示
                closeDialog(dialog[i].getElementsByClassName('c_dialog_backGround')[0]);
            } else {
                // bodyタグのスクロールを無効化
                document.body.classList.add('c_bodyScroll');
                // ダイアログコンテンツを表示
                showDialog(dialog[i].getElementsByClassName('c_dialog_backGround')[0]);
            }
        });

        // コンテンツのクリックイベントを防止
        dialog[i].getElementsByClassName('c_dialog_contents')[0].addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }
}