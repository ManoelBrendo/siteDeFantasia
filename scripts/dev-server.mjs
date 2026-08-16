import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || ".");
const port = Number(process.argv[3] || 4173);
const host = "127.0.0.1";
const types = new Map([
    [".html", "text/html; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".css", "text/css; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".webmanifest", "application/manifest+json; charset=utf-8"],
    [".svg", "image/svg+xml; charset=utf-8"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".ico", "image/x-icon"],
    [".md", "text/markdown; charset=utf-8"]
]);

const resolveRequestPath = async (requestUrl) => {
    const url = new URL(requestUrl, `http://${host}:${port}`);
    const decodedPath = decodeURIComponent(url.pathname);
    let filePath = path.resolve(root, `.${decodedPath}`);

    if (!filePath.startsWith(root)) {
        return null;
    }

    try {
        const stats = await stat(filePath);

        if (stats.isDirectory()) {
            filePath = path.join(filePath, "index.html");
        }

        return filePath;
    } catch {
        return path.join(root, "index.html");
    }
};

createServer(async (request, response) => {
    const filePath = await resolveRequestPath(request.url || "/");

    if (!filePath) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    response.writeHead(200, {
        "Content-Type": types.get(path.extname(filePath)) || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
}).listen(port, host, () => {
    console.log(`Bosque da Fantasia em http://${host}:${port}`);
});
