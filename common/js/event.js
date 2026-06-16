/* ===== システムパーツ集（マイスター） JS 2_61  ====== */
// ダイアログ系共通
// bodyScroll設定
function setBodyScroll() {

    // クリックした要素のフォーカスを外す
    if (c_isbrowserIE()) {
        document.body.focus();
    } else {
        document.activeElement.blur();
    }

    // bodyタグにスクロール制御クラスが設定されている場合、先になんらかのダイアログが表示しているものとみなす
    if (document.body.classList.contains("c_bodyScroll")) {
        document.body.classList.add("c_bodyScroll_sec");
    } else {
        let rootfont = document.documentElement.style.fontSize.replace('px', '');
        if (rootfont == '') {
            rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
        }
        // 表示位置の指定用
        document.body.style.top = '-' + window.pageYOffset / rootfont + 'rem';
        document.body.classList.add("c_bodyScroll");
    };
}

// bodyScroll解除
function clearBodyScroll() {

    // カウンタ変数
    let cnt = 0;
    // isShowのクラスを配列として保持
    const isShow = [
        'c_modal01_isShow',
        'c_dialog02_isShow',
        'c_cfmDialog_isShow',
        'c_loading01_isShow',
        'c_loading02_isShow',
    ];

    // isShowクラスを持つ要素の数をカウント
    for (let i = 0; isShow.length > i; i++) {
        cnt = cnt + document.getElementsByClassName(isShow[i]).length;
        if (cnt > 0) {
            break;
        }
    }

    // c_bodyScroll_secがあったら既に別のダイアログが表示中のため、bodyscrollは削除しない
    if (document.body.classList.contains("c_bodyScroll_sec")) {
        document.body.classList.remove("c_bodyScroll_sec");
        // isShowクラスを持つ要素がない かつ bodyタグにc_bodyScrollが残っていた場合は対象クラスを削除
        if (cnt == 0 && document.body.classList.contains("c_bodyScroll")) {
            document.body.classList.remove('c_bodyScroll');
            c_scrollMove();
        }
    } else {
        // 背景固定解除
        document.body.classList.remove('c_bodyScroll');
        c_scrollMove();
    }
}

// スクロールの位置を戻す
function c_scrollMove() {
    let scrollMove = document.body.style.getPropertyValue('top');
    if (scrollMove != '') {
        let rootfont = document.documentElement.style.fontSize.replace('px', '');
        if (rootfont == '') {
            rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
        }
        scrollMove = scrollMove.replace('-', '');
        scrollMove = scrollMove.replace('rem', '') * rootfont;
        document.body.style.removeProperty('top');
        // スクロール位置を戻す
        window.scrollTo(0, scrollMove);
    }
}

/* IE判定 */
function c_isbrowserIE() {
    // IE固有の機能を持っている場合trueを返却
    if (document.documentMode && document.uniqueID) {
        return true;
    } else {
        return false;
    }
}

/** コンポーネント：Accordion **/
if (!document.getElementsByClassName('c_acc').length) {
    // 該当の要素がない場合は処理を行わない
} else {
    /* コンテンツ部分の高さ設定（外部呼び出し用） */
    // 引数：target：該当のアコーディオン親要素（c_accクラスのあるタグ）
    function c_acc_setHeight(target) {
        let rootfont = document.documentElement.style.fontSize.replace('px', '');
        if (rootfont == '') {
            rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
        }
        // HTML要素内には該当クラス名を持つ要素は1つのみのため配列0番目を指定
        const contentsHeight = target.getElementsByClassName('c_acc_invis')[0];
        // アコーディオンを閉じるクラスを持っているかで判定
        if (target.getElementsByClassName('c_acc_isClose').length) {
            contentsHeight.setAttribute('style', 'max-height:0rem');
        } else {
            // 内容部分の高さを中身分の高さに設定
            contentsHeight.setAttribute('style', 'max-height:' + ((contentsHeight.firstElementChild.offsetHeight / rootfont) + 1) + 'rem')
        }
    }
    /* 初期の開閉状態を設定 */
    // 引数
    // target c_accクラスを持つ要素
    function setLoadedAccordion(target) {
        // 見出し部分のコレクションを取得
        const accVis = document.getElementsByClassName('c_acc_vis');
        // コンテンツ部分の高さ設定前のbodyの高さ
        const beforeBody = document.body.offsetHeight;

        // コンテンツ部分の高さ設定
        for (let i = 0; i < accVis.length; i++) {
            setAccordinnHeight(accVis[i]);
        }

        // コンテンツ部分の高さ設定後のbodyの高さ
        const afterBody = document.body.offsetHeight;
        let clHeight;
        // IEとそれ以外で設定値を変える
        if (c_isbrowserIE()) {
            clHeight = document.documentElement.clientHeight;
        } else {
            clHeight = window.innerHeight;
        }
        // ウィンドウの高さと比較
        if ((beforeBody > clHeight) && (afterBody < clHeight)) {
            // スクロールバーを表示
            const body = document.body;
            body.classList.add('c_acc_scrollBar');
        }

        // 最後にアコーディオンを表示する
        target.style.visibility = 'visible';
    }

    /* 現在の開閉状態を設定 */
    function clickAcordion(target) {
        // フラグの判定
        if (target.parentElement.classList.contains('c_acc_isClose')) {
            target.parentElement.classList.remove('c_acc_isClose');
        } else {
            target.parentElement.classList.add('c_acc_isClose');
        }
        setAccordinnHeight(target);
    }

    /* コンテンツ部分の高さ設定 */
    function setAccordinnHeight(accContent) {
        let rootfont = document.documentElement.style.fontSize.replace('px', '');
        if (rootfont == '') {
            rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
        }

        if (accContent.parentElement.classList.contains('c_acc_isClose')) {
            accContent.nextElementSibling.setAttribute('style', 'max-height:0rem');
        } else {
            // 内容部分の高さを中身分の高さに設定
            // コンテンツに対して余裕を持たせるために少し大きい値を設定
            accContent.nextElementSibling.setAttribute('style', 'max-height:' + ((accContent.nextElementSibling.firstElementChild.offsetHeight / rootfont) + 1) + 'rem')
        }
    }

    // accordionの取得
    const acc = document.getElementsByClassName('c_acc');
    // ページ読み込み時にイベント登録
    for (let i = 0; acc.length > i; i++) {

        // IE用に値を保持
        const num = i;
        // datasetの取得
        const initData = acc[num].dataset.show;

        // dataset定義の有無で登録するイベントを選択
        if (initData) {
            window.addEventListener('DOMContentLoaded', function () {
                c_acc_init(acc[num])
            });
        } else {
            window.addEventListener('load', function () {
                c_acc_init(acc[num])
            });
        }
    }

    // アコーディオン初期設定用関数
    // 引数
    // target c_accクラスを持つ要素
    function c_acc_init(target) {
        setLoadedAccordion(target);
        c_acc_setHidden(target.getElementsByClassName('c_acc_vis')[0]);
    }

    // 画面リサイズ時にイベント登録
    window.addEventListener('resize', function () {
        // 見出し部分のコレクションを取得
        const accVis = document.getElementsByClassName('c_acc_vis');
        for (let i = 0; i < accVis.length; i++) {
            setAccordinnHeight(accVis[i]);
        }
    });

    // 見出し部分のコレクションを取得
    const accVis = document.getElementsByClassName('c_acc_vis');
    // アコーディオンにイベント登録
    for (let i = 0; i < accVis.length; i++) {
        accVis[i].addEventListener('click', function () {
            clickAcordion(this);
            c_acc_setHidden(this);
        }); // クリック時に見出し部分と内容部分の高さを設定、アイコン部分のクラスを入れ替え
    }

    function c_acc_setHidden(target) {
        if (target.parentElement.classList.contains('c_acc_isClose')) {
            setTimeout(function () {
                if (target.parentElement.classList.contains('c_acc_isClose')) {
                    target.nextElementSibling.style.visibility = 'hidden';
                }
            }, 400);
        } else {
            target.nextElementSibling.style.visibility = 'visible';
        }
    }
}

/** コンポーネント：Accordion ReadMore **/
if (!document.getElementsByClassName('c_acc02').length) {
    // 該当の要素がない場合は処理を行わない
} else {
    /* 高さ計算 */
    function c_acc02_setHeight(target) {
        const initArea = target.getElementsByClassName('c_acc02_initView')[0];
        const setHeihgt = target.getElementsByClassName('c_acc02_wrapper')[0];
        const moreArea = target.getElementsByClassName('c_acc02_MoreView');
        // 表示エリア分高さを計算する
        let moreAreaHeight = 0;
        for (let i = 0; i < moreArea.length; i++) {
            if (moreArea[i].classList.contains('c_acc02_isView')) {
                // 表示対象のクラスを持っていた場合はインライン属性のheightを削除
                // 初期値でheight値に0pxを設定するため削除する処理をいれておく
                moreArea[i].style.removeProperty('height');
                moreAreaHeight = moreAreaHeight + moreArea[i].getBoundingClientRect().height;
            }
        }
        let rootfont = document.documentElement.style.fontSize.replace('px', '');
        if (rootfont == '') {
            rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
        }
        // 表示エリアの高さを設定
        setHeihgt.style.height = (initArea.getBoundingClientRect().height + moreAreaHeight) / rootfont + 'rem';
    }

    /* コンテンツエリアの表示 */
    // 引数：target：該当のアコーディオン親要素（c_accクラスのあるタグ）
    function c_acc02_isOpen(target) {
        const moreArea = target.getElementsByClassName('c_acc02_MoreView');
        // コンテンツの総数を取得
        const allContents = target.getElementsByClassName('c_acc02_contentArea').length;
        // 表示しているエリアの値（初期表示を最初に設定）
        let dispContents = target.getElementsByClassName('c_acc02_initView')[0].getElementsByClassName('c_acc02_contentArea').length;

        for (let i = 0; i < moreArea.length; i++) {
            if (!moreArea[i].classList.contains('c_acc02_isView')) {
                moreArea[i].classList.add('c_acc02_isView');
                if (target.getElementsByClassName('c_acc02_readMoreArea')[0].classList.contains('c_acc02_readMoreNumber')) {
                    if (i + 1 < moreArea.length) {
                        dispContents = dispContents + moreArea[i].getElementsByClassName('c_acc02_contentArea').length;
                        number = allContents - dispContents;
                        c_acc02_setNumber(target, number);
                    }
                }
                break;
            } else {
                dispContents = dispContents + moreArea[i].getElementsByClassName('c_acc02_contentArea').length;
            }
        }
        c_acc02_setHeight(target);

        // 押下エリアの表示内容切替
        // 表示対象となるエリアが全て表示されているか判定し、全て表示されていたらクリックエリアの内容を切り替える
        if (target.getElementsByClassName('c_acc02_MoreView').length == target.getElementsByClassName('c_acc02_isView').length) {
            target.getElementsByClassName('c_acc02_readMore')[0].classList.add('c_acc02_hidden');
            if (!target.getElementsByClassName('c_acc02_close').length) {
                //該当クラスを持たない場合は処理を行なわない
            } else {
                target.getElementsByClassName('c_acc02_close')[0].classList.remove('c_acc02_hidden');
            }

        }

    }
    /* コンテンツエリアの指定した初期表示対象以外を非表示 */
    // 引数：target：該当のアコーディオン親要素（c_accクラスのあるタグ）
    function c_acc02_isClose(target) {
        const moreArea = target.getElementsByClassName('c_acc02_MoreView');
        // すべての表示エリアを見えないようにする
        for (let i = 0; i < moreArea.length; i++) {
            moreArea[i].classList.remove('c_acc02_isView');
        }

        c_acc02_setHeight(target);

        // もっと見るの件数表示する場合は最初のエリアの件数に直す
        if (target.getElementsByClassName('c_acc02_readMoreArea')[0].classList.contains('c_acc02_readMoreNumber')) {
            c_acc02_setNumber(target);
        }

        target.getElementsByClassName('c_acc02_readMore')[0].classList.remove('c_acc02_hidden');
        if (!target.getElementsByClassName('c_acc02_close').length) {
            //該当クラスを持たない場合は処理を行なわない
        } else {
            target.getElementsByClassName('c_acc02_close')[0].classList.add('c_acc02_hidden');
        }
    }

    window.addEventListener('load', function () {
        const targetArea = document.getElementsByClassName('c_acc02');
        for (let i = 0; i < targetArea.length; i++) {
            // もっと見るの件数表示する場合は最初のエリアの件数に直す
            if (targetArea[i].getElementsByClassName('c_acc02_readMoreArea')[0].classList.contains('c_acc02_readMoreNumber')) {
                c_acc02_setNumber(targetArea[i]);
            }
            if (!targetArea[i].getElementsByClassName('c_acc02_MoreView').length) {
                targetArea[i].getElementsByClassName('c_acc02_readMore')[0].classList.add('c_acc02_hidden');
            }
        }
    })

    window.addEventListener('resize', function () {
        const targetArea = document.getElementsByClassName('c_acc02');
        for (let i = 0; i < targetArea.length; i++) {
            c_acc02_setHeight(targetArea[i]);
        }
    })

    const acc02Content = document.getElementsByClassName('c_acc02_readMoreArea');
    for (let i = 0; i < acc02Content.length; i++) {
        const acc02Open = acc02Content[i].getElementsByClassName('c_acc02_readMore')[0];
        // イベントリスナー登録
        acc02Open.addEventListener('click', function () {
            // 高さを設定する
            const targetArea = document.getElementsByClassName('c_acc02');
            for (let i = 0; i < targetArea.length; i++) {
                c_acc02_setHeight(targetArea[i]);
            }
            c_acc02_isOpen(this.parentElement.parentElement);
            const accMoreView = acc02Open.parentElement.parentElement.getElementsByClassName('c_acc02_MoreView');
            for (let i = 0; accMoreView.length > i; i++) {
                if (accMoreView[i].classList.contains('c_acc02_isView')) {
                    accMoreView[i].style.visibility = 'visible';
                }
            }
        });

        // クリック時に非表示エリアのクラスを削除し押下したエリアを非表示にする
        if (!acc02Content[i].getElementsByClassName('c_acc02_close').length) {
            // クラスを持たない場合は処理を行なわない
        } else {
            const acc02Close = acc02Content[i].getElementsByClassName('c_acc02_close')[0];
            acc02Close.addEventListener('click', function () {
                c_acc02_isClose(this.parentElement.parentElement);
                setTimeout(function () {
                    const accMoreView = acc02Close.parentElement.parentElement.getElementsByClassName('c_acc02_MoreView');
                    for (let i = 0; accMoreView.length > i; i++) {
                        if (!accMoreView[i].classList.contains('c_acc02_isView')) {
                            accMoreView[i].style.visibility = 'hidden';
                        }
                    }
                }, 400);
            }); // クリック時に初期表示で隠していたエリアを再度非表示化する
        }
    }
    // もっと見るの件数を設定
    // 引数：target：該当のアコーディオン親要素（c_acc02クラスのあるタグ）
    // 引数：number：件数に設定する値（未設定の場合は初期値が入る）
    function c_acc02_setNumber(target, number) {
        let num
        if (number) {
            num = number;
        } else {
            num = target.getElementsByClassName('c_acc02_contentArea').length - target.getElementsByClassName('c_acc02_initView')[0].getElementsByClassName('c_acc02_contentArea').length;
        }
        target.getElementsByClassName('c_acc02_readMore')[0].children[1].innerHTML = '（' + num + '件）';
    }
}

/** コンポーネント：Dialog **/
// フォントサイズ取り込み
if (!document.getElementsByClassName('c_modal01').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    // ダイアログ表示処理
    function showModalDialog01(targetDialogArea) {
        targetDialogArea.getElementsByClassName('c_modal01_textArea')[0].scrollTop = 0;
        // ダイアログウィンドウ表示
        targetDialogArea.classList.add('c_modal01_isShow');
        // 背景固定
        setBodyScroll();
        // 高さ設定
        setMaxHeightModal01(targetDialogArea);
    }

    // ダイアログ非表示処理
    function closeModalDialog01(targetDialogArea) {
        // ダイアログウィンドウ非表示
        targetDialogArea.classList.remove('c_modal01_isShow');
        // スクロール位置を戻すための処理
        clearBodyScroll();
    }

    // ダイアログ表示時用 高さ設定処理
    function setMaxHeightModal01(targetDialogArea) {

        let rootfont = document.documentElement.style.fontSize.replace('px', '');
        if (rootfont == '') {
            rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
        }

        const modalMaxHeight = 56;
        targetArea = targetDialogArea.getElementsByClassName('c_modal01_textArea')[0];
        let dialogHeight;
        // IEかどうかで取得元を変える
        if (c_isbrowserIE()) {
            dialogHeight = document.documentElement.clientHeight;
        } else {
            dialogHeight = window.innerHeight;
        }
        // iOSではheightがvhの場合、アドレスバーが表示エリアに含まれないためこちらでheightを指定
        targetDialogArea.style.height = dialogHeight / rootfont + 'rem';
        // textAreaも上記同様の理由でmax-heightを指定
        // 本来は6.4remだがスクロールバーの表示調整でCSS側の「dialog_inner」の上下paddingが6.2remのため計算値もあわせる
        targetArea.style.maxHeight = ((dialogHeight / rootfont * 0.9) - 6.2) + 'rem';
        // ダイアログのダイアログボックスの高さは最大56rem
        // ただし、ウィンドウの高さの90%が上記の高さより小さい場合は、
        // ウィンドウの90%をダイアログボックスの高さとする
        if (dialogHeight / rootfont * 0.9 < modalMaxHeight) {
            // 90%未満のときは指定したmax-heightを使用
        } else {
            // CSSで指定したmax-heightとするため削除
            targetArea.style.removeProperty('max-height');
        }
    }

    // ページ表示時に各種イベント登録
    window.addEventListener('DOMContentLoaded', function () {
        // ダイアログウィンドウの表示制御
        const showModal = document.getElementsByClassName('c_modal01_showModal');
        for (let i = 0; i < showModal.length; i++) {
            showModal[i].addEventListener('click', function () {
                showModalDialog01(this.nextElementSibling);
            });
        }

        // ダイアログウィンドウの非表示制御（×ボタン押下時）
        const closeBtn = document.getElementsByClassName('c_modal01_CloseBtn');
        for (let i = 0; i < closeBtn.length; i++) {
            closeBtn[i].addEventListener('click', function (e) {
                e.stopPropagation();
                closeModalDialog01(this.parentElement.parentElement);
            });
        }

        // ダイアログウィンドウの非表示制御（背景押下時）
        const closeModal = document.getElementsByClassName('c_modal01_modal');
        for (let i = 0; i < closeModal.length; i++) {
            closeModal[i].addEventListener('click', function (e) {
                e.stopPropagation();
                // IEの場合、×ボタン押下時にdiv要素全体の押下イベントも実行されてしまうため×ボタン押下か否かを判定
                if (undefined != e.target.classList) {
                    // 押下箇所が背景の場合 かつ 非活性制御がない場合はダイアログを閉じる
                    if (e.target.classList.contains('c_modal01_modal') && !(e.target.classList.contains('c_modal01_modal_disable'))) {
                        closeModalDialog01(this);
                    }
                }
            });
        }

        // リサイズ時 高さ再設定
        window.addEventListener('resize', function () {

            const isShow = document.getElementsByClassName('c_modal01_isShow').length

            if (isShow) {
                for (let i = 0; isShow > i; i++) {
                    setMaxHeightModal01(document.getElementsByClassName('c_modal01_isShow')[i]);
                }
            }
        });
    });
}

