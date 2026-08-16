const API_PORT = "4180";
const FALLBACK_API_BASE = `http://127.0.0.1:${API_PORT}`;
const API_BASE = window.BOSQUE_API_BASE || (() => {
    const { hostname, port, protocol } = window.location;
    const isFile = protocol === "file:";
    const isLocalHost = ["127.0.0.1", "localhost", "::1", "0.0.0.0", ""].includes(hostname);
    const apiHost = hostname && hostname !== "0.0.0.0" ? hostname : "127.0.0.1";

    if (port === API_PORT) {
        return "";
    }

    if (isFile || isLocalHost || port) {
        return `${isFile ? "http:" : protocol}//${apiHost}:${API_PORT}`;
    }

    return "";
})();
const TOKEN_KEY = "bosque-api-token";
const USER_KEY = "bosque-api-user";

const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
        return null;
    }
};

const fetchJson = async (path, options, base = API_BASE) => {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };
    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${base}${path}`, {
            ...options,
            headers
        });
    } catch {
        throw new Error("Nao foi possivel conectar com a API. Rode npm run api e acesse http://127.0.0.1:4180.");
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : {};

    if (!contentType.includes("application/json")) {
        const error = new Error("A rota de API respondeu HTML. Abra o site pela porta 4180 ou rode npm run api.");
        error.code = "HTML_API_RESPONSE";
        throw error;
    }

    if (!response.ok) {
        throw new Error(payload.error || "A API nao respondeu com sucesso.");
    }

    return payload;
};

const request = async (path, options = {}) => {
    try {
        return await fetchJson(path, options);
    } catch (error) {
        if (error.code === "HTML_API_RESPONSE" && API_BASE !== FALLBACK_API_BASE) {
            return fetchJson(path, options, FALLBACK_API_BASE);
        }

        throw error;
    }
};

const requireSessionPayload = (result) => {
    if (!result?.token || !result?.user) {
        throw new Error("A API de autenticacao respondeu sem usuario ou token.");
    }

    return result;
};

const setSession = ({ token, user }) => {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    }

    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    window.dispatchEvent(new CustomEvent("bosque:session", { detail: { user } }));
};

const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new CustomEvent("bosque:session", { detail: { user: null } }));
};

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

export const bosqueApi = {
    getToken,
    getStoredUser,
    clearSession,
    async register(payload) {
        const result = requireSessionPayload(await request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(payload)
        }));
        setSession(result);
        return result;
    },
    async login(payload) {
        const result = requireSessionPayload(await request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(payload)
        }));
        setSession(result);
        return result;
    },
    async me() {
        return request("/api/me");
    },
    async listFiles() {
        return request("/api/files");
    },
    async uploadFile(file) {
        const contentBase64 = await fileToBase64(file);
        return request("/api/files", {
            method: "POST",
            body: JSON.stringify({
                name: file.name,
                type: file.type,
                contentBase64
            })
        });
    },
    async searchAmazon(query) {
        return request(`/api/amazon/search?q=${encodeURIComponent(query)}`);
    }
};
