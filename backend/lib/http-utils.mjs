import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.mjs";

const contentTypes = new Map([
    [".html", "text/html; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".css", "text/css; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".webmanifest", "application/manifest+json; charset=utf-8"],
    [".svg", "image/svg+xml; charset=utf-8"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".md", "text/markdown; charset=utf-8"]
]);

export const sendJson = (response, status, payload, headers = {}) => {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        ...headers
    });
    response.end(JSON.stringify(payload));
};

export const readJsonBody = async (request) => {
    const chunks = [];
    let size = 0;

    for await (const chunk of request) {
        size += chunk.length;

        if (size > config.maxJsonBytes) {
            throw Object.assign(new Error("Payload muito grande."), { status: 413 });
        }

        chunks.push(chunk);
    }

    const rawBody = Buffer.concat(chunks).toString("utf8");
    return rawBody ? JSON.parse(rawBody) : {};
};

export const serveStatic = async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    let filePath = path.resolve(config.publicRoot, `.${decodeURIComponent(url.pathname)}`);

    if (!filePath.startsWith(config.publicRoot)) {
        sendJson(response, 403, { error: "forbidden" });
        return;
    }

    try {
        const stats = await stat(filePath);

        if (stats.isDirectory()) {
            filePath = path.join(filePath, "index.html");
        }
    } catch {
        filePath = path.join(config.publicRoot, "index.html");
    }

    response.writeHead(200, {
        "Content-Type": contentTypes.get(path.extname(filePath)) || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
};
