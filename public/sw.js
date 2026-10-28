const CACHE_PREFIX = "atheer-quran-";
const CACHE_NAME = `${CACHE_PREFIX}v11`;
const SCOPE_URL = new URL(self.registration.scope);
const INDEX_URL = new URL("index.html", SCOPE_URL).href;

function getAppShellUrls(html) {
  const urls = new Set([SCOPE_URL.href, INDEX_URL]);
  const assetAttributes = /\b(?:src|href)\s*=\s*["']([^"'#]+)["']/gi;
  for (const match of html.matchAll(assetAttributes)) {
    try {
      const url = new URL(match[1], INDEX_URL);
      if (url.origin === SCOPE_URL.origin && url.pathname.startsWith(SCOPE_URL.pathname)) {
        urls.add(url.href);
      }
    } catch {
      // Ignore malformed and non-URL asset references.
    }
  }
  return [...urls];
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const response = await fetch(INDEX_URL, { cache: "reload" });
    if (!response.ok) throw new Error(`App shell request failed: ${response.status}`);
    const urls = getAppShellUrls(await response.text());
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Only intercept same-origin application files. SEO routes, metadata APIs,
  // and audio streams go directly to the network and are never cached here.
  const url = new URL(request.url);
  if (url.origin !== location.origin || request.destination === "audio") return;
  if (
    url.pathname === "/robots.txt" ||
    url.pathname === "/sitemap.xml" ||
    /^\/(?:api|browse|surah|reciter|radio)(?:\/|$)/.test(url.pathname)
  ) return;

  // First-party application files prefer the network and fall back to the last
  // working shell when the device is offline.
  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
      }
      return response;
    }).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") return cache.match(INDEX_URL);
      return new Response("Offline", { status: 504, statusText: "Offline" });
    })
  );
});
