/** 管理者ログイン画面 **/
document.addEventListener('DOMContentLoaded', function () {
    const loginBtn = document.getElementById('li_loginBtn');

    loginBtn.addEventListener('click', async function () {
        const passwordInput = document.getElementById('li_password');
        const password = passwordInput.value;

        // 簡易的な空チェック
        if (!password) {
            alert("パスワードを入力してください。");
            return;
        }

        try {
            // GASのdoPost関数に向けてリクエストを送信
            const response = await fetch(GAS_WEB_APP_URL, {
                method: "POST",
                headers: {
                    // GASへの単純なPOST通信のクロスドメインエラーを防ぐため、敢えて text/plain にするか指定しないのが無難です
                    "Content-Type": "text/plain"
                },
                body: JSON.stringify({
                    action: "login",  // GAS側で分岐するためのキー
                    password: password
                })
            });

            // GASからのレスポンスをJSONとして解析
            const result = await response.json();

            if (result.success === true) {
                alert("ログインに成功しました！");

                // 💡 ログイン成功後の処理（例: 管理画面へ遷移する、表示を切り替えるなど）
                window.location.href = "./master.html"; 

            } else {
                alert("パスワードが違います。");
                passwordInput.value = ""; // 入力をクリア
            }

        } catch (error) {
            console.error("通信エラーが発生しました:", error);
            alert("サーバーとの通信に失敗しました。時間をおいて再度お試しください。");
        }
    });
});