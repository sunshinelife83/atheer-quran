import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/worker.js";

const assets = { fetch: async () => new Response("app shell") };

for (const endpoint of ["radios", "reciters", "suwar"]) {
  test(`/${endpoint} proxies JSON metadata from the upstream API`, async () => {
    const originalFetch = globalThis.fetch;
    let requestedUrl;
    globalThis.fetch = async (url, options) => {
      requestedUrl = String(url);
      assert.equal(options.headers.accept, "application/json");
      return Response.json({ [endpoint]: [{ id: 1 }] });
    };
    try {
      const response = await worker.fetch(
        new Request(`https://app.example/api/v3/${endpoint}?language=ar`),
        { ASSETS: assets }
      );
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
      assert.equal(response.headers.get("x-robots-tag"), "noindex");
      assert.deepEqual(await response.json(), { [endpoint]: [{ id: 1 }] });
      assert.equal(requestedUrl, `https://www.mp3quran.net/api/v3/${endpoint}?language=ar`);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

test("caches public API responses at the Worker edge and bypasses credentialed requests", async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const entries = new Map();
  globalThis.caches = { default: {
    match: async (key) => entries.get(key.url)?.clone(),
    put: async (key, response) => { entries.set(key.url, response.clone()); }
  } };
  let upstreamCalls = 0;
  globalThis.fetch = async () => {
    upstreamCalls++;
    return Response.json({ radios: [{ id: 1 }] });
  };
  try {
    const publicRequest = () => new Request("https://app.example/api/v3/radios?language=ar");
    const first = await worker.fetch(publicRequest(), { ASSETS: assets });
    const second = await worker.fetch(publicRequest(), { ASSETS: assets });
    assert.equal(first.headers.get("cache-control"), "public, max-age=300, stale-while-revalidate=86400");
    assert.equal(first.headers.get("cdn-cache-control"), "public, max-age=3600, stale-while-revalidate=86400");
    assert.deepEqual(await second.json(), { radios: [{ id: 1 }] });
    assert.equal(upstreamCalls, 1);
    assert.equal(entries.values().next().value.headers.get("cache-control"), "public, max-age=3600, stale-while-revalidate=86400");

    const personalized = await worker.fetch(new Request("https://app.example/api/v3/radios", { headers: { cookie: "session=private" } }), { ASSETS: assets });
    assert.equal(personalized.headers.get("cache-control"), "private, no-store");
    assert.equal(personalized.headers.get("cdn-cache-control"), null);
    assert.equal(upstreamCalls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCaches === undefined) delete globalThis.caches;
    else globalThis.caches = originalCaches;
  }
});

test("rejects unsupported API paths and methods without proxying", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("should not be called"); };
  try {
    const unsupported = await worker.fetch(
      new Request("https://app.example/api/v3/not-allowed"), { ASSETS: assets }
    );
    assert.equal(unsupported.status, 404);
    const method = await worker.fetch(
      new Request("https://app.example/api/v3/radios", { method: "POST" }), { ASSETS: assets }
    );
    assert.equal(method.status, 405);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("serves non-API paths from Static Assets", async () => {
  const response = await worker.fetch(new Request("https://app.example/assets/app.js"), { ASSETS: assets });
  assert.equal(await response.text(), "app shell");
});
