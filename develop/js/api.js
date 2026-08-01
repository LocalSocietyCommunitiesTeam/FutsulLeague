/* =========================================================================
   api.js — GAS(Google Apps Script) バックエンドとの通信モジュール
   ・CORSプリフライトを回避するため、POSTは Content-Type: text/plain で送信
   ・GAS側の doGet / doPost 単一エンドポイントに action を渡す方式
   ========================================================================= */

// ★★★ デプロイ後、Web App の URL をここに設定してください ★★★
// 例: https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec
const API_BASE_URL = "https://script.google.com/macros/s/AKfycbwiT773IEFOU1om-fxOq4tpx17ZAiYFAKDAW7SRfs--Mcildz-h_KOY7M3eeLkVpA0/exec";

/**
 * GETリクエスト（データ参照系: getTournament / getRankings 等）
 * @param {string} action
 * @param {Object} params
 * @returns {Promise<{status:string, data:any, message:string}>}
 */
async function apiGet(action, params = {}) {
    const query = new URLSearchParams({ action, ...params }).toString();
    const url = `${API_BASE_URL}?${query}`;
    try {
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("[apiGet] failed:", action, err);
        return { status: "error", data: null, message: "通信に失敗しました。電波状況を確認の上、再度お試しください。" };
    }
}

/**
 * POSTリクエスト（データ更新系: submitScore / adminLogin / generateSchedule 等）
 * text/plain で送信し、GAS側 doPost で JSON.parse する前提
 * @param {Object} payload  action を含む送信データ
 * @returns {Promise<{status:string, data:any, message:string}>}
 */
async function apiPost(payload) {
    try {
        const res = await fetch(API_BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("[apiPost] failed:", payload && payload.action, err);
        return { status: "error", data: null, message: "通信に失敗しました。電波状況を確認の上、再度お試しください。" };
    }
}

/* ---- 管理者トークンを付与するPOSTのショートハンド ---- */
async function apiPostAuthed(action, payload = {}) {
    const token = sessionStorage.getItem("admin_token") || "";
    return apiPost({ action, token, ...payload });
}