/** コンポーネント：Dialog02（ボタンエリア付ダイアログ） **/
// ボタンエリア付きダイアログ処理
if (!document.getElementsByClassName('c_dialog02').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    // ダイアログ表示処理
    function showModalDialog02(targetDialogArea) {
        targetDialogArea.getElementsByClassName('c_dialog02_textArea')[0].scrollTop = 0;
        // 高さ設定
        setMaxHeightDialog02(targetDialogArea);
        // ダイアログウィンドウ表示
        targetDialogArea.classList.add('c_dialog02_isShow');
        // 背景固定
        setBodyScroll();
    }

    // ダイアログ非表示処理
    function closeModalDialog02(targetDialogArea) {
        targetDialogArea.classList.remove('c_dialog02_isShow');
        clearBodyScroll();
    }

    // ダイアログ表示時用 高さ設定処理
    function setMaxHeightDialog02(targetDialogArea) {

        let rootfont = document.documentElement.style.fontSize.replace('px', '');
        if (rootfont == '') {
            rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
        }

        const targetArea = targetDialogArea.getElementsByClassName('c_dialog02_textArea')[0];
        // 高さの再判定を実施するため削除
        targetArea.style.removeProperty('max-height');

        const targetHeight = targetArea.getBoundingClientRect().height / rootfont;
        const buttonArea = targetDialogArea.getElementsByClassName('c_dialog02_buttonArea')[0];
        const buttonAreaHeight = buttonArea.getBoundingClientRect().height / rootfont;
        const textArea = targetDialogArea.getElementsByClassName('c_dialog02_textArea')[0];
        let dialogHeight;
        // IEかどうかで取得元を変える
        if (c_isbrowserIE()) {
            dialogHeight = document.documentElement.clientHeight;
        } else {
            dialogHeight = window.innerHeight;
        }
        // iOSではheightがvhの場合、アドレスバーが表示エリアに含まれないためこちらでheightを指定
        targetDialogArea.style.height = dialogHeight / rootfont + 'rem';
        // textAreaも上記同様の理由でmax-heightを指定
        // ただし、ウィンドウの高さの90%が上記の高さより小さい場合は、
        // ウィンドウの90%をダイアログボックスの高さとする（上下padding、ボタン領域分を考慮）
        if ((dialogHeight / rootfont * 0.9) < (targetHeight + buttonAreaHeight + 3.2)) {
            targetArea.style.maxHeight = ((dialogHeight / rootfont * 0.9) - 3.2 - buttonAreaHeight) + 'rem';
        }

        // スクロールが出ているか否かによる表示切替
        // Edge(IE)ではサイズによってscrollHeightが1px大きくなることがあるため調整のため+1pxして判定を実施
        if (targetArea.scrollHeight > (targetArea.clientHeight + 1)) {
            // ボタンエリアに影をつける
            buttonArea.classList.add("c_dialog02_buttonArea_shadow");
            targetArea.classList.add("c_dialog02_scrollBottom");
            targetArea.style.removeProperty('overflow-y');
        } else {
            buttonArea.classList.remove("c_dialog02_buttonArea_shadow");
            targetArea.classList.remove("c_dialog02_scrollBottom");
            targetArea.style.overflowY = 'hidden';
        }
    }

    // ページ表示時に各種イベント登録
    window.addEventListener('DOMContentLoaded', function () {
        // ダイアログウィンドウの表示制御
        const showModal = document.getElementsByClassName('c_dialog02_showModal');
        for (let i = 0; i < showModal.length; i++) {
            showModal[i].addEventListener('click', function () {
                showModalDialog02(this.nextElementSibling);
            });
        }

        // ダイアログウィンドウの非表示制御（×ボタン押下時）
        const closeBtn = document.getElementsByClassName('c_dialog02_CloseBtn');
        for (let i = 0; i < closeBtn.length; i++) {
            closeBtn[i].addEventListener('click', function (e) {
                e.stopPropagation();
                closeModalDialog02(this.parentElement.parentElement);
            });
        }

        // ダイアログウィンドウの非表示制御（背景押下時）
        const closeModal = document.getElementsByClassName('c_dialog02_modal');
        for (let i = 0; i < closeModal.length; i++) {
            closeModal[i].addEventListener('click', function (e) {
                e.stopPropagation();
                // IEの場合、×ボタン押下時にdiv要素全体の押下イベントも実行されてしまうため×ボタン押下か否かを判定
                if (undefined != e.target.classList) {
                    // 押下箇所が背景の場合 かつ 非活性制御がない場合はダイアログを閉じる
                    if (e.target.classList.contains('c_dialog02_modal') && !(e.target.classList.contains('c_dialog02_modal_disable'))) {
                        closeModalDialog02(this);
                    }
                }
            });
        }

        // リサイズ時 高さ再設定
        window.addEventListener('resize', function () {

            const isShow = document.getElementsByClassName('c_dialog02_isShow').length

            if (isShow) {
                for (let i = 0; isShow > i; i++) {
                    setMaxHeightDialog02(document.getElementsByClassName('c_dialog02_isShow')[i]);
                }
            }
        });
    });
}

/** コンポーネント：Dialog03（確認ダイアログ） **/
if (!document.getElementsByClassName('c_cfmDialog').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    // 確認ダイアログ表示処理
    function showCfmDialog(text, dialogSetting, buttonLeft, buttonRight) {
        const dlg = document.getElementsByClassName("c_cfmDialog")[0];
        // テキスト設定
        dlg.getElementsByClassName("c_cfmDialog_text")[0].innerText = text;
        // ダイアログ設定
        // ×ボタン表示有無
        if (dialogSetting.isVisibleCloseBtn) {
            dlg.classList.remove("c_cfmDialog_hidden_closeBtn");
        } else {
            dlg.classList.add("c_cfmDialog_hidden_closeBtn");
        }
        // 背景押下可否
        const bkScreen = dlg.getElementsByClassName('c_cfmDialog_modal')[0];
        bkScreen.getElementsByClassName('c_cfmDialog_textArea')[0].scrollTop = 0;
        if (dialogSetting.isClickableBackScreen) {
            bkScreen.classList.remove("c_cfmDialog_modal_disable");
        } else {
            bkScreen.classList.add("c_cfmDialog_modal_disable");
        }

        // ボタン領域設定
        // 左ボタン設定
        setBtnSetting(dlg.getElementsByClassName("c_cfmDialog_btnLeft")[0], buttonLeft);
        // 右ボタン設定
        setBtnSetting(dlg.getElementsByClassName("c_cfmDialog_btnRight")[0], buttonRight);

        // 背景固定
        setBodyScroll();
        // 高さ設定
        setMaxHeightCfmDialog(bkScreen);
        // 表示
        dlg.classList.add('c_cfmDialog_isShow');
    }

    // ダイアログ非表示処理
    function closeCfmDialog() {
        // ダイアログウィンドウ非表示
        document.getElementsByClassName("c_cfmDialog")[0].classList.remove('c_cfmDialog_isShow');
        // 背景固定解除
        clearBodyScroll();
    }

    // ダイアログ表示時用 高さ設定処理
    function setMaxHeightCfmDialog(targetDialogArea) {
        let rootfont = document.documentElement.style.fontSize.replace('px', '');
        if (rootfont == '') {
            rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
        }
        const buttonArea = targetDialogArea.getElementsByClassName('c_cfmDialog_buttonArea')[0];
        const buttonAreaHeight = buttonArea.offsetHeight / rootfont;

        const targetArea = targetDialogArea.getElementsByClassName('c_cfmDialog_textArea')[0];
        // max-heightの再判定を実施するため削除
        targetArea.style.removeProperty('max-height');
        const textAreaHeight = targetArea.offsetHeight / rootfont;
        let dialogHeight;
        // IEかどうかで取得元を変える
        if (c_isbrowserIE()) {
            dialogHeight = document.documentElement.clientHeight;
        } else {
            dialogHeight = window.innerHeight;
        }
        // iOSではheightがvhの場合、アドレスバーが表示エリアに含まれないためこちらでheightを指定
        targetDialogArea.style.height = dialogHeight / rootfont + 'rem';
        // textAreaも上記同様の理由でmax-heightを指定
        // ただし、ウィンドウの高さの90%が上記の高さより小さい場合は、
        // ウィンドウの90%をダイアログボックスの高さとする（上下padding、ボタン領域分を考慮）
        if ((dialogHeight / (rootfont * 0.9)) < (textAreaHeight + buttonAreaHeight + 3.2)) {
            targetArea.style.maxHeight = ((dialogHeight / rootfont * 0.9) - 3.2 - buttonAreaHeight) + 'rem';
        }

        // スクロールが出ているか否かによる表示切替
        // Edge(IE)ではサイズによってscrollHeightが1px大きくなることがあるため調整のため+1pxして判定を実施
        if (targetArea.scrollHeight > (targetArea.clientHeight + 1)) {
            // ボタンエリアに影をつける
            buttonArea.classList.add("c_cfmDialog_buttonArea_shadow");
            targetArea.classList.add("c_cfmDialog_scrollBottom");
            targetArea.style.removeProperty('overflow-y');
        } else {
            buttonArea.classList.remove("c_cfmDialog_buttonArea_shadow");
            targetArea.classList.remove("c_cfmDialog_scrollBottom");
            targetArea.style.overflowY = 'hidden';
        }
    }

    // ボタン設定処理
    function setBtnSetting(target, btnSetting) {
        let targetBtn = target.getElementsByClassName("c_button01")[0];

        // 対象のボタン表示有無
        if (btnSetting.isShow) {
            target.classList.remove("c_cfmDialog_btnDispNon");

            // ボタン設定
            targetBtn.setAttribute("id", btnSetting.id);
            targetBtn.setAttribute("name", btnSetting.name);

            const targetBtnText = targetBtn.getElementsByClassName("c_cfmDialog_btnText")[0];
            targetBtnText.innerText = btnSetting.text;

            // Primary/Secondary出し分け
            if (btnSetting.type == "Primary") {
                targetBtn.classList.add("c_button01_green");
                targetBtn.classList.remove("c_button01_white");
                targetBtnText.classList.add("c_typo_WHT");
                targetBtnText.classList.remove("c_typo_GRN10");
            } else {
                targetBtn.classList.add("c_button01_white");
                targetBtn.classList.remove("c_button01_green");
                targetBtnText.classList.add("c_typo_GRN10");
                targetBtnText.classList.remove("c_typo_WHT");
            }

            // disabled設定
            if (btnSetting.isDisabled) {
                targetBtn.classList.add("c_button01_disabled");
            } else {
                targetBtn.classList.remove("c_button01_disabled");
            }

            // callback関数の呼び出し設定
            targetBtn.onclick = btnSetting.callback;

        } else {
            target.classList.add("c_cfmDialog_btnDispNon");
        }
    }

    // ページ表示時に各種イベント登録
    window.addEventListener('DOMContentLoaded', function () {
        // ダイアログウィンドウの非表示制御（×ボタン押下時）
        const closeBtn = document.getElementsByClassName('c_cfmDialog_CloseBtn')[0];
        closeBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            closeCfmDialog();
        })

        // ダイアログウィンドウの非表示制御（背景押下時）
        const closeModal = document.getElementsByClassName('c_cfmDialog_modal')[0];
        closeModal.addEventListener('click', function (e) {
            e.stopPropagation();
            // IEの場合、×ボタン押下時にdiv要素全体の押下イベントも実行されてしまうため×ボタン押下か否かを判定
            if (undefined != e.target.classList) {
                // 押下箇所が背景の場合 かつ 非活性制御がない場合はダイアログを閉じる
                if (e.target.classList.contains('c_cfmDialog_modal') && !(e.target.classList.contains('c_cfmDialog_modal_disable'))) {
                    closeCfmDialog();
                }
            }
        })

        // リサイズ時 高さ再設定
        window.addEventListener('resize', function () {

            const isShow = document.getElementsByClassName('c_cfmDialog_isShow').length

            if (isShow) {
                for (let i = 0; isShow > i; i++) {
                    setMaxHeightCfmDialog(document.getElementsByClassName('c_cfmDialog_modal')[i]);
                }
            }
        });
    });
}

