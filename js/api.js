const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxDvqqxzypoq4VsEjwEj64mImShxf8Yhgdrbbm8aS6g2lmpVXAJ4fbaMKdSn1XG5rB-/exec";

async function callApi(action, method = "GET", data = {}) {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) spinner.style.display = "flex";

    try {
        let options = {
            method: method,
            redirect: "follow",
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        };

        let url = GAS_API_URL + "?action=" + action;

        if (method === "POST") {
            options.body = JSON.stringify(Object.assign({ action: action }, data));
        } else {
            Object.keys(data).forEach(key => {
                url += `&${key}=${encodeURIComponent(data[key])}`;
            });
        }

        const response = await fetch(url, options);
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("GASから有効なJSONが返されませんでした（デプロイ設定やURLを確認してください）。");
        }

        const json = await response.json();

        if (json.status === "error") {
            throw new Error(json.message);
        }
        return json.data;
    } catch (err) {
        alert("通信エラー: " + err.message);
        throw err;
    } finally {
        if (spinner) spinner.style.display = "none";
    }
}