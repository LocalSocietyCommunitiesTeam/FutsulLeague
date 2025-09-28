/** 画面共通 **/
var LEAGUE_NUMBER = 2;

// クエリストリングのvalueを取得する関数
function getQuery(key) {
  const params = new URLSearchParams(window.location.search);
  const values = params.getAll(key);
  if (values.length === 0) {
    return null;
  } else if (values.length === 1) {
    return values[0];
  } else {
    return values;
  }
}

// 文字列中の英数字を全角から半角へ変換する関数
const convertFullwidthAlphanumericToHalfwidth = (str) => {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }

  // 英数字の全角範囲 [Ａ-Ｚａ-ｚ０-９] を半角に変換
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => {
    // 全角と半角のコードポイントの差（0xFEE0）を利用
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
};

// 文字列中の英字を小文字から大文字に変換する関数
const convertToLowercaseToUppercase = (str) => {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }

  // 標準の toUpperCase() を使用
  return str.toUpperCase();
};

// 文字列中の全角アンダースコア "＿" を 半角アンダースコア "_" に変換する関数
const convertFullwidthUnderscoreToHalfwidth = (str) => {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }

  // 正規表現で "＿" を "_" に置換
  return str.replace(/＿/g, '_');
};

// 文字列中の半角スペース " " を 全角スペース "　" に変換する関数
const convertHalfwidthSpaceToFullwidth = (str) => {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }

  // 正規表現で " " を "　" に置換
  return str.replace(/ /g, '　');
};

window.addEventListener('DOMContentLoaded', function () {
  // 更新ボタン押下時の処理
  if (document.getElementById('com_reloadBtn')) {
    const reloadBtn = document.getElementById('com_reloadBtn');

    // 更新ボタンを押下に画面をリロード
    reloadBtn.addEventListener('click', function () {
      location.reload();
    });
  }

});