/** コンポーネント：Loader **/
// Loading01の参考用JS
//（使用する場合はコメントアウトは解除せずアプリ用のJSにコピーして使用すること）
if (!document.getElementsByClassName('c_loading01').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    // 旧ローダーのフラグを定義
    let newLoaderFlag = false;

    //リサイズ時に高さを再設定
    window.addEventListener('resize', function () {
        const showLoader = document.getElementsByClassName('c_loading01_isShow')[0];
        // ローダーが表示されていたら処理を実行
        if (showLoader) {
            let padding = c_loading01_setPadding(newLoaderFlag);
            const textArea = showLoader.getElementsByClassName('c_loading01_textArea')[0];
            const progressArea = showLoader.getElementsByClassName('c_loading01_progressArea')[0];
            const height = showLoader.getElementsByClassName('c_loading01_svg')[0].getBoundingClientRect().height;
            // 画像と上下テキストの間の余白を再定義
            c_loading01_setTextArea(height, textArea, progressArea, padding);
        }

        const loading = document.getElementById('c_loading01');
        c_loading01_Setheight(loading);
    });

    // Loader高さ設定処理
    function c_loading01_Setheight(loading) {
        let clHeight;
        // IEによって使用する
        if (c_isbrowserIE()) {
            clHeight = document.documentElement.clientHeight;
        } else {
            clHeight = window.innerHeight;
        }
        loading.style.height = clHeight + 'px';
    }

    // Loader表示用処理
    function showLoader(text, progress, imgSetFlag, imgHeight, imgWidth) {

        // 旧ローダーのフラグを保存
        newLoaderFlag = imgSetFlag;

        const loading = document.getElementById('c_loading01');

        // テキストが設定されていれば設定
        if (text != undefined && text.length > 0) {
            const textArea = loading.getElementsByClassName('c_loading01_textArea')[0];
            textArea.getElementsByClassName('c_typo_bodyM')[0].innerText = text;
            loading.classList.add('c_loading01_addText');
        } else {
            loading.classList.remove('c_loading01_addText');
        }

        // プログレスの数値が設定されていれば設定
        if (progress != undefined && +progress >= 0 && progress != '') {
            loading.getElementsByClassName('c_loading01_progressNum')[0].innerText = progress;
            loading.classList.add('c_loading01_addProgress');
        } else {
            loading.classList.remove('c_loading01_addProgress');
        }

        if (imgSetFlag) {
            c_loading01_setImgSize(imgHeight, imgWidth, imgSetFlag);
        } else {
            // 旧ローダー用設定　width:104px height 104px 
            c_loading01_setImgSize(104, 104, imgSetFlag);
        }

        // 背景固定(モーダルが表示されていない場合のみ実施)
        setBodyScroll();

        // 高さ設定(iphoneでの高さ指定を考慮しJavascriptで設定)
        c_loading01_Setheight(loading);
    }

    // 画像と上下テキストの間の余白を定義
    // 引数
    //imgSetFlag：ペンタンローダーフラグ
    function c_loading01_setPadding(imgSetFlag) {
        let padding = 1.6;
        if (imgSetFlag) {
            padding = 2.4;
        }
        return padding;
    }

    // 画像のサイズを設定しテキスト/プログレスエリアの配置場所を計算
    // 引数
    // imgHeight：任意で指定された画像の高さ
    // imgWidth：任意で指定された画像の横幅
    // imgSetFlag：ペンタンローダーフラグ
    function c_loading01_setImgSize(imgHeight, imgWidth, imgSetFlag) {
        // 画像の取得
        const img = document.getElementsByClassName('c_loading01_svg')[0];
        // テキストエリアの取得
        const textArea = document.getElementsByClassName('c_loading01_textArea')[0];
        // プログレスエリアの取得
        const progressArea = document.getElementsByClassName('c_loading01_progressArea')[0];

        let rootfont = document.documentElement.style.fontSize.replace('px', '');
        if (rootfont == '') {
            rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
        }

        // 画像からテキスト/プログレスエリアの間の余白
        let padding = c_loading01_setPadding(imgSetFlag);

        let height = imgHeight;
        let width = imgWidth;

        // heightの値がない場合は画像サイズを取得して値を設定
        if (height) {
            // 画像の高さを設定
            img.style.height = (height / rootfont) + 'rem';
            // 画像の高さが設定されていたら処理を実行
            c_loading01_setTextArea(height, textArea, progressArea, padding);
        } else {
            // heightの定義を初期化
            img.style.height = 'auto';
            // 0.1秒ごとにintervalを実行
            // 画像の高さを取得できたら停止
            const interval = setInterval(function () {
                // 画像の高さを取得
                height = img.clientHeight;
                // テキストエリアの配置を設定してintervalを停止
                if (height) {
                    c_loading01_setTextArea(height, textArea, progressArea, padding);
                    clearInterval(interval);
                }
            }, 100);
        }

        // widthの値がない場合は既存定義を初期化
        if (!width) {
            // widthの定義を初期化
            img.style.width = 'auto';
        }
        // 画像の横幅を設定
        img.style.width = (width / rootfont) + 'rem';
    }

    // テキストエリア/プログレスエリアの位置を設定
    // 引数
    // height：画像の高さ
    // textArea：テキスト
    // progressArea：プログレスエリア
    // padding：画像とテキスト/プログレスエリアの間の余白
    function c_loading01_setTextArea(height, textArea, progressArea, padding) {

        let rootfont = document.documentElement.style.fontSize.replace('px', '');
        if (rootfont == '') {
            rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
        }

        //画像の縦幅を取得して2で割る
        const imghalf = (height / 2) / rootfont;

        // テキストエリアの配置設定
        textArea.style.bottom = 'calc(50% + ' + (imghalf + padding) + 'rem)';
        // プログレスエリアの配置設定
        progressArea.style.top = 'calc(50% + ' + (imghalf + padding) + 'rem)';

        // ローディング用モーダルの起動（ローディングが複数あることはないので固定指定）
        textArea.parentElement.classList.add('c_loading01_isShow');
    }

    // Loader進捗更新用処理
    function updateLoader(progress) {
        const loading = document.getElementById('c_loading01');
        const countUpTime = 10;

        // カウントアップ
        const interval = setInterval(function () {
            // 引数を数値に変換
            const progressNum = +progress;
            // 現在の進捗率を数値に変換
            const currentNum = +loading.getElementsByClassName('c_loading01_progressNum')[0].innerText;

            loading.getElementsByClassName('c_loading01_progressNum')[0].innerText = currentNum + 1;
            if (currentNum + 1 >= 100 || progressNum <= currentNum + 1) {
                clearInterval(interval);
            };
        }, countUpTime);
    }

    // Loader終了用処理
    function closeLoader() {
        const loading = document.getElementById('c_loading01');
        const countUpTime = 10;

        // 進捗率が表示されていれば100%にしてから閉じる
        if (loading.classList.contains('c_loading01_addProgress')) {
            // カウントアップ
            const interval = setInterval(function () {
                // 現在の進捗率を数値に変換
                const currentNum = +loading.getElementsByClassName('c_loading01_progressNum')[0].innerText;
                loading.getElementsByClassName('c_loading01_progressNum')[0].innerText = currentNum + 1;
                if (currentNum + 1 >= 100) {
                    clearInterval(interval);
                    closeLoaderEnd();
                };
            }, countUpTime);
        } else {
            closeLoaderEnd();
        }

        function closeLoaderEnd() {
            const loading = document.getElementById('c_loading01');

            // Loader非表示
            loading.classList.remove('c_loading01_isShow');

            // 閉じるときにbodyscroll解除
            clearBodyScroll();
        }
    }
    // コンテンツ毎のLoader設定
    // Loader高さ設定処理
    function c_loading01_PartialSetheight(loading) {
        loading.style.height = '100%';
    }

    // Loader表示用処理
    // 引数1：targetID：部分ローダーを表示する対象のID名
    // 引数2：text：部分ローダーに表示するテキスト（未設定は非表示）
    // 引数3：progress：進捗率の数値（未設定は非表示）
    // 引数4：zindex：z-indexの数値（未設定はCSSの値に準拠）
    function showPartialLoader(targetId, text, progress, zindex) {
        const loading = document.getElementById('c_loading01');
        let targetArea = document.getElementById(targetId);

        // クローン用変数の用意
        let cloneloader = loading.parentElement.cloneNode(true);
        const cloneloading = cloneloader.children[0];
        // IDを一意にする
        cloneloading.id = loading.id + '_' + targetId;
        // positionをfixedからabsoluteへ変更
        cloneloading.style.position = 'absolute';

        // テキストが設定されていれば設定
        if (text != undefined && text.length > 0) {
            const textArea = cloneloader.getElementsByClassName('c_loading01_textArea')[0];
            textArea.getElementsByClassName('c_typo_bodyM')[0].innerText = text;
            cloneloading.classList.add('c_loading01_addText');
            // 部分表示用に最小幅設定を削除
            textArea.style.minWidth = 'initial';
        } else {
            cloneloading.classList.remove('c_loading01_addText');
        }

        // プログレスの数値が設定されていれば設定
        if (progress != undefined && +progress >= 0) {
            cloneloading.getElementsByClassName('c_loading01_progressNum')[0].innerText = progress;
            cloneloading.classList.add('c_loading01_addProgress');
            // 部分表示用に幅設定を追加
            cloneloading.getElementsByClassName('c_loading01_progressArea')[0].style.width = '90%';
        } else {
            cloneloading.classList.remove('c_loading01_addProgress');
        }

        // 画像のサイズを可変にする(最大幅は元画像サイズ)
        let loadingSvg = cloneloading.getElementsByClassName('c_loading01_svg')[0];
        loadingSvg.style.width = '4.8rem';
        loadingSvg.style.height = 'auto';
        loadingSvg.style.display = 'none';

        loadingParent = loadingSvg.parentElement;
        const pointDiv = document.createElement('div');
        pointDiv.classList.add('c_loading02_ellipses');
        const pointChild1 = document.createElement('div');
        pointChild1.classList.add('c_loading02_dot');
        const pointChild2 = document.createElement('div');
        pointChild2.classList.add('c_loading02_dot');
        const pointChild3 = document.createElement('div');
        pointChild3.classList.add('c_loading02_dot');
        pointDiv.appendChild(pointChild1);
        pointDiv.appendChild(pointChild2);
        pointDiv.appendChild(pointChild3);
        loadingParent.appendChild(pointDiv);

        // Loader表示処理
        // ローディング用モーダルの起動（ローディングが複数あることはないので固定指定）
        cloneloading.classList.add('c_loading02_isShow');

        // 高さ設定(iphoneでの高さ指定を考慮しJavascriptで設定)
        c_loading01_PartialSetheight(cloneloading);

        // 親要素のborderRadiusに対する調整
        const comStyle = window.getComputedStyle(document.getElementById(targetId));

        // Edge(IEモード)ではborderradiusで取得できないため分岐処理を用意しておく
        if (comStyle.borderRadius != "") {
            cloneloading.style.borderRadius = comStyle.borderRadius;
        } else if (
            comStyle.borderTopLeftRadius != ""
            || comStyle.borderTopRightRadius != ""
            || comStyle.borderBottomLeftRadius != ""
            || comStyle.borderBottomRightRadius != ""
        ) {
            cloneloading.style.borderTopLeftRadius = comStyle.borderTopLeftRadius;
            cloneloading.style.borderTopRightRadius = comStyle.borderTopRightRadius;
            cloneloading.style.borderBottomLeftRadius = comStyle.borderBottomLeftRadius;
            cloneloading.style.borderBottomRightRadius = comStyle.borderBottomRightRadius;
        }
        //引数4が未設定出ない場合
        if (zindex != undefined || zindex != "") {
            cloneloading.style.zIndex = zindex
        }

        targetArea.appendChild(cloneloader);
    }

    // Loader進捗更新用処理
    function updatePartialLoader(targetId, progress) {
        const id = 'c_loading01_' + targetId;
        const loading = document.getElementById(id);
        const countUpTime = 10;

        // カウントアップ
        const interval = setInterval(function () {
            // 引数を数値に変換
            const progressNum = +progress;
            // 現在の進捗率を数値に変換
            const currentNum = +loading.getElementsByClassName('c_loading01_progressNum')[0].innerText;

            loading.getElementsByClassName('c_loading01_progressNum')[0].innerText = currentNum + 1;
            if (currentNum + 1 >= 100 || progressNum <= currentNum + 1) {
                clearInterval(interval);
            };
        }, countUpTime);
    }

    // Loader終了用処理
    function closePartialLoader(targetId) {
        const id = 'c_loading01_' + targetId;
        const loading = document.getElementById(id);
        const targetArea = document.getElementById(targetId);
        const countUpTime = 10;

        // 進捗率が表示されていれば100%にしてから閉じる
        if (loading.classList.contains('c_loading01_addProgress')) {
            // カウントアップ
            const interval = setInterval(function () {
                // 現在の進捗率を数値に変換
                const currentNum = +loading.getElementsByClassName('c_loading01_progressNum')[0].innerText;
                loading.getElementsByClassName('c_loading01_progressNum')[0].innerText = currentNum + 1;
                if (currentNum + 1 >= 100) {
                    clearInterval(interval);
                    closePartialLoaderEnd(targetArea, loading);
                };
            }, countUpTime);
        } else {
            closePartialLoaderEnd(targetArea, loading);
        }

        function closePartialLoaderEnd(parent, target) {
            parent.removeChild(target.parentElement);
        }
    }
}

/** コンポーネント：Notification **/
if (!document.getElementsByClassName('c_notification_closeIcon').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    const notification = document.getElementsByClassName('c_notification_closeIcon');

    for (let i = 0; i < notification.length; i++) {
        notification[i].addEventListener('click', function () {
            this.parentElement.parentElement.classList.add('c_notification_hidden');
        });

        notification[i].addEventListener('keydown', function (e) {
            let clickEvent;
            // クリックイベントの生成
            if (c_isbrowserIE()) {
                clickEvent = document.createEvent('Event');
                clickEvent.initEvent('click', false, true);
            } else {
                clickEvent = new Event('click');
            }

            // keyCode : "13" （Enter）
            if (e.keyCode == "13") {
                this.dispatchEvent(clickEvent);
            }
        });
    };
}

/** コンポーネント：Pulldown **/
if (!document.getElementsByClassName('c_pullDown01').length) {
    // 該当の要素がない場合は処理を行わない
} else {
    // select要素からリスト生成
    function makePull() {
        // selestタグ取得
        const pull_select = document.getElementsByClassName('c_pullDown01_select');

        // 既にUlに作成されているliを削除
        const collectionListUl = document.getElementsByClassName('c_pullDown01_list');
        for (let i = 0; i < pull_select.length; i++) {
            if (collectionListUl[i].hasChildNodes()) {
                collectionListUl[i].innerHTML = '';
            }
        }

        //プルダウンメニューをすべてに対して処理
        for (let i = 0; i < pull_select.length; i++) {

            //プルダウンメニュー内のoptionタグからliタグを生成
            for (let j = 0; j < pull_select[i].length; j++) {

                // 作成するli
                const newLi = document.createElement('li');
                newLi.setAttribute('tabindex', '0');
                // 各リストの下線用div
                const listBorderDiv = document.createElement("div");
                // liタグ内に追加するチェックアイコン用のdiv
                const checkDiv = document.createElement("div");
                // liタグ内に追加する選択項目テキスト用のp
                const listP = document.createElement('p');
                listP.className = 'c_typo_bodyM c_typo_BLK10 c_typo_align_left';

                // li
                // 選択されているoptionの場合、選択されていることを明示するクラス名を追加
                if (pull_select[i].options[j].value == pull_select[i].value) {
                    newLi.classList.add("c_pullDown01_selected");
                    listP.className = 'c_typo_headerS c_typo_BLK10 c_typo_align_left';
                }
                newLi.dataset.value = pull_select[i].options[j].value;

                // 下線用div
                listBorderDiv.classList.add("c_pullDown01_listBorder");
                // チェックアイコン用div
                checkDiv.classList.add("c_pullDown01_icon_check");

                // チェックアイコンsvg生成
                const checkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                checkSvg.setAttribute("width", "2.4rem");
                checkSvg.setAttribute("height", "2.4rem");
                checkSvg.setAttribute("viewBox", "0 0 24 24");
                checkSvg.setAttribute("fill", "none");
                const checkSvgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                checkSvgPath.setAttribute("fill-rule", "evenodd");
                checkSvgPath.setAttribute("clip-rule", "evenodd");
                checkSvgPath.setAttribute('d', 'M18.5283 6.54563C18.9339 6.92047 18.9589 7.55315 18.584 7.95875L9.44402 17.8487C9.25513 18.0531 8.9896 18.1696 8.71129 18.17C8.43298 18.1705 8.16707 18.055 7.97749 17.8512L4.36749 13.9712C3.99129 13.5669 4.0141 12.9341 4.41844 12.5579C4.82278 12.1817 5.45553 12.2045 5.83173 12.6089L8.70714 15.6993L17.1152 6.60132C17.4901 6.19572 18.1227 6.17079 18.5283 6.54563Z');
                checkSvgPath.setAttribute("fill", "#2E2E2E");
                checkSvg.appendChild(checkSvgPath);
                // divにチェックアイコンsvg追加
                checkDiv.appendChild(checkSvg);
                // プルダウンメニューのoptionタグのテキストをliのpに反映
                listP.innerHTML = pull_select[i].options[j].innerHTML;
                // チェックアイコンsvgの親div追加
                listBorderDiv.appendChild(checkDiv);
                // P追加
                listBorderDiv.appendChild(listP);

                // プルダウンメニューのoptionに凡例フラグがある場合にliに凡例アイコン追加
                if (pull_select[i].options[j].classList.contains('c_pullDown01_hanrei_icon')) {
                    // liに追加する凡例アイコン用のdiv
                    const hanreiDiv = document.createElement("div");
                    hanreiDiv.classList.add("c_pullDown01_icon_hanrei");
                    // liに追加する凡例アイコンsvg生成
                    const hanreiSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                    hanreiSvg.setAttribute("width", "2.4rem");
                    hanreiSvg.setAttribute("height", "2.4rem");
                    hanreiSvg.setAttribute("viewBox", "0 0 24 24");
                    hanreiSvg.setAttribute("fill", "none");
                    const hanreiSvgPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    hanreiSvgPath1.setAttribute("d", "M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z");
                    hanreiSvgPath1.setAttribute("fill", "#D20024");
                    const hanreiSvgPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    hanreiSvgPath2.setAttribute("fill-rule", "evenodd");
                    hanreiSvgPath2.setAttribute("clip-rule", "evenodd");
                    hanreiSvgPath2.setAttribute("d", "M11.9998 14.25C11.5598 14.25 11.0698 13.96 11.0298 13.34V13.35L10.7298 8.00999L10.6898 6.89999C10.6798 6.37999 10.8998 5.96999 11.2998 5.73999C11.7298 5.48999 12.2798 5.48999 12.6998 5.73999C13.0998 5.96999 13.3098 6.37999 13.3098 6.88999L13.2698 7.99999L12.9698 13.34C12.9298 13.97 12.4398 14.25 11.9998 14.25ZM10.6504 17.08C10.6504 16.34 11.2604 15.73 12.0004 15.73C12.7404 15.73 13.3504 16.34 13.3504 17.08C13.3504 17.82 12.7404 18.43 12.0004 18.43C11.2604 18.43 10.6504 17.82 10.6504 17.08Z");
                    hanreiSvgPath2.setAttribute("fill", "white");
                    hanreiSvg.appendChild(hanreiSvgPath1);
                    hanreiSvg.appendChild(hanreiSvgPath2);
                    // 凡例アイコンdivに凡例アイコンsvg追加
                    hanreiDiv.appendChild(hanreiSvg);
                    // liに凡例アイコンdivの追加
                    listBorderDiv.appendChild(hanreiDiv);
                }
                // 下線用div追加
                newLi.appendChild(listBorderDiv);

                // optionがhiddenならliを表示しない
                // optionタグにhiddenが設定されているか判定
                if (pull_select[i].options[j].hidden) {
                    newLi.style.display = "none";
                }

                // li追加
                document.getElementsByClassName('c_pullDown01_list')[i].appendChild(newLi);

                // menuの初期表示テキストとして選択されている項目のテキストを表示
                if (newLi.classList.contains('c_pullDown01_selected')) {
                    document.getElementsByClassName('c_pullDown01_menu_selected')[i].innerHTML = listBorderDiv.innerHTML.replace('c_typo_BLK10', 'c_typo_GRN10').replace('c_typo_align_left', 'c_typo_align_left c_typo_oneLine');
                }

                // リスト押下時にイベント登録
                newLi.addEventListener('click', clickPullDownSelectList);

                // キー操作が行われたら処理を実行
                newLi.addEventListener('keydown', function (e) {
                    let clickEvent
                    // クリックイベントの生成
                    if (c_isbrowserIE()) {
                        clickEvent = document.createEvent('Event');
                        clickEvent.initEvent('click', false, true);
                    } else {
                        clickEvent = new Event('click');
                    }

                    // EnterキーもしくはSpace押下で該当項目を選択する
                    // keyCode : "13" （Enter）
                    if (e.keyCode == "13") {
                        this.dispatchEvent(clickEvent);
                    }
                });
            }
        }
    }

    /* プルダウンの開閉状態を設定 */
    function clickPullDown() {
        // 対象のプルダウンを設定
        const parentPullDown = this.parentElement;
        // 押下したプルダウン以外はすべて閉じる
        const pulldown = document.getElementsByClassName('c_pullDown01');
        for (let i = 0; i < pulldown.length; i++) {
            if ((pulldown[i] != parentPullDown) && (pulldown[i].classList.contains('c_pullDown01_isOpen'))) {
                pulldown[i].classList.remove('c_pullDown01_isOpen');
            }
        }

        // 開閉フラグの判定
        if (parentPullDown.classList.contains('c_pullDown01_isOpen')) {
            // 開いている状態なら閉じる
            // openフラグの削除
            parentPullDown.classList.remove('c_pullDown01_isOpen');
        } else {
            // 閉じている状態なら開く
            // リストの表示位置・高さを指定する関数を呼び出す
            setListBox(parentPullDown);
            // openフラグの追加
            parentPullDown.classList.add('c_pullDown01_isOpen');
        }
    }

    /* リストボックスの高さを取得し表示位置を設定 */
    function setListBox(targetElement) {

        // 各パーツを変数化
        // 対象のプルダウンメニュー
        const targetPullDownMenu = targetElement.getElementsByClassName('c_pullDown01_menu')[0];
        // 対象のリストボックス
        const listBox = targetElement.getElementsByClassName('c_pullDown01_listBox')[0];
        // リストボックスに含まれる凡例行
        const hanrei = listBox.getElementsByClassName('c_pullDown01_hanrei');

        // 画面の高さ取得
        let windowHeight
        // IEによって使用する
        if (c_isbrowserIE()) {
            windowHeight = document.documentElement.clientHeight;
        } else {
            windowHeight = window.innerHeight;
        }

        let rootfont = document.documentElement.style.fontSize.replace('px', '');
        if (rootfont == '') {
            rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
        }

        //リストボックスに横幅を設定
        const pullDownMenuWidth = targetPullDownMenu.parentElement.getBoundingClientRect().width;
        const listBoxWidth = targetPullDownMenu.parentElement.getElementsByClassName('c_pullDown01_listBox')[0];
        listBoxWidth.style.width = pullDownMenuWidth / rootfont + "rem";

        // プルダウンメニューの画面内のtop位置取得
        const pullDownMenuTop = targetPullDownMenu.getBoundingClientRect().top;
        // プルダウンメニューの画面内のbottom位置取得
        const pullDownMenuBottom = targetPullDownMenu.getBoundingClientRect().bottom;
        // プルダウンメニューの高さ
        const pullDownMenuHeight = targetPullDownMenu.offsetHeight;
        // リストボックスとプルダウンメニュー間の余白(8px)
        const listMargin = 8;
        // リストボックスの表示位置
        const listBoxPosition = pullDownMenuHeight + listMargin;
        // 上に伸びる際のリスト表示可能エリア
        const listAreaUpper = pullDownMenuTop - (listMargin * 2);
        // 下に伸びる際のリストの表示可能エリア
        const listArea = windowHeight - (pullDownMenuBottom + (listMargin * 2));

        // プルダウンの上下余白を比較
        if (listAreaUpper > listArea) {
            // リストボックスの高さの最大値を設定
            listBox.style.maxHeight = listAreaUpper / rootfont + "rem";
            const listHeight = listBox.offsetHeight;
            // プルダウンエリア最上部から余白8px上に表示
            listBox.style.top = (pullDownMenuTop - listHeight - listMargin) / rootfont + "rem";
        } else {
            // 通常は下に伸びる
            // リストボックスの高さの最大値を設定
            listBox.style.maxHeight = listArea / rootfont + "rem";
            // プルダウンエリア最上部からメニューの高さ＋余白8px下に表示
            listBox.style.top = (pullDownMenuTop + listBoxPosition) / rootfont + "rem";

        }
    }

    /* リストの選択状態を設定 */
    function clickPullDownSelectList() {
        // 対象プルダウン
        const targetElement = this.parentElement.parentElement.parentElement;
        // フラグの判定
        if (!this.classList.contains('c_pullDown01_selected')) {
            // 各パーツを変数化
            // 全リスト
            const list = this.parentElement.children;
            // 対象プルダウンメニューのテキストエリア
            const pullDownMenuText = targetElement.getElementsByClassName('c_pullDown01_menu_selected')[0];
            // プルダウンメニュー
            const thisSelect = targetElement.getElementsByClassName('c_pullDown01_select')[0];

            // リスト選択有無フラグ設定削除
            for (let i = 0; i < list.length; i++) {
                list[i].classList.remove('c_pullDown01_selected');
                list[i].innerHTML = list[i].innerHTML.replace('c_typo_headerS', 'c_typo_bodyM');
            }
            // 選択フラグの設定
            this.classList.add('c_pullDown01_selected');
            this.innerHTML = this.innerHTML.replace('c_typo_bodyM', 'c_typo_headerS');

            // プルダウンメニューのテキスト設定
            pullDownMenuText.innerHTML = this.getElementsByClassName('c_pullDown01_listBorder')[0].innerHTML.replace('c_typo_BLK10', 'c_typo_GRN10').replace('c_typo_align_left', 'c_typo_align_left c_typo_oneLine');

            // optionタグにselectedを設定
            for (let i = 0; i < thisSelect.length; i++) {
                if (thisSelect.options[i].value == this.dataset.value) {
                    thisSelect.options[i].selected = true;

                    // onchangeイベント発火
                    if (thisSelect.onchange) {
                        thisSelect.onchange();
                    }
                }
            }
        }
        // 選択したらリストを非表示
        // openフラグの削除
        targetElement.classList.remove('c_pullDown01_isOpen');
    }

    // 画面読み込み時にプルダウンリスト生成
    window.addEventListener('DOMContentLoaded', function () {

        makePull();
        const pulldown = document.getElementsByClassName('c_pullDown01');
        for (let i = 0; i < pulldown.length; i++) {
            setListBox(pulldown[i]);
        }
    }

    );

    // コレクションを取得
    const pullDownMenu = document.getElementsByClassName('c_pullDown01_menu');
    // プルダウンメニュー押下時にイベント登録
    for (let i = 0; i < pullDownMenu.length; i++) {
        pullDownMenu[i].addEventListener('click', clickPullDown); // クリック時に見出し部分と内容部分の高さを設定、アイコン部分のクラスを入れ替え
    }

    // コレクションを取得
    const pullDownOutSideClose = document.getElementsByClassName('c_pullDown01_outSideClose');

    // エリア外押下にイベント登録
    for (let i = 0; i < pullDownOutSideClose.length; i++) {
        pullDownOutSideClose[i].addEventListener('click', clickPullDown); // クリック時に見出し部分と内容部分の高さを設定、アイコン部分のクラスを入れ替え
    }

    // リサイズ
    window.addEventListener('resize', function () {
        const openMenu = document.getElementsByClassName('c_pullDown01_isOpen');
        for (let i = 0; i < openMenu.length; i++) {
            setListBox(openMenu[i]);
        }
    });

    // リストボックスOpen時にスクロールが発生したらリストボックスを非表示
    document.addEventListener('scroll', function () {
        const pulldown = document.getElementsByClassName('c_pullDown01');
        for (let i = 0; i < pulldown.length; i++) {
            const listBox = pulldown[i].getElementsByClassName('c_pullDown01_listBox')[0];
            const pullMenu = pulldown[i].getElementsByClassName('c_pullDown01_menu')[0];
            const pullMenuRect = pullMenu.getBoundingClientRect();
            const listBoxRect = listBox.getBoundingClientRect();

            const margin = 8;

            let rootfont = document.documentElement.style.fontSize.replace('px', '');
            if (rootfont == '') {
                rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
            }
            // listBoxがプルダウンの上下どちらに表示されているかを判定
            if (pullMenuRect.top > listBoxRect.top) {
                // listBoxが上に表示されている場合
                listBox.style.top = (pullMenuRect.top - listBoxRect.height - margin) / rootfont + "rem";
            } else {
                // listBoxが下に表示されている場合
                listBox.style.top = (pullMenuRect.top + margin + pullMenuRect.height) / rootfont + "rem";
            }

            pulldown[i].classList.remove('c_pullDown01_isOpen');
        }
    });

    window.addEventListener('DOMContentLoaded', function () {
        const pullDownList = document.getElementsByClassName('c_pullDown01');

        for (let i = 0; i < pullDownList.length; i++) {

            // キー操作が行われたら処理を実行
            pullDownList[i].children[1].addEventListener('keydown', function (e) {
                let clickEvent;
                // クリックイベントの生成
                if (c_isbrowserIE()) {
                    clickEvent = document.createEvent('Event');
                    clickEvent.initEvent('click', false, true);
                } else {
                    clickEvent = new Event('click');
                }

                // EnterキーもしくはSpace押下で該当項目を選択する
                // keyCode : "13" （Enter）
                if (e.keyCode == "13") {
                    this.dispatchEvent(clickEvent);
                }
            });
        }
    })

}

