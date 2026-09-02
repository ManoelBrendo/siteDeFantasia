import { bosqueApi } from "./account-api.js?v=local-auth-v3";

const MASTER_EMAIL = "manoelbrendo@gmail.com";
const MASTER_PASSWORD = "12345678";

const loginForm = document.querySelector("#login-form");
const feedback = document.querySelector("#feedback");

const showFeedback = (message, type) => {
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
};

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
        await bosqueApi.login({ email, password });
        showFeedback("Acesso Master concedido! Redirecionando...", "success");
        window.setTimeout(() => {
            window.location.href = "./index.html";
        }, 1000);
    } catch {
        showFeedback("E-mail ou senha incorretos.", "error");
    }
});