/** 画面共通 **/
// デプロイしたGASの「WebアプリのURL」
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyL9doo1-8WbbskTZVy_bnlrXHzIZRd3LDXTDj5QnVG53sdndOGvvRRjycpzLmoCZv35Q/exec";

function getThisTerm() {
    let now = new Date();
    if (now.getMonth() >= 4) {
        return now.getFullYear();
    } else {
        return now.getFullYear() - 1;
    }
}

var THISTERM = getThisTerm();