/** コンポーネント：Progressbar **/
if (!document.getElementsByClassName('c_pgb').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    //初期処理時の処理
    //適用したデータセット・クラス・スタイルを初期化
    function initProgress() {
        const progresstitle = document.getElementsByClassName('c_pgb');

        for (let i = 0; i < progresstitle.length; i++) {
            let child = progresstitle[i].children;
            // progressbarの子要素の配列をchildと定義する
            for (let j = 0; j < child.length; j++) {
                child[j].dataset.value = 0;
                const targetBar = child[j].getElementsByClassName('c_pgb_bar')[0];
                targetBar.style.height = '0';
            }
        }
    }

    function progressMove() {
        // startOffsetにブラウザの内側の高さの半分の長さを設定
        let clHeight;
        // IEによって使用する対象を変更
        if (c_isbrowserIE()) {
            clHeight = document.documentElement.clientHeight;
        } else {
            clHeight = window.innerHeight;
        }
        const startOffset = clHeight / 2;
        const progresstitle = document.getElementsByClassName('c_pgb');

        //p c_pgb単位（バーの固まり単位に）に処理を実行
        for (let i = 0; i < progresstitle.length; i++) {
            let child = progresstitle[i].children;
            //プログレスバー単位に処理を実行
            for (let j = 0; j < child.length; j++) {
                const calcRect = child[j].getBoundingClientRect();
                const targetBar = child[j].getElementsByClassName('c_pgb_bar')[0];
                const targetNumber = child[j].getElementsByClassName('c_pgb_number')[0];

                // 画面半分よりも上に要素が来た場合、クラスを設定し丸の色を変更
                // 画面半分よりも上に要素すべてが通過した場合は、プログレスバーをすべて黄色く表示（１００％にする）
                // 要素が画面半分にかかっている場合（通過中）、プログレスバーは画面中央まで伸びるように黄色のプログレスバーの高さを設定
                // ただし、プログレスバーは一度伸びると縮まない仕様のため、最大値をデータセットに保存し、その値を比較
                if (calcRect.top <= startOffset) {
                    targetNumber.classList.add('c_pgb_number_yellow');
                    if (calcRect.bottom < startOffset) {
                        child[j].dataset.value = 100;
                        targetBar.style.height = '100%';
                        if (j != (child.length - 1)) {
                            targetBar.style.borderRadius = '0px';
                        }
                    } else {
                        if (child[j].dataset.value == 100) {
                        } else {
                            const heightRatio = (startOffset - calcRect.top) / calcRect.height * 100;
                            // 下のif文は一度黄色になった部分を灰色に戻さないための処理
                            if (child[j].dataset.value < heightRatio) {
                                child[j].dataset.value = heightRatio;
                                targetBar.style.height = heightRatio + '%';
                            }
                        }
                    }
                }
            }
        }
    }

    // スクロール時にイベント登録
    window.addEventListener('scroll', progressMove);

    // ページ読み込み時にイベント登録
    window.addEventListener('DOMContentLoaded', function () {
        initProgress();
        progressMove();
    });

    // 画面サイズが変わってもスクロールがされるための処理
    window.addEventListener('resize', progressMove);
}

/** コンポーネント：Radio（任意項目あり） **/
if (!document.getElementsByClassName('c_radio03').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    const radioChange = document.getElementsByClassName('c_radio03');
    // ラジオボタン分ループ
    for (let i = 0; i < radioChange.length; i++) {
        // 任意項目の対象となるclassがある場合のみ処理を続行
        if (radioChange[i].classList.contains('c_radio03_optional')) {
            const opUnit = radioChange[i].getElementsByClassName('c_radio03_unit');
            // input数分ループ
            for (let j = 0; j < opUnit.length; j++) {
                // 各Radioボタンのinput要素を取得する
                const opInput = opUnit[j].getElementsByTagName('input')[0];
                // クリックイベントの登録
                opInput.addEventListener('click', function () {

                    // クリックされたradioの親要素にc_radio03_opActiveクラスがあればすべてのチェックを削除
                    if (this.parentElement.classList.contains('c_radio03_opActive')) {
                        c_radio_clearOptional(this);

                        // チェンジイベントの発行
                        let changeEvent;
                        if (c_isbrowserIE()) {
                            // IE
                            changeEvent = document.createEvent('Event');
                            changeEvent.initEvent('change', false, false);
                        } else {
                            // IE以外
                            changeEvent = new Event('change');
                        }
                        this.dispatchEvent(changeEvent);
                    } else {
                        // クリックされたradioの親要素にc_radio03_opActiveクラスがなければすべてのチェックを削除して押下された要素にチェックを付与
                        c_radio_clearOptional(this);
                        this.parentElement.classList.add('c_radio03_opActive');
                        this.checked = true;
                    }
                });
            }
        }
    }

    // チェック状態確認classのクリア関数
    //  引数１：c_radio03のinput要素
    function c_radio_clearOptional(radio) {

        // name属性の値を取得
        const name = radio.getAttribute('name')
        // クリックしたname属性と同名のradioを取得
        const nameGroup = document.getElementsByName(name);

        for (let i = 0; nameGroup.length > i; i++) {
            // 親要素にc_radio03_opActiveクラスを持っていればチェックを外す
            if (nameGroup[i].parentElement.classList.contains('c_radio03_opActive')) {

                nameGroup[i].parentElement.classList.remove('c_radio03_opActive');
                radio.checked = false;
            }
        }
    }
}

/** コンポーネント：Tab Line **/
if (!document.getElementsByClassName('c_tab').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    // コンテンツ選択ボタンに処理紐づけ
    const tabClicked = document.getElementsByClassName('c_tab_tabText');
    for (let i = 0; i < tabClicked.length; i++) {
        // sectionエリア取得
        let sectionArea = tabClicked[i].parentElement.parentElement.parentElement;
        if (!sectionArea.classList.contains('c_tab')) {
            sectionArea = sectionArea.parentElement;
        }

        // 画面遷移フラグがなかったら、クリックイベント登録
        if (!sectionArea.classList.contains('c_tab_pageTransition')) {
            // タブクリック
            tabClicked[i].addEventListener('click', function () {
                // 押下タブ
                const tab = this.parentElement;
                // ターゲットID
                const targetId = tab.dataset.target_id;
                // sectionエリア内タグ
                const tabInsection = sectionArea.getElementsByClassName('c_tab_tabText');
                // sectionエリアコンテンツエリア
                const contentsArea = sectionArea.getElementsByClassName('c_tab_targetContents')[0];
                // sectionエリア内コンテンツ
                const contents = contentsArea.children;

                // tabのタブ選択有無フラグ設定削除
                for (let i = 0; i < tabInsection.length; i++) {
                    tabInsection[i].parentElement.classList.remove('c_tab_tabSelected');
                }
                // 押下タブにタブ選択有無フラグ設定
                tab.classList.add('c_tab_tabSelected');

                // コンテンツ切替
                for (let i = 0; i < contents.length; i++) {
                    contents[i].classList.remove('c_tab_active');
                    // コンテンツにtargetIdと同じクラス名があったら表示
                    if (contents[i].classList.contains(targetId)) {
                        contents[i].classList.add('c_tab_active');
                    }
                }
            });
        }
    }
}

/** コンポーネント：Tab Button/Button-mini **/
if (!document.getElementsByClassName('c_tabEllipse').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    // 選択したタブの設定処理
    function setSelectTab(cliclkTab, sectionArea) {
        // ターゲットID
        const targetId = cliclkTab.dataset.target_id;
        // sectionエリア内タグ
        const tabInsection = sectionArea.getElementsByClassName('c_tabEllipse_tab');
        // コンテンツエリア
        const contents = sectionArea.getElementsByClassName('c_tabEllipse_targetContents')[0].children;

        // tabのタブ選択有無フラグ設定削除
        for (let i = 0; i < tabInsection.length; i++) {
            tabInsection[i].classList.remove('c_tabEllipse_tabSelected');
        }
        // 押下タブにタブ選択有無フラグ設定
        cliclkTab.classList.add('c_tabEllipse_tabSelected');

        // コンテンツ切替
        for (let i = 0; i < contents.length; i++) {
            contents[i].classList.remove('c_tabEllipse_active');
            // コンテンツにtargetIdと同じクラス名があったら表示
            if (contents[i].classList.contains(targetId)) {
                contents[i].classList.add('c_tabEllipse_active');
            }
        }
    }

    // クリックイベント登録
    const tab = document.getElementsByClassName('c_tabEllipse');
    for (let i = 0; i < tab.length; i++) {
        const sectionArea = tab[i];
        // 画面遷移フラグがない場合
        if (!sectionArea.classList.contains('c_tabEllipse_pageTransition')) {
            const tabClicked = sectionArea.getElementsByClassName('c_tabEllipse_tab');
            for (let j = 0; j < tabClicked.length; j++) {
                // タブクリック
                tabClicked[j].addEventListener('click', function () {
                    setSelectTab(this, sectionArea);
                });
            }
        }
    }
}

/** コンポーネント：Button01 **/
if (!document.getElementsByClassName('c_button01').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    const button = document.getElementsByClassName('c_button01');
    for (let i = 0; i < button.length; i++) {

        // disableの場合、フォーカスを無効にする
        if (button[i].classList.contains('c_button01_disabled')) {
            button[i].children[0].setAttribute('tabindex', '-1');
        }
    }
}

/** コンポーネント：Button02 **/
if (!document.getElementsByClassName('c_button02').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    const button = document.getElementsByClassName('c_button02');
    for (let i = 0; i < button.length; i++) {
        // disableの場合、フォーカスを無効にする
        if (button[i].classList.contains('c_button02_disabled')) {
            button[i].children[0].setAttribute('tabindex', '-1');
        }
    }
}

/** コンポーネント：Button03 **/
if (!document.getElementsByClassName('c_button03').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    const button = document.getElementsByClassName('c_button03');
    for (let i = 0; i < button.length; i++) {
        // disableの場合、フォーカスを無効にする
        if (button[i].classList.contains('c_button03_disabled')) {
            button[i].children[0].setAttribute('tabindex', '-1');
        }
    }
}

