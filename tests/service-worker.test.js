import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const serviceWorkerSource = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const scope = "https://app.example/site/";

function createWorker(indexHtml = "") {
  const handlers = new Map();
  const entries = new Map();
  const deletedCaches = [];
  let offline = false;
  const cache = {
    async addAll(urls) {
      for (const value of urls) {
        const url = new URL(value, scope).href;
        const response = await fetchMock(url);
        if (!response.ok) throw new Error(`Failed to precache ${url}`);
        entries.set(url, response);
      }
    },
    async put(request, response) {
      entries.set(new URL(request.url || request, scope).href, response);
    },
    async match(request) {
      return entries.get(new URL(request.url || request, scope).href);
    }
  };
  async function fetchMock(request) {
    if (offline) throw new TypeError("Network unavailable");
    const url = new URL(request.url || request, scope);
    if (url.href === new URL("index.html", scope).href || url.href === scope) {
      return new Response(indexHtml, { status: 200 });
    }
    if (url.origin === new URL(scope).origin && url.pathname.startsWith(new URL(scope).pathname)) {
      return new Response(`asset:${url.pathname}`, { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }

  const self = {
    registration: { scope },
    clients: { claim: async () => {} },
    addEventListener(name, listener) { handlers.set(name, listener); },
    skipWaiting() {}
  };
  const caches = {
    async open() { return cache; },
    async keys() { return ["atheer-quran-v8", "other-app-cache", "atheer-quran-v9"]; },
    async delete(name) { deletedCaches.push(name); return true; },
    async match(request) { return cache.match(request); }
  };

  runInNewContext(serviceWorkerSource, {
    self,
    caches,
    fetch: fetchMock,
    location: { origin: new URL(scope).origin },
    URL,
    Response,
    Promise
  });
  return { handlers, entries, deletedCaches, fetchMock, setOffline(value) { offline = value; } };
}

test("install precaches Vite's fingerprinted same-origin assets", async () => {
  const html = `
    <link rel="stylesheet" href="/site/assets/app-BUILD123.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="icon" href="/site/icon.svg">
    <script type="module" crossorigin src="/site/assets/app-BUILD123.js"></script>
  `;
  const worker = createWorker(html);
  let installPromise;
  worker.handlers.get("install")({ waitUntil(promise) { installPromise = promise; } });
  await installPromise;

  assert.ok(worker.entries.has("https://app.example/site/assets/app-BUILD123.css"));
  assert.ok(worker.entries.has("https://app.example/site/assets/app-BUILD123.js"));
  assert.ok(worker.entries.has("https://app.example/site/index.html"));
  assert.equal([...worker.entries.keys()].some((url) => url.includes("fonts.googleapis.com")), false);
});

test("cached UI assets and navigation fallback remain available offline", async () => {
  const html = '<script src="/site/assets/app-OFFLINE.js"></script>';
  const worker = createWorker(html);
  let installPromise;
  worker.handlers.get("install")({ waitUntil(promise) { installPromise = promise; } });
  await installPromise;
  worker.setOffline(true);

  const cachedAssetEvent = {
    request: { method: "GET", url: `${scope}assets/app-OFFLINE.js`, destination: "script", mode: "cors" },
    response: null,
    respondWith(promise) { this.response = promise; }
  };
  worker.handlers.get("fetch")(cachedAssetEvent);
  assert.equal(await (await cachedAssetEvent.response).text(), "asset:/site/assets/app-OFFLINE.js");

  const navigationEvent = {
    request: { method: "GET", url: scope, destination: "document", mode: "navigate" },
    response: null,
    respondWith(promise) { this.response = promise; }
  };
  worker.handlers.get("fetch")(navigationEvent);
  assert.equal(await (await navigationEvent.response).text(), html);
});

test("activation removes only this app's older cache versions", async () => {
  const worker = createWorker();
  let activationPromise;
  worker.handlers.get("activate")({ waitUntil(promise) { activationPromise = promise; } });
  await activationPromise;
  assert.deepEqual(worker.deletedCaches, ["atheer-quran-v8"]);
});

test("audio and cross-origin requests bypass service-worker caching", async () => {
  const worker = createWorker();
  const audioEvent = {
    request: { method: "GET", url: `${scope}radio.mp3`, destination: "audio" },
    respondWith() { assert.fail("audio must bypass the service worker"); }
  };
  const externalEvent = {
    request: { method: "GET", url: "https://stream.example/live", destination: "" },
    respondWith() { assert.fail("cross-origin requests must bypass the service worker"); }
  };
  worker.handlers.get("fetch")(audioEvent);
  worker.handlers.get("fetch")(externalEvent);
  assert.equal(worker.entries.size, 0);
});
