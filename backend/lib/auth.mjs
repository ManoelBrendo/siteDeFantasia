import crypto from "node:crypto";
import { readCollection, writeCollection } from "./json-store.mjs";
import { config } from "./config.mjs";

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
    const [salt, expectedHash] = String(storedHash || "").split(":");

    if (!salt || !expectedHash) {
        return false;
    }

    const candidate = hashPassword(password, salt).split(":")[1];
    return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(expectedHash, "hex"));
};

const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

export const createToken = (user) => {
    const header = base64Url({ alg: "HS256", typ: "JWT" });
    const payload = base64Url({
        sub: user.id,
        email: user.email,
        name: user.name,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
    });
    const signature = crypto
        .createHmac("sha256", config.jwtSecret)
        .update(`${header}.${payload}`)
        .digest("base64url");

    return `${header}.${payload}.${signature}`;
};

export const verifyToken = (token) => {
    const [header, payload, signature] = String(token || "").split(".");

    if (!header || !payload || !signature) {
        return null;
    }

    const expectedSignature = crypto
        .createHmac("sha256", config.jwtSecret)
        .update(`${header}.${payload}`)
        .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
    }

    const parsedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (Number(parsedPayload.exp) < Math.floor(Date.now() / 1000)) {
        return null;
    }

    return parsedPayload;
};

export const getAuthUser = async (request) => {
    const header = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const payload = verifyToken(token);

    if (!payload) {
        return null;
    }

    const users = await readCollection("users");
    return users.find((user) => user.id === payload.sub) || null;
};

export const registerUser = async ({ email, password, name }) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "Leitor do Bosque").trim();

    if (!normalizedEmail.includes("@") || String(password || "").length < 6) {
        throw Object.assign(new Error("Informe e-mail valido e senha com pelo menos 6 caracteres."), { status: 400 });
    }

    const users = await readCollection("users");

    if (users.some((user) => user.email === normalizedEmail)) {
        throw Object.assign(new Error("Este e-mail ja esta cadastrado."), { status: 409 });
    }

    const user = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        name: cleanName,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
    };

    users.push(user);
    await writeCollection("users", users);
    return user;
};

export const loginUser = async ({ email, password }) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const users = await readCollection("users");
    const user = users.find((entry) => entry.email === normalizedEmail);

    if (!user || !verifyPassword(password, user.passwordHash)) {
        throw Object.assign(new Error("Credenciais invalidas."), { status: 401 });
    }

    return user;
};

export const publicUser = (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt
});