/** コンポーネント：Button04 **/
if (!document.getElementsByClassName('c_button04').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    const button = document.getElementsByClassName('c_button04');
    for (let i = 0; i < button.length; i++) {
        // disableの場合、フォーカスを無効にする
        if (button[i].children[0].classList.contains('c_button04_disabled')) {
            button[i].children[0].children[0].setAttribute('tabindex', '-1');
        }
    }
}

/** コンポーネント：Text field（input） **/
if (!document.getElementsByClassName('c_textField01').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    // 目のアイコンの処理
    const passwordToggle = document.getElementsByClassName('c_textField01_pass');
    for (let i = 0; i < passwordToggle.length; i++) {
        // クリックイベント
        passwordToggle[i].addEventListener('click', function () {
            const input = this.parentElement.children[0];

            // テキスト表示、目のアイコン表示
            if (input.getAttribute('type') == 'password') {
                this.classList.add('c_textField01_visible');
                this.classList.remove('c_textField01_invisible');
                input.setAttribute('type', 'text');
            }

            // テキスト非表示、目のアイコン（スラッシュ）表示
            else {
                input.setAttribute('type', 'password');
                this.classList.add('c_textField01_invisible');
                this.classList.remove('c_textField01_visible');
            }
        });
    }
}

/** コンポーネント：Text field（dropdown） **/
if (!document.getElementsByClassName('c_textField03').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    // ドロップダウンエリアを取得
    const textFields = document.getElementsByClassName('c_textField03');
    for (let i = 0; i < textFields.length; i++) {

        const inputText = textFields[i].getElementsByClassName('c_textField03_inputText');
        for (let v = 0; v < inputText.length; v++) {

            inputText[v].addEventListener('change', function () {
                // クラスの付け替え
                if (this.selectedIndex == 0) {
                    this.parentElement.classList.add('c_textField_NoSelected');
                } else {
                    this.parentElement.classList.remove('c_textField_NoSelected');
                }
            });
        }

    }

    for (let i = 0; i < textFields.length; i++) {

        for (let v = 0; v < textFields[i].children.length; v++) {
            // disableの場合、フォーカスを無効にする
            if (textFields[i].children[v].children[0].classList.contains('c_textField03_disable')) {
                textFields[i].children[v].children[0].setAttribute('tabindex', '-1');
            }
        }
    }
}

/** コンポーネント：Text field（dropdown） **/
if (!document.getElementsByClassName('c_textField04').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    // ドロップダウンエリアを取得
    const textFields = document.getElementsByClassName('c_textField04');
    for (let i = 0; i < textFields.length; i++) {

        const inputText = textFields[i].getElementsByClassName('c_textField04_inputText');
        for (let v = 0; v < inputText.length; v++) {

            inputText[v].addEventListener('change', function () {
                // クラスの付け替え
                if (this.selectedIndex == 0) {
                    this.parentElement.classList.add('c_textField_NoSelected');
                } else {
                    this.parentElement.classList.remove('c_textField_NoSelected');
                }
            });
        }

    }

    for (let i = 0; i < textFields.length; i++) {

        for (let v = 0; v < textFields[i].children.length; v++) {
            // disableの場合、フォーカスを無効にする
            if (textFields[i].children[v].children[0].classList.contains('c_textField04_disable')) {
                textFields[i].children[v].children[0].setAttribute('tabindex', '-1');
            }
        }
    }
}

/** コンポーネント：Text field（textarea） **/
if (!document.getElementsByClassName('c_textField_textarea').length) {
    // 該当の要素がない場合は処理を行なわない
} else {

    // テキストエリアのactive設定
    function textareaActive(textarea) {
        // textareaにフォーカスをあてる
        textarea.focus();
        // テキストエリアがデフォルトの場合は、active設定
        if (textarea.parentElement.classList.contains('c_textField05_default')) {
            textarea.parentElement.classList.add('c_textField05_active');
        }
    }

    // textareaクリックイベント
    const textareaArea = document.getElementsByClassName('c_textField_textarea');
    for (let i = 0; i < textareaArea.length; i++) {
        textareaArea[i].addEventListener('click', function () {
            // textareaの要素を取得
            const textarea = this.getElementsByClassName('c_textField05_inputText')[0];
            textareaActive(textarea);
        });
    }

    // textareaの要素を取得
    const textarea = document.getElementsByClassName('c_textField05_inputText');
    for (let i = 0; i < textarea.length; i++) {
        // textareaのフォーカス時のイベント
        textarea[i].addEventListener('focus', function () {
            textareaActive(this);
        });

        // textareaのフォーカス時以外のイベント
        textarea[i].addEventListener('blur', function () {
            // activeの設定解除
            this.parentElement.classList.remove('c_textField05_active');

        });
    }
}

/** コンポーネント：Text field（Myster/input） **/
if (!document.getElementsByClassName('c_textField07').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    // 目のアイコンの処理
    const passwordToggle = document.getElementsByClassName('c_textField07_pass');
    for (let i = 0; i < passwordToggle.length; i++) {
        // クリックイベント
        passwordToggle[i].addEventListener('click', function () {
            const input = this.parentElement.children[0];

            // テキスト表示、目のアイコン表示
            if (input.getAttribute('type') == 'password') {
                this.classList.add('c_textField07_visible');
                this.classList.remove('c_textField07_invisible');
                input.setAttribute('type', 'text');
            }

            // テキスト非表示、目のアイコン（スラッシュ）表示
            else {
                input.setAttribute('type', 'password');
                this.classList.add('c_textField07_invisible');
                this.classList.remove('c_textField07_visible');
            }
        });
    }
}

/** コンポーネント：Text field（Myster/dropdown） **/
if (!document.getElementsByClassName('c_textField08_dropdown').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    // ドロップダウンエリアを取得
    const textFields = document.getElementsByClassName('c_textField08_dropdown');
    for (let i = 0; i < textFields.length; i++) {
        textFields[i].getElementsByClassName('c_textField08_inputText')[0].addEventListener('change', function () {
            // クラスの付け替え
            if (this.selectedIndex == 0) {
                this.parentElement.classList.add('c_textField_NoSelected');
            } else {
                this.parentElement.classList.remove('c_textField_NoSelected');
            }
        });
    }
}

/** コンポーネント：Text field（Myster/textarea） **/
if (!document.getElementsByClassName('c_textField09_textarea').length) {
    // 該当の要素がない場合は処理を行なわない
} else {

    // テキストエリアのactive設定
    function textareaActive02(textarea) {
        // textareaにフォーカスをあてる
        textarea.focus();
        // テキストエリアがデフォルトの場合は、active設定
        if (textarea.parentElement.classList.contains('c_textField09_default')) {
            textarea.parentElement.classList.add('c_textField09_active');
        }
    }

    // textareaクリックイベント
    const textareaArea = document.getElementsByClassName('c_textField09_textarea');
    for (let i = 0; i < textareaArea.length; i++) {
        textareaArea[i].addEventListener('click', function () {
            // textareaの要素を取得
            const textarea = this.getElementsByClassName('c_textField09_inputText')[0];
            textareaActive02(textarea);
        });
    }

    // textareaの要素を取得
    const textarea = document.getElementsByClassName('c_textField09_inputText');
    for (let i = 0; i < textarea.length; i++) {
        // textareaのフォーカス時のイベント
        textarea[i].addEventListener('focus', function () {
            textareaActive02(this);
        });

        // textareaのフォーカス時以外のイベント
        textarea[i].addEventListener('blur', function () {
            // activeの設定解除
            this.parentElement.classList.remove('c_textField09_active');

        });
    }
}

/** コンポーネント：Text link02 **/
if (!document.getElementsByClassName('c_textLink02').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    const textlink02 = document.getElementsByClassName('c_textLink02');
    for (let i = 0; i < textlink02.length; i++) {

        // disableの場合、フォーカスを無効にする
        if (textlink02[i].classList.contains('c_textLink02_disabled')) {
            textlink02[i].children[0].setAttribute('tabindex', '-1');
        }
    }
}

/** コンポーネント：Text link03 **/
if (!document.getElementsByClassName('c_textLink03').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    const textlink03 = document.getElementsByClassName('c_textLink03');
    for (let i = 0; i < textlink03.length; i++) {

        // disableの場合、フォーカスを無効にする
        if (textlink03[i].classList.contains('c_textLink03_disabled')) {
            textlink03[i].children[0].setAttribute('tabindex', '-1');
        }
    }
}

/** コンポーネント：Toast **/
if (!document.getElementsByClassName('c_toast01').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    let fadeTimeout;
    let colorTimeout;
    // トースト表示用メソッド
    // 引数
    //  variation : 表示するトーストの種類（Information:青 Success:緑 Warning:橙 Error:赤）
    //  message   : old_global向け、テキストのみ設定
    //	closeIcon : ×アイコン有無（true:あり false:なし）
    //	tag       : 任意の要素に設定するHTML構成を設定
    function showToast01(variation, message, closeIcon, tag) {

        // 取得した要素にクリックイベント用のクラスがある場合はタグの構成が異なるため処理を行わない
        const cToast = document.getElementsByClassName('c_toast01')[0];
        if (cToast.getElementsByClassName('c_toast01_showToast').length) {
            return false;
        }

        // busy状態または、トーストの種類を指定しない場合は処理を行なわない
        const toast = cToast.getElementsByClassName('c_toast01_toast')[0];
        if (variation != 'Information' && variation != 'Success' && variation != 'Warning' && variation != 'Error') {
            return false;
        }

        // トーストの種類
        // トーストの種類を指定したときのフラグ
        toast.classList.add('c_toast01_custom');

        // アラートアイコン
        const iconExcl = toast.getElementsByClassName('c_iconAndText01_exclamation')[0];
        const iconSuccess = toast.getElementsByClassName('c_iconAndText01_success')[0];

        // 初回判定のためにiconExcl および iconSuccessの両方にclass「c_iconAndText01_hidden」が付与されていないことで確認
        if (!iconExcl.classList.contains('c_iconAndText01_hidden') && !iconSuccess.classList.contains('c_iconAndText01_hidden')) {
            //iOS向け、値設定しないとブロック変数が読み取れないため必ず値を設定する
            fadeTimeout = 0;
            colorTimeout = 0;
        }
        // クラス初期化
        iconExcl.classList.remove('c_iconAndText01_informative');
        iconExcl.classList.remove('c_iconAndText01_warning');
        iconExcl.classList.remove('c_iconAndText01_error');
        iconExcl.classList.remove('c_iconAndText01_hidden');

        iconSuccess.classList.remove('c_iconAndText01_hidden');
        clearColorToast(toast);
        // 表示するトーストの色とアイコンを設定
        switch (variation) {
            case ('Information'):
                toast.classList.add('c_toast01_blue');
                iconExcl.classList.add('c_iconAndText01_informative');
                iconSuccess.classList.add('c_iconAndText01_hidden');
                break;

            case ('Success'):
                toast.classList.add('c_toast01_green');
                iconExcl.classList.add('c_iconAndText01_hidden');
                break;

            case ('Warning'):
                toast.classList.add('c_toast01_orange');
                iconExcl.classList.add('c_iconAndText01_warning');
                iconSuccess.classList.add('c_iconAndText01_hidden');
                break;

            case ('Error'):
                toast.classList.add('c_toast01_red');
                iconExcl.classList.add('c_iconAndText01_error');
                iconSuccess.classList.add('c_iconAndText01_hidden');
                break;
        }
        const optionalArea = document.getElementsByClassName('c_toast01_optionalArea')[0];
        // 任意の要素設定
        if (tag != undefined && tag != '') {
            // 任意の要素をトーストに設定
            optionalArea.innerText = '';
            optionalArea.insertAdjacentHTML('afterbegin', tag);
            // 任意の要素が設定されている場合、old_global向けの処理を行なわないようmessageの値を更新
            message = '';
        }

        // メッセージ(old_globa資源対応)
        if (message != undefined && message != '') {
            // メッセージをトーストに設定
            toast.getElementsByTagName('p')[0].innerText = message;
        }

        // ×アイコン有無
        if (closeIcon != undefined) {
            const close = document.getElementsByClassName('c_iconAndText01_closeIcon')[0];
            // クラス初期化
            close.classList.remove('c_iconAndText01_hidden');
            if (!closeIcon) {
                // ×アイコンなしの場合、非表示
                close.classList.add('c_iconAndText01_hidden');
            }
        }

        // トースト表示（フェードイン）呼び出し
        fadeInToast01(toast);
    }

    // トースト表示（フェードイン）
    function fadeInToast01(toast) {
        //すでにfadeinがある場合は先に一回閉じる
        if (document.getElementsByClassName('c_toast01_fadeIn').length > 0 || document.getElementsByClassName('c_toast01_fadeout').length > 0) {
            const fadeinclass = document.getElementsByClassName('c_toast01_fadeIn')[0];
            const fadeoutclass = document.getElementsByClassName('c_toast01_fadeout')[0];
            if (fadeoutclass != undefined) {
                fadeoutclass.classList.remove('c_toast01_fadeout');
            }
            if (fadeTimeout > 0 && fadeTimeout != undefined) {
                clearTimeout(fadeTimeout);
            }
            if (colorTimeout > 0 && colorTimeout != undefined) {
                clearTimeout(colorTimeout);
            }
            if (fadeinclass != undefined) {
                const fadeOut_toast = fadeinclass.children[0];
                fadeOutToast01(fadeOut_toast);
            }
            setTimeout(function (toast) {
                fadeInExeToast01(toast);
            }, 1500, toast);
        }
        else {
            fadeInExeToast01(toast);
        }
    }
    // フェードイン処理の実処理関数
    function fadeInExeToast01(toast) {
        // トースト表示（フェードイン）
        toast.parentElement.classList.add('c_toast01_fadeIn');
        // メソッド呼び出し時のみ対象とするため、SVGが2種存在しているかで判断
        if (toast.getElementsByClassName('c_iconAndText01_exclamation').length > 0 && toast.getElementsByClassName('c_iconAndText01_success').length > 0) {
            adjustbgcolorToast01(toast);
        }
        else {
            //iOS向け、値設定しないとブロック変数が読み取れないため必ず値を設定する
            colorTimeout = 0;
        }
        //トーストに「c_toast01_manual」のClassが存在しない場合のみ自動フェードアウト処理を実施
        if (!toast.parentElement.classList.contains('c_toast01_manual')) {
            fadeTimeout = setTimeout(function (toast) {
                // トースト非表示（フェードアウト）呼び出し
                fadeOutToast01(toast);
            }, 3000, toast);
        }
        else {
            //iOS向け、値設定しないとブロック変数が読み取れないため必ず値を設定する
            fadeTimeout = 0;
        }
    }
    //トースト背景色の初期化
    function clearColorToast(toast) {
        toast.classList.remove('c_toast01_blue');
        toast.classList.remove('c_toast01_green');
        toast.classList.remove('c_toast01_orange');
        toast.classList.remove('c_toast01_red');
    }
    //連続押下時の色変更を実施するための関数
    function adjustbgcolorToast01(toast) {
        const iconExcl = toast.getElementsByClassName('c_iconAndText01_exclamation')[0];
        const iconSuccess = toast.getElementsByClassName('c_iconAndText01_success')[0];
        // c_toast01_customがなければここで追加しておく
        if (!toast.classList.contains('c_toast01_custom')) {
            toast.classList.add('c_toast01_custom');
        }
        // Successの場合
        if (!iconSuccess.classList.contains('c_iconAndText01_hidden')) {
            //アイコン選択とカラーが異なっている場合の処理を実施
            if (!toast.classList.contains('c_toast01_green')) {
                clearColorToast(toast);
                toast.classList.add('c_toast01_green');
            }
        }
        // Success以外の場合
        else {
            //アイコン選択とカラーが異なっている場合の処理を実施
            if (iconExcl.classList.contains('c_iconAndText01_informative') && !toast.classList.contains('c_toast01_blue')) {
                clearColorToast(toast);
                toast.classList.add('c_toast01_blue');
            }
            if (iconExcl.classList.contains('c_iconAndText01_warning') && !toast.classList.contains('c_toast01_orange')) {
                clearColorToast(toast);
                toast.classList.add('c_toast01_orange');
            }

            if (iconExcl.classList.contains('c_iconAndText01_error') && !toast.classList.contains('c_toast01_red')) {
                clearColorToast(toast);
                toast.classList.add('c_toast01_red');
            }
        }
    }
    // トースト非表示（フェードアウト）
    function fadeOutToast01(toast) {
        // トースト表示（フェードイン）のクラスがある場合は処理を行う
        if (toast.parentElement.classList.contains('c_toast01_fadeIn')) {
            // トースト非表示（フェードアウト）
            toast.parentElement.classList.remove('c_toast01_fadeIn');
            if (!toast.classList.contains('c_toast01_fadeout')) {
                toast.parentElement.classList.add('c_toast01_fadeout');
            }

            colorTimeout = setTimeout(function (toast) {
                // 個別でトーストの種類を指定した場合はトーストの色のクラスをクリアする
                if (toast.classList.contains('c_toast01_custom')) {
                    toast.classList.remove('c_toast01_custom');
                    toast.classList.remove('c_toast01_blue');
                    toast.classList.remove('c_toast01_green');
                    toast.classList.remove('c_toast01_orange');
                    toast.classList.remove('c_toast01_red');
                }
                // トーストが完全に消えたら、busy状態を解除（トースト表示可能状態にする）
                toast.parentElement.classList.remove('c_toast01_fadeout');
            }, 1500, toast);
        }
        else {
            colorTimeout = 0;
        }
    }

    const showToast = document.getElementsByClassName('c_toast01_showToast');

    for (let i = 0; i < showToast.length; i++) {
        //トースト表示部品押下時
        showToast[i].addEventListener('click', function () {
            fadeInToast01(this);
        });
    }

    const closeBtn = document.getElementsByClassName('c_iconAndText01_closeIcon');

    for (let i = 0; i < closeBtn.length; i++) {
        //トーストの×アイコン押下時
        closeBtn[i].addEventListener('click', function () {
            // ×アイコン押下直後にトースト非表示（フェードアウト）
            fadeOutToast01(this.parentElement.parentElement);
        });
        // フォーカス対応
        closeBtn[i].addEventListener('keydown', function (e) {
            // クリックイベントの生成
            if (c_isbrowserIE()) {
                clickEvent = document.createEvent('Event');
                clickEvent.initEvent('click', false, true);
            } else {
                clickEvent = new Event('click');
            }

            // EnterキーもしくはSpace押下で該当項目を選択する
            // keyCode : "13" （Enter）
            if (e.keyCode == "13") {
                this.dispatchEvent(clickEvent);
            }
        });
    }

}

