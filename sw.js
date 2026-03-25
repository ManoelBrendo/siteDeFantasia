const SHELL_CACHE = "bosque-shell-v5";
const RUNTIME_CACHE = "bosque-runtime-v5";
const APP_SHELL = [
    "./",
    "./index.html",
    "./app.js",
    "./audio-player.js",
    "./catalog-api.js",
    "./library-db.js",
    "./open-library-api.js",
    "./pwa.js",
    "./site-data.js",
    "./recommendation-engine.js",
    "./manifest.webmanifest",
    "./bosque-icon.svg",
    "./CREDITOS-IMAGENS.md",
    "./README.md",
    "./.nojekyll"
];

const RUNTIME_HOSTS = new Set([
    "openlibrary.org",
    "covers.openlibrary.org",
    "upload.wikimedia.org",
    "commons.wikimedia.org"
]);

const cacheFirst = async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request, { ignoreSearch: request.mode === "navigate" });

    if (cachedResponse) {
        return cachedResponse;
    }

    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
};

const staleWhileRevalidate = async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    const networkPromise = fetch(request)
        .then((response) => {
            cache.put(request, response.clone());
            return response;
        })
        .catch(() => cachedResponse);

    return cachedResponse || networkPromise;
};

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(event.request.url);

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches.open(SHELL_CACHE).then((cache) => cache.put("./index.html", responseClone));
                    return response;
                })
                .catch(async () => {
                    return caches.match("./index.html", { ignoreSearch: true });
                })
        );
        return;
    }

    if (requestUrl.origin === self.location.origin) {
        event.respondWith(cacheFirst(event.request, SHELL_CACHE));
        return;
    }

    if (RUNTIME_HOSTS.has(requestUrl.hostname)) {
        event.respondWith(staleWhileRevalidate(event.request, RUNTIME_CACHE));
    }
});