/** コンポーネント：Tooltip **/
if (!document.getElementsByClassName('c_tooltips01').length) {
    //ツールチップがある場合のみ実施
} else {

    c_tooltipSetPosition();

    // テキストエリアの位置設定処理 
    // 画面外にテキストエリアが表示される場合の処理
    function setBalloon() {
        // ツールチップアイコン
        const tooltip = document.getElementsByClassName('c_tooltips01');
        for (let i = 0; i < tooltip.length; i++) {

            // 最小マージン
            const margin = 24;

            // 吹き出しのテキストエリア
            const textArea = tooltip[i].lastElementChild;

            // テキストエリアの座標
            const textAreaRect = textArea.getBoundingClientRect();

            // 画面の横幅
            const screenWidth = document.documentElement.clientWidth;
            let rootfont = document.documentElement.style.fontSize.replace('px', '');
            if (rootfont == '') {
                rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
            }

            // テキストエリアの横幅を取得
            const textAreaWidth = textArea.offsetWidth;

            // テキストエリアのleftを取得
            const leftRect = textAreaRect.left;

            // テキストエリアのrightを取得
            // marginは右側20(32)px分の余白を確保するため
            const rightRect = textAreaRect.right + margin;

            // 吹き出しの取得
            const triangle = textArea.parentElement.getElementsByClassName('c_tooltips01_triangle')[0];

            // 吹き出しの位置を取得
            const trianglePosition = triangle.getBoundingClientRect();

            // 吹き出しの横幅を取得
            const triangleWidth = triangle.offsetWidth;

            // テキストエリアの位置設定
            // 右にはみ出している場合
            // 画面サイズよりテキストエリアのrightの値が大きければ位置を調整
            if (rightRect > screenWidth) {
                // 画面幅より吹き出しのright+margin+8(テキストエリアのradius)が大きい値ならテキストエリアの移動を停止
                if (screenWidth > trianglePosition.right + margin + 8) {
                    // テキストエリアを左に移動
                    // 画面幅 - (margin + テキストエリアの幅)
                    textArea.style.left = (screenWidth - (margin + textAreaWidth)) / rootfont + "rem";
                } else {
                    // 吹き出しからテキストエリアがずれる場合は移動を停止
                    // 吹き出しのleft + 吹き出しの横幅 + テキストエリアのradius - テキストエリアの横幅
                    textArea.style.left = ((trianglePosition.left + triangleWidth + 8) - textAreaWidth) / rootfont + "rem";
                }
            }

            // 左にはみ出している場合 
            // marginの値よりテキストエリアのleftが低い値になったら位置を調整する
            if (margin > leftRect) {

                // 吹き出しからテキストエリアがずれる場合は移動を停止
                // marginの値より吹き出しのleftが低い値ならテキストエリアの移動を停止
                if (margin < trianglePosition.left) {
                    // marginの値を確保して右にずれる
                    textArea.style.left = margin / rootfont + 'rem';
                } else {
                    // 右にずれる位置の限界値を設定
                    //吹き出しの位置-radius（8px）
                    textArea.style.left = (trianglePosition.left - 8) / rootfont + 'rem';
                }
            }
        }
    }

    // 吹き出しの位置設定（上下）
    function c_tooltipSetPosition() {

        // ツールチップ
        const tooltip = document.getElementsByClassName('c_tooltips01');
        for (let i = 0; i < tooltip.length; i++) {
            // 三角
            const triangle = tooltip[i].getElementsByClassName('c_tooltips01_triangle')[0];
            //　テキストエリア
            const textArea = tooltip[i].getElementsByClassName('c_tooltips01_textArea')[0];

            // 表示させるツールチップと紐づくアイコンの位置を取得
            const tooltipIcon = tooltip[i].children[0];
            let tooltipRect;
            if (tooltipIcon.children[0]) {
                tooltipRect = tooltipIcon.children[0].getBoundingClientRect();
            } else {
                tooltipRect = tooltipIcon.getBoundingClientRect();
            }

            // ツールチップアイコンの高さ
            const IconWidth = tooltipRect.width;

            // テキストエリアの横幅を取得
            const textAreaWidth = textArea.offsetWidth;
            // テキストエリアの高さを取得
            const textAreaHeight = textArea.offsetHeight;

            const trianglePosition = triangle.getBoundingClientRect();

            let rootfont = document.documentElement.style.fontSize.replace('px', '');
            if (rootfont == '') {
                rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
            }
            // 吹き出しの高さ
            const trianglHeight = 1.6 * rootfont;

            //  ツールチップのTopを計算
            if (tooltip[i].classList.contains('c_tooltips01_top')) {
                triangle.style.top = tooltipRect.bottom / rootfont + 'rem';
                textArea.style.top = (tooltipRect.bottom + trianglHeight) / rootfont + 'rem';
            } else {
                triangle.style.top = (tooltipRect.top - trianglHeight) / rootfont + 'rem';
                textArea.style.top = (tooltipRect.top - (textAreaHeight + trianglHeight)) / rootfont + 'rem';
            }

            // ツールチップのLeftを計算
            triangle.style.left = (tooltipRect.left + IconWidth / 2 - triangle.offsetWidth / 2) / rootfont + 'rem';
            textArea.style.left = (tooltipRect.left + IconWidth / 2 - textAreaWidth / 2) / rootfont + 'rem';
        }
    }

    // リサイズ時
    window.addEventListener('resize', function () {
        c_tooltipSetPosition();
        setBalloon();
    });

    // スクロール時
    document.addEventListener('scroll', function () {
        c_tooltipSetPosition();
        setBalloon();

        // ツールチップOpen時にスクロールが発生したらツールチップを非表示
        const tooltip = document.getElementsByClassName('c_tooltips01_scrollHidden');
        for (let i = 0; i < tooltip.length; i++) {
            tooltip[i].classList.add('c_tooltips01_hidden');
        }

    });

    const tooltip = document.getElementsByClassName('c_tooltips01_icon');

    // クリックイベント
    for (let i = 0; i < tooltip.length; i++) {
        // ツールチップクリック
        tooltip[i].addEventListener('click', function () {

            c_tooltipSetPosition();
            setBalloon();

            // 2つ目のツールチップがキー操作された時に、それ以外のツールチップを閉じる処理
            for (let j = 0; j < tooltip.length; j++) {
                if (j !== i) {
                    tooltip[j].parentElement.classList.add('c_tooltips01_hidden');
                }
            }

            // 押下されたツールチップの表示・非表示処理
            if (this.parentElement.classList.contains('c_tooltips01_hidden')) {
                this.parentElement.classList.remove('c_tooltips01_hidden');
            } else {
                this.parentElement.classList.add('c_tooltips01_hidden');
            }
        });

        // フォーカス対応
        tooltip[i].addEventListener('keydown', function (e) {
            // クリックイベントの生成
            if (c_isbrowserIE()) {
                clickEvent = document.createEvent('Event');
                clickEvent.initEvent('click', false, true);
            } else {
                clickEvent = new Event('click');
            }

            // Enterキー押下で該当項目を選択する
            // keyCode : "13" （Enter）
            if (e.keyCode == "13") {
                this.dispatchEvent(clickEvent);
            }
        });
    }
}

/** コンポーネント：Radio03 **/
// ラジオボタンの取得
window.addEventListener('DOMContentLoaded', function () {
    const radioList = document.getElementsByClassName('c_radio03');

    for (let i = 0; i < radioList.length; i++) {
        // 該当の要素がdisableならフォーカス不可とする
        if (radioList[i].classList.contains('c_radio03_disabled')) {

            const radioUnit = radioList[i].getElementsByClassName('c_radio03_unit');
            for (let v = 0; v < radioUnit.length; v++) {
                radioUnit[v].children[1].setAttribute('tabindex', '-1');
            }
        }
    }

    const radioUnit = document.getElementsByClassName('c_radio03_unit');
    for (let i = 0; i < radioUnit.length; i++) {
        // キー操作が行われたら処理を実行
        radioUnit[i].children[1].addEventListener('keydown', function (e) {

            // EnterキーもしくはSpace押下で該当項目を選択する
            // keyCode : "13" （Enter）
            // keyCode : "32" （Space）
            if (e.keyCode == "13" || e.keyCode == "32") {
                this.previousElementSibling.checked = true;

                // チェンジイベントの発行
                let changeEvent;
                let clickEvent;
                if (c_isbrowserIE()) {
                    // IE
                    changeEvent = document.createEvent('Event');
                    changeEvent.initEvent('change', false, false);
                    clickEvent = document.createEvent('Event');
                    clickEvent.initEvent('click', false, false);
                } else {
                    // IE以外
                    changeEvent = new Event('change');
                    clickEvent = new Event('click');
                }

                if (!this.parentElement.classList.contains('c_radio03_opActive')) {
                    this.previousElementSibling.dispatchEvent(changeEvent);
                }
                this.previousElementSibling.dispatchEvent(clickEvent);
            }
        });
    }
})


/** コンポーネント：CheckBox01 **/
// チェックボックスの取得
window.addEventListener('DOMContentLoaded', function () {
    const checkBoxList = document.getElementsByClassName('c_checkBox01');

    for (let i = 0; i < checkBoxList.length; i++) {

        if (checkBoxList[i].classList.contains('c_checkBox01_disabled')) {
            // 該当の要素がdisableならフォーカス不可とする
            const checkBoxUnit = checkBoxList[i].getElementsByClassName('c_checkBox01_checkBox');
            for (let v = 0; v < checkBoxUnit.length; v++) {
                checkBoxUnit[v].children[1].setAttribute('tabindex', '-1');
            }
        }
    }

    const checkBoxUnit = document.getElementsByClassName('c_checkBox01_checkBox');
    for (let i = 0; i < checkBoxUnit.length; i++) {
        // キー操作が行われたら処理を実行
        checkBoxUnit[i].children[1].addEventListener('keydown', function (e) {

            // EnterキーもしくはSpace押下で該当項目を選択する
            // keyCode : "13" （Enter）
            // keyCode : "32" （Space）
            if (e.keyCode == "13" || e.keyCode == "32") {

                // チェックボックスのつけ外し
                if (this.previousElementSibling.checked == true) {
                    this.previousElementSibling.checked = false;
                } else {
                    this.previousElementSibling.checked = true;
                }

                // チェンジイベントの発行
                let changeEvent;
                if (c_isbrowserIE()) {
                    // IE
                    changeEvent = document.createEvent('Event');
                    changeEvent.initEvent('change', false, false);
                } else {
                    // IE以外
                    changeEvent = new Event('change');
                }
                this.previousElementSibling.dispatchEvent(changeEvent);
            }
        });
    }
})

// 以下はシステムパーツ集（storybook）未掲載またはold_global部品
/** コンポーネント：チェックボックスボタン **/
if (!document.getElementsByClassName('c_checkBoxBtn').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    // c_checkBox_jdgを取得する
    const checkjdg = document.getElementsByClassName('c_checkBox_jdg');
    for (let i = 0; i < checkjdg.length; i++) {
        checkjdg[i].addEventListener('change', function () {
            // c_checkBoxBtn内のc_button01を取得する
            const chkBoxBtn = this.parentElement.parentElement.getElementsByClassName('c_button01')[0];
            if (this.checked === true) {
                // ボタンが活性の場合
                chkBoxBtn.classList.remove('c_button01_disabled');
            } else {
                // ボタンが非活性の場合
                chkBoxBtn.classList.add('c_button01_disabled');
            }
        });
    }
}

/** コンポーネント：DotCarousel **/
if (!document.getElementsByClassName('c_dotCarousel_view').length) {
    // 該当の要素がない場合は処理を行わない
} else {

    let dots = document.getElementsByClassName('c_dotCarousel_dots');
    //どのドットが押下されたかの判定し左スクロールもしくは右スクロール
    for (let i = 0; i < dots.length; i++) {
        //どのドットが押下されたかの情報を持ってdotDistanceに飛ばす
        dots[i].addEventListener('click', function () {
            let dotList = this.parentElement.children;
            let cntThis;
            let cntAc;

            for (let i = 0; i < dotList.length; i++) {
                if (dotList[i] == this) {
                    //押下されたドットのインデックス数習得
                    cntThis = i;
                }
                if (dotList[i].classList.contains('c_dotCarousel_dotActive') == true) {
                    //現在アクティブなドットのインデックス数習得
                    cntAc = i;
                }
            }
            //押されたドットがアクティブドットより右に位置する場合は右→左にスクロール
            //押されたドットがアクティブドットより左に位置する場合は左→右にスクロール
            if (cntThis > cntAc) {
                //右スクロール処理に遷移
                rightToLeft(this.parentElement.parentElement.getElementsByClassName('c_dotCarousel_view')[0], cntThis);
            } else if (cntThis < cntAc) {
                //左スクロール処理に遷移
                leftToRight(this.parentElement.parentElement.getElementsByClassName('c_dotCarousel_view')[0], cntThis);
            }
        })
    }


    //タッチスライド、クリックスライドができる範囲
    let touchArea = document.getElementsByClassName('c_dotCarousel_view');
    let startX;               //タッチ開始　X座標
    let clickstartX;		  //クリック開始　X座標
    let moveX;                //スワイプ中のX座標
    let clickmoveX;		  	  //クリック中の　X座標
    let dist = 30             //スワイプを感知する最低距離（ピクセル単位）

    for (let i = 0; i < touchArea.length; i++) {

        // タッチ開始時：xy座標を取得
        touchArea[i].addEventListener('touchstart', function (e) {
            //デフォルトの動作をキャンセル
            e.preventDefault();
            startX = e.changedTouches[0].pageX;
            setTimeout(function (e) { }, 1000);
        });

        //クリック開始時：xy座標を取得
        touchArea[i].addEventListener('mousedown', function (e) {
            //デフォルトの動作をキャンセル
            e.preventDefault();
            if (e.buttons == 1) {
                clickstartX = e.pageX;
                setTimeout(function (e) { }, 1000);
            }
            else {
                return false;
            }
        });

        // スワイプ開始時：xy座標を取得
        touchArea[i].addEventListener('touchmove', function (e) {
            //デフォルトの動作をキャンセル
            e.preventDefault();
            moveX = e.changedTouches[0].pageX;
            setTimeout(function (e) { }, 1000);
        });


        //スワイプ中: xy座標の取得
        touchArea[i].addEventListener('touchend', function (e) {
            //デフォルトの動作をキャンセル
            e.preventDefault();

            if (startX > moveX && startX > moveX + dist) {
                rightToLeft(this, -1);
            }
            else if (startX < moveX && startX + dist < moveX) {
                leftToRight(this, -1);
            }
            moveX = undefined;//初期化
        });

        //クリックスワイプ中: xy座標の取得
        touchArea[i].addEventListener('mouseup', function (e) {
            //デフォルトの動作をキャンセル
            e.preventDefault();
            clickmoveX = e.pageX;

            if (clickstartX > clickmoveX && clickstartX > clickmoveX + dist) {
                //IE対応為、thisでスライドするエリアの情報を送る
                rightToLeft(this, -1);
            }
            else if (clickstartX < clickmoveX && clickstartX + dist < clickmoveX) {
                //IE対応為、thisでスライドするエリアの情報を送る
                leftToRight(this, -1);
            }
            clickmoveX = undefined; //初期化
        });
    }

    //左から右にスクロール処理
    function leftToRight(targetElement, targetIndex) {
        const sliderList = targetElement.getElementsByClassName('c_dotCarousel_list');
        //transition中ならば処理しない
        if ((!targetElement.classList.contains('isMove1')) && (!targetElement.classList.contains('isMove2'))) {
            for (let i = 0; i < sliderList.length; i++) {
                //現在アクティブなスライドの特定
                if (sliderList[i].classList.contains('c_dotCarousel_active')) {
                    //現在アクティブなスライドが左端か判定
                    if (!i == 0) {

                        //transition終了時のイベントを登録する（その１）
                        sliderList[i].addEventListener('transitionend', tranEnd1);

                        //transitionen中のフラグを設定
                        targetElement.classList.add('isMove1');
                        targetElement.classList.add('isMove2');

                        //アクティブスライドを右にスライドする
                        sliderList[i].classList.add('c_dotCarousel_ActiveToRight');

                        //スワイプでのスライドか、ドットクリックでのスワイプか
                        if (targetIndex == -1) {

                            //transition終了時のイベントを登録する（その２）
                            sliderList[i - 1].addEventListener('transitionend', tranEnd2);
                            //アクティブスライドから左隣のスライドをアクティブに設定
                            sliderList[i - 1].classList.add('c_dotCarousel_moveAc');

                        } else {
                            //transition終了時のイベントを登録する（その２）
                            sliderList[targetIndex].addEventListener('transitionend', tranEnd2);
                            //押下されたドットの該当の箇所のスライドをアクティブに設定
                            sliderList[targetIndex].classList.add('c_dotCarousel_moveAc');
                        }
                        break;
                    }
                }
            }
        }
    }

    //右から左にスクロール処理
    function rightToLeft(targetElement, targetIndex) {
        const sliderList = targetElement.getElementsByClassName('c_dotCarousel_list')
        //アニメーション中のフラグがあるか確認
        if ((!targetElement.classList.contains('isMove1')) && (!targetElement.classList.contains('isMove2'))) {
            for (let i = 0; i < sliderList.length; i++) {
                //現在アクティブなスライドの特定
                if (sliderList[i].classList.contains('c_dotCarousel_active')) {
                    if (i != sliderList.length - 1) {

                        //transitionenが終わった場合処理を飛ばす
                        sliderList[i].addEventListener('transitionend', tranEnd1);

                        targetElement.classList.add('isMove1');
                        targetElement.classList.add('isMove2');

                        //アクティブスライドを左にスライドする
                        sliderList[i].classList.add('c_dotCarousel_ActiveToleft');

                        //スワイプでのスライドか、ドットクリックでのスワイプか
                        if (targetIndex == -1) {
                            sliderList[i + 1].addEventListener('transitionend', tranEnd3);
                            //アクティブスライドから右隣のスライドをアクティブに設定
                            sliderList[i + 1].classList.add('c_dotCarousel_moveAc');

                        } else {
                            sliderList[targetIndex].addEventListener('transitionend', tranEnd3);
                            //押下されたドットの該当の箇所のスライドをアクティブに設定
                            sliderList[targetIndex].classList.add('c_dotCarousel_moveAc');
                        }
                        break;
                    }
                }
            }
        }
    }

    //transition終了時　旧アクティブスライドの設定　transitionを削除
    function tranEnd1() {
        //transitionを設定しているクラスを削除
        if (this.classList.contains('c_dotCarousel_ActiveToleft')) {
            this.classList.add('c_dotCarousel_left');
            this.classList.remove('c_dotCarousel_ActiveToleft');
        }
        else if (this.classList.contains('c_dotCarousel_ActiveToRight')) {
            this.classList.add('c_dotCarousel_right');
            this.classList.remove('c_dotCarousel_ActiveToRight');
        }

        //アクティブの設定を削除
        this.classList.remove('c_dotCarousel_active');
        this.parentElement.parentElement.classList.remove('isMove1');
        //transitionendのイベントを削除
        this.removeEventListener('transitionend', tranEnd1);
    }

    //transition終了時　右からスライドした新規アクティブスライドの設定　transitionを削除
    function tranEnd2() {

        let sliderList = this.parentElement.children;
        this.classList.remove('c_dotCarousel_left');
        this.classList.add('c_dotCarousel_active');
        this.classList.remove('c_dotCarousel_moveAc');

        let flgRight = false;//アクティブスライドか判定用のFlg

        //押下されたドットよりに左に位置するスライドを全て左に配置する
        for (let i = 0; i < sliderList.length; i++) {
            if (sliderList[i] == this) {
                flgRight = true;
            } else if (flgRight) {
                //tranEnd1でもやっていることをあえて実施（ｄｏｔ処理での予期せぬ動きがあるため）
                sliderList[i].classList.add('c_dotCarousel_right');
                sliderList[i].classList.remove('c_dotCarousel_left');
                sliderList[i].classList.remove('c_dotCarousel_active');
            } else {
                sliderList[i].classList.add('c_dotCarousel_left');
                sliderList[i].classList.remove('c_dotCarousel_right');
                sliderList[i].classList.remove('c_dotCarousel_active');
            }
        }

        this.parentElement.parentElement.classList.remove('isMove2');
        this.removeEventListener('transitionend', tranEnd2);
        dotMove(this);
    }

    //transition終了時　左からスライドした新規アクティブスライドの設定　transitionを削除
    function tranEnd3() {

        const sliderList = this.parentElement.children;
        this.classList.remove('c_dotCarousel_right');
        this.classList.add('c_dotCarousel_active');
        this.classList.remove('c_dotCarousel_moveAc');

        let flgRight = false;//アクティブスライドか判定用のFlg

        //押下されたドットよりに左に位置するスライドを全て左に配置する
        for (let i = 0; i < sliderList.length; i++) {
            if (sliderList[i] == this) {
                flgRight = true;
            } else if (flgRight) {
                //tranEnd1でもやっていることをあえて実施（ｄｏｔ処理での予期せぬ動きがあるため）
                sliderList[i].classList.add('c_dotCarousel_right');
                sliderList[i].classList.remove('c_dotCarousel_left');
                sliderList[i].classList.remove('c_dotCarousel_active');
            } else {
                sliderList[i].classList.add('c_dotCarousel_left');
                sliderList[i].classList.remove('c_dotCarousel_right');
                sliderList[i].classList.remove('c_dotCarousel_active');
            }
        }

        //transitionフラグを削除
        this.parentElement.parentElement.classList.remove('isMove2');
        //transitionendのイベントを削除
        this.removeEventListener('transitionend', tranEnd3);
        dotMove(this);
    }

    //ActiveスライドとActiveドットの平仄を合わせる
    function dotMove(acSlide) {
        let sliderList = acSlide.parentElement.children;
        let dots = acSlide.parentElement.parentElement.parentElement.getElementsByClassName('c_dotCarousel_dots');

        for (let i = 0; i < sliderList.length; i++) {
            // Activeスライドのindex数に合わせてActiveドットを設定する
            if (sliderList[i].classList.contains('c_dotCarousel_active')) {
                dots[i].classList.add('c_dotCarousel_dotActive');
            } else {
                //アクティブドットの削除
                dots[i].classList.remove('c_dotCarousel_dotActive');
            }
        }
    }
}

/** コンポーネント：アローカルーセル **/
if (!document.getElementsByClassName('c_arrowCarousel').length) {
} else {
    // 対象のhtmlCollectionから指定したクラス名を持つ要素の最初のindexを返却する処理
    function getIndexByClass(targetList, targetClass) {
        let returnIndex;
        for (let i = 0; i < targetList.length; i++) {
            if (targetList[i].classList.contains(targetClass)) {
                returnIndex = i;
                break;
            }
        }
        return returnIndex;
    }

    // datasetのtargetIdを照合してコンテンツを切り替える処理
    function changeContent(targetContents, targetId, activeClassName) {
        for (let i = 0; i < targetContents.length; i++) {
            if (targetId == targetContents[i].dataset.target_id) {
                targetContents[i].classList.add(activeClassName);
            } else {
                targetContents[i].classList.remove(activeClassName);
            }
        }
    }

    // 矢印アイコンの活性非活性を設定する
    function setDisableArrowIcon(listLength, activeIndex, targetIconLeft, targetIconRight, disableClass) {
        if (activeIndex == 0) {
            // アクティブ要素が一番左にある時
            targetIconLeft.classList.add(disableClass);
        } else {
            targetIconLeft.classList.remove(disableClass);
        }
        if (activeIndex == listLength - 1) {
            // アクティブ要素が一番右にある時
            targetIconRight.classList.add(disableClass);
        } else {
            targetIconRight.classList.remove(disableClass);
        }
    }

    // 左の要素を右にスライド
    function moveLeftToRight(carouselArea) {
        // 子要素のitemリストを取得
        const carouselListItems = carouselArea.getElementsByClassName('c_arrowCarousel_item');
        // active要素のインデックスを取得
        const activeIndex = getIndexByClass(carouselListItems, 'c_arrowCarousel_active');
        // active要素のindexが一番左なら移動せずに処理終了
        if (activeIndex == 0) {
            return;
        }

        /*
        ■カルーセル移動処理
        active要素の3つ左の要素から順にクラスを付け替えて一つ一つ右に移動
        */
        // 場所ごとにクラス置換 ※classlistのreplaceがIE非対応のため、classNameをreplaceして文字列ごと置き換え
        // ３つ左（外側）の要素を２つ左に移動
        if (activeIndex - 3 >= 0) { carouselListItems[activeIndex - 3].className = carouselListItems[activeIndex - 3].className.replace('c_arrowCarousel_left-out', 'c_arrowCarousel_left-left') };
        // ２つ左の要素を１つ左に移動
        if (activeIndex - 2 >= 0) { carouselListItems[activeIndex - 2].className = carouselListItems[activeIndex - 2].className.replace('c_arrowCarousel_left-left', 'c_arrowCarousel_left') };
        // １つ左の要素をactiveに移動
        if (activeIndex - 1 >= 0) { carouselListItems[activeIndex - 1].className = carouselListItems[activeIndex - 1].className.replace('c_arrowCarousel_left', 'c_arrowCarousel_active') };
        // active要素を右に移動
        carouselListItems[activeIndex].className = carouselListItems[activeIndex].className.replace('c_arrowCarousel_active', 'c_arrowCarousel_right');
        // １つ右の要素を２つ右に移動
        if (activeIndex + 1 < carouselListItems.length) { carouselListItems[activeIndex + 1].className = carouselListItems[activeIndex + 1].className.replace('c_arrowCarousel_right', 'c_arrowCarousel_right-right') };
        // ２つ右の要素を３つ右（外側）に移動
        if (activeIndex + 2 < carouselListItems.length) { carouselListItems[activeIndex + 2].className = carouselListItems[activeIndex + 2].className.replace('c_arrowCarousel_right-right', 'c_arrowCarousel_right-out') };

        // 矢印アイコンの活性非活性切り替え
        setDisableArrowIcon(carouselListItems.length, activeIndex - 1,
            carouselArea.getElementsByClassName('c_arrowCarousel_arrowLeft')[0],
            carouselArea.getElementsByClassName('c_arrowCarousel_arrowRight')[0],
            'c_arrowCarousel_arrow_disable');

        // コンテンツを切り替え
        const targetContents = carouselArea.nextElementSibling.getElementsByClassName('c_arrowCarousel_content');
        changeContent(targetContents, carouselListItems[activeIndex - 1].dataset.target_id, 'c_arrowCarousel_content_active');
    }

    // 右の要素を左にスライド
    function moveRightToLeft(carouselArea) {
        // 子要素のitemリストを取得
        const carouselListItems = carouselArea.getElementsByClassName('c_arrowCarousel_item');
        // active要素のインデックスを取得
        const activeIndex = getIndexByClass(carouselListItems, 'c_arrowCarousel_active');
        // active要素のindexが一番右なら移動せずに処理終了
        if (activeIndex >= carouselListItems.length - 1) {
            return;
        }
        /*
        ■カルーセル移動処理
        active要素の3つ右の要素から順にクラスを付け替えて一つ一つ左に移動
        */
        // 場所ごとにクラス置換 ※classlistのreplaceがIE非対応のため、classNameをreplaceして文字列ごと置き換え
        // ３つ右（外側）の要素を２つ右に移動
        if (activeIndex + 3 < carouselListItems.length) { carouselListItems[activeIndex + 3].className = carouselListItems[activeIndex + 3].className.replace('c_arrowCarousel_right-out', 'c_arrowCarousel_right-right') };
        // ２つ右の要素を１つ右に移動
        if (activeIndex + 2 < carouselListItems.length) { carouselListItems[activeIndex + 2].className = carouselListItems[activeIndex + 2].className.replace('c_arrowCarousel_right-right', 'c_arrowCarousel_right') };
        // １つ左の要素をactiveに移動
        if (activeIndex + 1 < carouselListItems.length) { carouselListItems[activeIndex + 1].className = carouselListItems[activeIndex + 1].className.replace('c_arrowCarousel_right', 'c_arrowCarousel_active') };
        // active要素を左に移動
        carouselListItems[activeIndex].className = carouselListItems[activeIndex].className.replace('c_arrowCarousel_active', 'c_arrowCarousel_left');
        // １つ左の要素を２つ左に移動
        if (activeIndex - 1 >= 0) { carouselListItems[activeIndex - 1].className = carouselListItems[activeIndex - 1].className.replace('c_arrowCarousel_left', 'c_arrowCarousel_left-left') };
        // ２つ左の要素を３つ左に移動
        if (activeIndex - 2 >= 0) { carouselListItems[activeIndex - 2].className = carouselListItems[activeIndex - 2].className.replace('c_arrowCarousel_left-left', 'c_arrowCarousel_left-out') };

        // 矢印アイコンの活性非活性切り替え
        setDisableArrowIcon(carouselListItems.length, activeIndex + 1,
            carouselArea.getElementsByClassName('c_arrowCarousel_arrowLeft')[0],
            carouselArea.getElementsByClassName('c_arrowCarousel_arrowRight')[0],
            'c_arrowCarousel_arrow_disable');

        // コンテンツを切り替え
        const targetContents = carouselArea.nextElementSibling.getElementsByClassName('c_arrowCarousel_content');
        changeContent(targetContents, carouselListItems[activeIndex + 1].dataset.target_id, 'c_arrowCarousel_content_active');
    }

    // 矢印アイコンにイベント登録
    const arrowLefts = document.getElementsByClassName('c_arrowCarousel_arrowLeft')
    for (let i = 0; i < arrowLefts.length; i++) {
        arrowLefts[i].addEventListener('click', function () {
            // c_arrowCarousel_areaを引数にする
            moveLeftToRight(this.parentElement.parentElement);
        })
    };
    const arrowRights = document.getElementsByClassName('c_arrowCarousel_arrowRight')
    for (let i = 0; i < arrowRights.length; i++) {
        arrowRights[i].addEventListener('click', function () {
            // c_arrowCarousel_areaを引数にする
            moveRightToLeft(this.parentElement.parentElement);
        })
    };

    // 画面表示時の初期設定
    function setInitCarousel() {
        // active要素の前後にクラス付与
        const carousels = document.getElementsByClassName('c_arrowCarousel');
        for (let i = 0; i < carousels.length; i++) {
            // carouselItemsを取得
            const carouselListItems = carousels[i].getElementsByClassName('c_arrowCarousel_item');
            // activeのindex取得
            const activeIndex = getIndexByClass(carouselListItems, 'c_arrowCarousel_active');
            // active前後の要素にクラス付与
            for (let i = 0; i < carouselListItems.length; i++) {
                if (i < activeIndex - 2) { carouselListItems[i].classList.add('c_arrowCarousel_left-out'); };
                if (i == activeIndex - 2) { carouselListItems[i].classList.add('c_arrowCarousel_left-left'); };
                if (i == activeIndex - 1) { carouselListItems[i].classList.add('c_arrowCarousel_left'); };
                if (i == activeIndex + 1) { carouselListItems[i].classList.add('c_arrowCarousel_right'); };
                if (i == activeIndex + 2) { carouselListItems[i].classList.add('c_arrowCarousel_right-right'); };
                if (i > activeIndex + 2) { carouselListItems[i].classList.add('c_arrowCarousel_right-out'); };
            }

            // 矢印アイコンの活性非活性切り替え
            setDisableArrowIcon(carouselListItems.length, activeIndex,
                carousels[i].getElementsByClassName('c_arrowCarousel_arrowLeft')[0],
                carousels[i].getElementsByClassName('c_arrowCarousel_arrowRight')[0],
                'c_arrowCarousel_arrow_disable');

            // active要素に該当するコンテンツをactiveにする
            const carouselContents = carousels[i].getElementsByClassName('c_arrowCarousel_content');
            for (let i = 0; i < carouselContents.length; i++) {
                if (carouselContents[i].dataset.target_id == carouselListItems[activeIndex].dataset.target_id) {
                    carouselContents[i].classList.add('c_arrowCarousel_content_active');
                    break;
                }
            }
        }
    }
    // DomContentloadedに処理登録
    window.addEventListener('DOMContentLoaded', setInitCarousel);

    //タッチスライド、クリックスライドができる範囲
    const touchArea = document.getElementsByClassName('c_arrowCarousel_area');
    let startX;               //タッチ開始　X座標
    let clickstartX;		  //クリック開始　X座標
    let moveX;                //スワイプ中のX座標
    let clickmoveX;		  	  //クリック中の　X座標
    let dist = 30             //スワイプを感知する最低距離（ピクセル単位）

    for (let i = 0; i < touchArea.length; i++) {

        // タッチ開始時：xy座標を取得
        touchArea[i].addEventListener('touchstart', function (e) {
            //デフォルトの動作をキャンセル
            e.stopPropagation();
            startX = e.changedTouches[0].pageX;
            setTimeout(function (e) { }, 1000);
        });

        //クリック開始時：xy座標を取得
        touchArea[i].addEventListener('mousedown', function (e) {
            //デフォルトの動作をキャンセル
            e.stopPropagation();
            if (e.buttons == 1) {
                clickstartX = e.pageX;
                setTimeout(function (e) { }, 1000);
            }
            else {
                return false;
            }
        });

        // スワイプ開始時：xy座標を取得
        touchArea[i].addEventListener('touchmove', function (e) {
            //デフォルトの動作をキャンセル
            e.preventDefault();
            moveX = e.changedTouches[0].pageX;
            setTimeout(function (e) { }, 1000);
        });

        //スワイプ中: xy座標の取得
        touchArea[i].addEventListener('touchend', function (e) {
            //デフォルトの動作をキャンセル
            e.stopPropagation();

            if (startX > moveX && startX > moveX + dist) {
                moveRightToLeft(this);
            }
            else if (startX < moveX && startX + dist < moveX) {
                moveLeftToRight(this);
            }
            moveX = undefined;//初期化
        });

        //クリックスワイプ中: xy座標の取得
        touchArea[i].addEventListener('mouseup', function (e) {
            //デフォルトの動作をキャンセル
            e.stopPropagation();
            clickmoveX = e.pageX;

            if (clickstartX > clickmoveX && clickstartX > clickmoveX + dist) {
                //IE対応為、thisでスライドするエリアの情報を送る
                moveRightToLeft(this);
            }
            else if (clickstartX < clickmoveX && clickstartX + dist < clickmoveX) {
                //IE対応為、thisでスライドするエリアの情報を送る
                moveLeftToRight(this);
            }
            clickmoveX = undefined; //初期化
        });
    }
}

/** コンポーネント：クーポン **/
if (!document.getElementsByClassName('c_coupon01').length) {
} else {
    const textArea = document.getElementsByClassName('c_coupon01_textArea');

    for (let i = 0; i < textArea.length; i++) {

        textArea[i].addEventListener('click', function () {
            const clipword = this.getElementsByClassName('c_coupon01_typo_main')[0].innerText;
            if (navigator.clipboard == undefined) {
                // IEの場合は以下で処理
                window.clipboardData.setData('Text', clipword.trim());
            } else {
                // IE以外の場合は以下で処理
                navigator.clipboard.writeText(clipword);
            }
        });
    }
}

/** コンポーネント：Radio **/
// ラジオボタン（エラー時）
if (!document.getElementsByClassName('c_radio').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    const errorflag = document.getElementsByClassName('c_radio');
    for (let i = 0; i < errorflag.length; i++) {
        const radiobtn = errorflag[i].getElementsByClassName('c_radio_input');
        for (let j = 0; j < radiobtn.length; j++) {
            radiobtn[j].addEventListener('click', function () {
                this.parentElement.parentElement.classList.remove('c_radio_errorFlag');
            })
        }
    };
}

/** コンポーネント：Floating01 Menu **/
if (!document.getElementsByClassName('c_floating01').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    document.addEventListener('DOMContentLoaded', function () {

        // 入力ボタン押下時のイベント
        const btn = document.getElementsByClassName('c_floating01_btn')[0];
        btn.addEventListener('click', function () {
            if (this.parentElement.classList.contains('c_floating01_show')) {
                this.parentElement.classList.remove('c_floating01_show');
            } else {
                this.parentElement.classList.add('c_floating01_show');
            }

            // リストの取得
            const ul = document.getElementsByClassName(('c_floating01_list'))[0];

            // ルートフォントの取得
            let rootfont = document.documentElement.style.fontSize.replace('px', '');
            if (rootfont == '') {
                rootfont = getComputedStyle(document.documentElement).fontSize.replace('px', '');
            }

            // リストの行数が9行以上であればリスト内でスクロールさせる
            if (ul.children.length > 8) {
                let contentHeight = 0;
                // 各リストの高さを取得してリストボックスの高さを設定
                for (let i = 0; 8 > i; i++) {
                    contentHeight = contentHeight + ul.children[i].clientHeight;
                }
                ul.style.height = contentHeight / rootfont + "rem";
            }
        });

        // 画面外エリア押下時のイベント
        const out = document.getElementsByClassName('c_floating01_outSideClose')[0];
        out.addEventListener('click', function () {
            if (this.parentElement.classList.contains('c_floating01_show')) {
                this.parentElement.classList.remove('c_floating01_show');
            }
        });

        // リストボックスOpen時にスクロールが発生したらリストボックスを非表示
        document.addEventListener('scroll', function () {
            const listBox = document.getElementsByClassName('c_floating01');
            for (let i = 0; i < listBox.length; i++) {
                if (listBox[i].children[0].classList.contains('c_floating01_show')) {
                    listBox[i].children[0].classList.remove('c_floating01_show');
                }
            }
        });

        // フォーカス対応
        btn.addEventListener('keydown', function (e) {
            let clickEvent;
            // クリックイベントの生成
            if (c_isbrowserIE()) {
                clickEvent = document.createEvent('Event');
                clickEvent.initEvent('click', false, false);
            } else {
                clickEvent = new Event('click');
            }

            // keyCode : "13" （Enter）
            if (e.keyCode == "13") {
                this.dispatchEvent(clickEvent);
            }
        });
    });
}

/** コンポーネント：toggle01 **/
if (!document.getElementsByClassName('c_toggle01').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    window.addEventListener('DOMContentLoaded', function () {

        // トグルの取得
        const toggleList = document.getElementsByClassName('c_toggle01');
        for (let i = 0; i < toggleList.length; i++) {
            // label要素の取得
            let labelArea = toggleList[i].children[2];
            // テキストが右側の場合
            if (labelArea.className !== 'c_toggle01_label') {
                labelArea = toggleList[i].children[1];
            }
            // キー操作が行われたら処理を実行
            labelArea.addEventListener('keydown', function (e) {
                // Enterキー押下で該当項目を選択する
                // keyCode : '13' （Enter）
                if (e.keyCode == '13') {
                    // チェックのつけ外し
                    if (this.previousElementSibling.checked == true) {
                        this.previousElementSibling.checked = false;
                    } else {
                        this.previousElementSibling.checked = true;
                    }
                    // チェンジイベントの発行
                    let changeEvent;
                    if (c_isbrowserIE()) {
                        // IE
                        changeEvent = document.createEvent('Event');
                        changeEvent.initEvent('change', false, false);
                    } else {
                        // IE以外
                        changeEvent = new Event('change');
                    }
                    this.previousElementSibling.dispatchEvent(changeEvent);
                }
            });
        }
    })
}

/** コンポーネント：pager **/
if (!document.getElementsByClassName('c_pager').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    window.addEventListener('DOMContentLoaded', c_pager_disfocus);

    function c_pager_disfocus() {
        const pager = document.getElementsByClassName('c_pager');
        for (let i = 0; pager.length > i; i++) {
            const pagerArea = pager[i].children;
            for (let c = 0; pagerArea.length > c; c++) {
                // 一度tabindexを削除する
                pagerArea[c].children[0].removeAttribute('tabindex');
                // 該当要素がdisabledもしくはドットならフォーカスを無効
                if (pagerArea[c].classList.contains('c_pager_disabled') || pagerArea[c].classList.contains('c_pager_typo_omission')) {
                    pagerArea[c].children[0].setAttribute('tabindex', '-1');
                }
            }
        }
    }
    // ページャーの表示制御
    // 第1引数（activepage）：アクティブなページ番号、数値で指定
    // 第2引数（totalpage）：総ページ数、数値で指定
    // 第3引数（targetid）：対象となるPagerのID（c_pagerクラスのあるタグが対象）、文字列で指定、未指定の場合は最初に定義されているpagerを対象とする
    // 第4引数（singlePageDisp）：単ページの場合にpagerを表示するかを指定、true/falseで指定、未指定の場合は表示（true）
    function c_pager_transition(activepage, totalpage, targetid, singlePageDisp) {
        let pagerSection;
        // 第3引数の有無で取得するpagerを切り替える
        if (targetid == undefined || targetid == '') {
            pagerSection = document.getElementsByClassName('c_pager')[0];
        }
        else {
            pagerSection = document.getElementById(targetid);
        }
        pagerSection.classList.remove('c_pager_none');
        const Firstpage = 1;
        const LastPage = totalpage;
        // アクティブページの初期化（c_pager_disabledの削除）
        const pagerArea = pagerSection.getElementsByClassName('c_pager_area');
        for (let i = 0; i < pagerArea.length; i++) {
            pagerArea[i].classList.remove('c_pager_disabled');
            pagerArea[i].classList.remove('c_pager_none');
        }
        // ページャーの表示対象の選定
        // 末尾ページを設定
        pagerArea[7].getElementsByTagName('p')[0].innerText = totalpage;
        // activepageが1の位置により判定
        switch (activepage) {
            case 1:
            case 2:
            case 3:
                if (activepage == 1) {
                    // 左矢印と1ページ目（pageAreaの0,1）をグレーアウト
                    pagerArea[0].classList.add('c_pager_disabled');
                    pagerArea[1].classList.add('c_pager_disabled');
                    // 1ページの時のみテキストの設定が異なる
                    pagerArea[3].getElementsByTagName('p')[0].innerText = Firstpage + 1;
                    pagerArea[4].getElementsByTagName('p')[0].innerText = Firstpage + 2;
                    pagerArea[5].getElementsByTagName('p')[0].innerText = Firstpage + 3;
                }
                else {
                    // 3つ目の数字（pageAreaの4）をグレーアウト
                    pagerArea[4].classList.add('c_pager_disabled');
                    // 1ページ目がアクティブ以外はactivePage-1,activepage,activepage+1を設定
                    pagerArea[3].getElementsByTagName('p')[0].innerText = activepage - 1;
                    pagerArea[4].getElementsByTagName('p')[0].innerText = activepage;
                    pagerArea[5].getElementsByTagName('p')[0].innerText = activepage + 1;
                }

                // 非表示にするタグ設定
                pagerArea[2].classList.add('c_pager_none');
                if (activepage == 2) {
                    // ページ数によって表示するものを決める(pageAreaの2,3を非表示)
                    pagerArea[3].classList.add('c_pager_none');

                }
                else {
                    // ページ数によって表示するものを決める(pageAreaの2,5を非表示)
                    pagerArea[5].classList.add('c_pager_none');
                }
                break;
            case totalpage - 2:
            case totalpage - 1:
            case totalpage:
                // アクティブページの設定
                if (activepage == totalpage) {
                    // 右矢印（pageAreaの8）と末尾数字（pageAreaの7）
                    pagerArea[8].classList.add('c_pager_disabled');
                    pagerArea[7].classList.add('c_pager_disabled');
                    // 末尾ページの時のみテキストの設定が異なる
                    pagerArea[3].getElementsByTagName('p')[0].innerText = LastPage - 3;
                    pagerArea[4].getElementsByTagName('p')[0].innerText = LastPage - 2;
                    pagerArea[5].getElementsByTagName('p')[0].innerText = LastPage - 1;
                }
                else {
                    // 3つ目の数字（pageAreaの4）をグレーアウト
                    pagerArea[4].classList.add('c_pager_disabled');
                    // 末尾ページ目がアクティブ以外はactivePage-1,activepage,activepage+1を設定
                    pagerArea[3].getElementsByTagName('p')[0].innerText = activepage - 1;
                    pagerArea[4].getElementsByTagName('p')[0].innerText = activepage;
                    pagerArea[5].getElementsByTagName('p')[0].innerText = activepage + 1;
                }
                // 非表示にするタグ設定
                pagerArea[6].classList.add('c_pager_none');
                if (activepage == (totalpage - 1)) {
                    // ページ数によって表示するものを決める(pageAreaの5,6を非表示)
                    pagerArea[5].classList.add('c_pager_none');
                }
                else {
                    // ページ数によって表示するものを決める(pageAreaの3,6を非表示)
                    pagerArea[3].classList.add('c_pager_none');
                }
                break;
            default:
                // アクティブページの設定
                // 3つ目の数字（pageAreaの4）をグレーアウト
                pagerArea[4].classList.add('c_pager_disabled');
                // 通常時はactivePage-1,activepage,activepage+1を設定
                pagerArea[3].getElementsByTagName('p')[0].innerText = activepage - 1;
                pagerArea[4].getElementsByTagName('p')[0].innerText = activepage;
                pagerArea[5].getElementsByTagName('p')[0].innerText = activepage + 1;
        }
        // 総件数が5ページ以内の制御
        if (totalpage <= 5) {
            // 「・・・」の要素（pagerAreaの2,6）は非表示
            if (!pagerArea[2].classList.contains('c_pager_none')) {
                pagerArea[2].classList.add('c_pager_none');
            }
            if (!pagerArea[6].classList.contains('c_pager_none')) {
                pagerArea[6].classList.add('c_pager_none');
            }
            switch (totalpage) {
                case 5:
                    // アクティブなページによってページ設定を見直す
                    if (activepage == 2) {
                        pagerArea[3].classList.add('c_pager_disabled');
                        pagerArea[4].classList.remove('c_pager_disabled');
                        pagerArea[3].classList.remove('c_pager_none');
                        pagerArea[3].getElementsByTagName('p')[0].innerText = activepage;
                        pagerArea[4].getElementsByTagName('p')[0].innerText = activepage + 1;
                        pagerArea[5].getElementsByTagName('p')[0].innerText = activepage + 2;
                    }
                    else if (activepage == (totalpage - 1)) {
                        pagerArea[4].classList.remove('c_pager_disabled');
                        pagerArea[5].classList.add('c_pager_disabled');
                        pagerArea[5].classList.remove('c_pager_none');
                        pagerArea[3].getElementsByTagName('p')[0].innerText = activepage - 2;
                        pagerArea[4].getElementsByTagName('p')[0].innerText = activepage - 1;
                        pagerArea[5].getElementsByTagName('p')[0].innerText = activepage;
                    } else if (activepage == totalpage) {
                        pagerArea[3].classList.remove('c_pager_none');
                        pagerArea[5].classList.remove('c_pager_none');
                    } else {
                        pagerArea[5].classList.remove('c_pager_none');
                    }
                    break;
                // 4件の場合は特別な制御不要なためスキップ
                case 3:
                    if (!pagerArea[4].classList.contains('c_pager_none')) {
                        if (activepage != 2) {
                            pagerArea[4].classList.add('c_pager_none');
                        }
                    }
                    if (activepage == totalpage) {
                        pagerArea[7].classList.add('c_pager_disabled');
                        pagerArea[8].classList.add('c_pager_disabled');
                    }
                    if (!pagerArea[5].classList.contains('c_pager_none')) {
                        pagerArea[5].classList.add('c_pager_none');
                    }
                    break;
                case 2:
                    if (!pagerArea[3].classList.contains('c_pager_none')) {
                        pagerArea[3].classList.add('c_pager_none');
                    }
                    if (!pagerArea[4].classList.contains('c_pager_none')) {
                        pagerArea[4].classList.add('c_pager_none');
                    }
                    if (!pagerArea[5].classList.contains('c_pager_none')) {
                        pagerArea[5].classList.add('c_pager_none');
                    }
                    if (activepage == totalpage) {
                        if (!pagerArea[7].classList.contains('c_pager_disabled')) {
                            pagerArea[7].classList.add('c_pager_disabled');
                            pagerArea[8].classList.add('c_pager_disabled');
                        }
                    }
                    break;
                case 1:
                    // 第4引数の設定内容によって表示方法を分岐
                    if (singlePageDisp || singlePageDisp == undefined) {
                        if (!pagerArea[3].classList.contains('c_pager_none')) {
                            pagerArea[3].classList.add('c_pager_none');
                        }
                        if (!pagerArea[4].classList.contains('c_pager_none')) {
                            pagerArea[4].classList.add('c_pager_none');
                        }
                        if (!pagerArea[5].classList.contains('c_pager_none')) {
                            pagerArea[5].classList.add('c_pager_none');
                        }
                        if (!pagerArea[7].classList.contains('c_pager_none')) {
                            pagerArea[7].classList.add('c_pager_none');
                        }
                        if (!pagerArea[8].classList.contains('c_pager_disabled')) {
                            pagerArea[8].classList.add('c_pager_disabled');
                        }
                    }
                    else {
                        pagerSection.classList.add('c_pager_none');
                    }
                    break;
            }
        }
        // フォーカスの設定
        c_pager_disfocus();
    }
}

/** コンポーネント：chip **/
if (!document.getElementsByClassName('c_chip01').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    window.addEventListener('DOMContentLoaded', function () {
        // 画面内のchipを取得
        const chip = document.getElementsByClassName('c_chip01_label');
        for (let i = 0; chip.length > i; i++) {

            // クリック操作時の処理
            chip[i].addEventListener('click', function () {

                // Filter用途の場合のみ実行
                if (this.parentElement.classList.contains('c_chip01_filter')) {

                    // selectedクラスを持っているかを確認
                    if (this.classList.contains('c_chip01_selected')) {
                        // selectedクラスを持っていればc_chip01_selectedクラスを削除
                        this.classList.remove('c_chip01_selected');
                    } else {
                        // selectedクラスを持っていなければc_chip01_selectedクラスを追加
                        this.classList.add('c_chip01_selected');
                    }
                }
            })

            // キーボード操作時の処理
            chip[i].addEventListener('keydown', function (e) {
                let clickEvent;

                // 非活性状態の場合は操作を行わない
                if (!this.parentElement.classList.contains('c_chip01_disabled')) {

                    // クリックイベントの生成
                    if (c_isbrowserIE()) {
                        clickEvent = document.createEvent('Event');
                        clickEvent.initEvent('click', false, true);
                    } else {
                        clickEvent = new Event('click');
                    }

                    // keyCode : "13" （Enter）
                    if (e.keyCode == "13") {
                        this.dispatchEvent(clickEvent);
                    }
                }
            });
        }
    })
}

/** コンポーネント：Navigation **/
if (!document.getElementsByClassName('c_mynavi_base').length) {
    //該当の要素がない場合は処理を行なわない
} else {
    window.addEventListener('DOMContentLoaded', function () {
        // ボタンの取得
        const btn = document.getElementsByClassName('c_mynavi_btn');

        // 閉じるボタン or 戻るボタンの配置
        c_mynavi_setBottom(btn);
    });

    // ボタンの配置を設定
    // 引数
    // btn c_mynavi_btnクラスを持つボタン要素
    // closeBottom　再設定時に指定する閉じるボタンのbottom値
    // returnBottom　再設定時に指定する戻るボタンのbottom値
    function c_mynavi_setBottom(btn, closeBottom, returnBottom) {

        for (let i = 0; btn.length > i; i++) {
            let closeBtm = '';
            // 閉じるボタンに設定するbottomの値を取得
            if (closeBottom) {
                closeBtm = closeBottom;
            } else {
                // 閉じるボタンのデータセットを取得
                closeBtm = btn[i].parentElement.dataset.close_btm;
            }

            // 指定のクラス、データセットが設定されていれば高さを調整
            if (btn[i].parentElement.classList.contains('c_mynavi_close') && closeBtm) {
                btn[i].parentElement.style.bottom = closeBtm + 'rem';
            }

            let returnBtm = '';
            // 戻るボタンに設定するbottomの値を取得
            if (returnBottom) {
                returnBtm = returnBottom;
            } else {
                // 戻るボタンのデータセットを取得
                returnBtm = btn[i].parentElement.dataset.return_btm;
            }

            // 指定のクラス、データセットが設定されていれば高さを調整
            if (btn[i].parentElement.classList.contains('c_mynavi_return')) {
                btn[i].parentElement.style.bottom = returnBtm + 'rem';
            }
        }
    }
}

/** コンポーネント：Call **/
if (!document.getElementsByClassName('c_call01').length) {
    //該当の要素がない場合は処理を行なわない
} else {

    window.addEventListener('DOMContentLoaded', function () {
        const call = document.getElementsByClassName('c_call01');

        for (let i = 0; i < call.length; i++) {
            // フォーカス無効
            call[i].children[0].setAttribute('tabindex', '-1');
        };
    });

}
