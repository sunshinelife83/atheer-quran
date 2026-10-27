import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/worker.js";
import { radioPath, reciterPath, slugify, surahPath } from "../src/seo.js";

const surahs = [
  { id: 1, name: "الفاتحة", makkia: 1 },
  { id: 2, name: "البقرة", makkia: 0 }
];
const reciters = [{
  id: 7,
  name: "قارئ تجريبي",
  moshaf: [{ id: 70, name: "حفص عن عاصم", server: "https://audio.example/reader/", surah_list: "1,2" }]
}];
const radios = [{ id: 8, name: "إذاعة تجريبية", url: "https://stream.example/live" }];
const env = {
  SITE_URL: "https://site.example",
  ASSETS: { fetch: async () => new Response(`<!doctype html><html lang="ar" dir="rtl"><head><title>old</title><meta name="description" content="old"><link rel="icon" href="/icon.svg" type="image/svg+xml"></head><body><main></main><!-- SEO_DIRECTORY --><section>old directory</section><!-- SEO_DIRECTORY_END --><script type="module" src="/assets/main.js"></script></body></html>`, { headers: { "content-type": "text/html" } }) }
};

function fixtureFetch(url) {
  const target = String(url);
  if (target.includes("alquran.cloud")) {
    return Response.json({ data: [
      { number: 1, numberOfAyahs: 7, revelationType: "Meccan" },
      { number: 2, numberOfAyahs: 286, revelationType: "Medinan" }
    ] });
  }
  if (target.includes("/api/v3/suwar")) return Response.json({ suwar: surahs });
  if (target.includes("/api/v3/reciters")) return Response.json({ reciters });
  if (target.includes("/api/v3/radios")) return Response.json({ radios });
  throw new Error(`Unexpected upstream URL: ${target}`);
}

function canonicalCount(html) {
  return (html.match(/<link rel="canonical"/g) || []).length;
}

function assertBrandMetadata(html) {
  assert.match(html, /<link rel="icon" href="\/icon\.svg" type="image\/svg\+xml">/);
  assert.match(html, /<meta property="og:site_name" content="أثير القرآن">/);
  assert.doesNotMatch(html, /Cloudflare/);
}

test("Arabic public URLs are stable and ID-qualified", () => {
  assert.match(surahPath(surahs[0]), /^\/surah\/001-/);
  assert.match(reciterPath(reciters[0]), /^\/reciter\/7-/);
  assert.match(radioPath(radios[0]), /^\/radio\/8-/);
  assert.equal(slugify("سورة الفاتحة"), "swrh-alfathh");
});

test("caches complete public SEO pages without proxying audio", async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const entries = new Map();
  globalThis.caches = { default: {
    match: async (key) => entries.get(key.url)?.clone(),
    put: async (key, response) => { entries.set(key.url, response.clone()); }
  } };
  let upstreamCalls = 0;
  globalThis.fetch = async (url) => {
    upstreamCalls++;
    return fixtureFetch(url);
  };
  try {
    const request = new Request(`https://atheer-quran.workers.dev${surahPath(surahs[0])}`);
    const first = await worker.fetch(request, env);
    const html = await first.text();
    const cached = await worker.fetch(request, env);
    assert.equal(cached.headers.get("cache-control"), "public, max-age=300, stale-while-revalidate=86400");
    assert.equal(cached.headers.get("cdn-cache-control"), "public, max-age=3600, stale-while-revalidate=86400");
    assert.equal(upstreamCalls, 3);
    assert.match(await cached.text(), /<script type="application\/ld\+json">[\s\S]*BreadcrumbList/);
    assert.match(html, /<h1>سورة الفاتحة<\/h1>/);
    assert.match(html, /src="https:\/\/audio\.example\/reader\/001\.mp3"/);
    assert.equal(upstreamCalls, 3, "audio remains a direct browser URL, not a Worker subrequest");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCaches === undefined) delete globalThis.caches;
    else globalThis.caches = originalCaches;
  }
});

test("accepts the explicitly configured workers.dev production origin", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fixtureFetch;
  try {
    const productionOrigin = "https://quran.athirquran.workers.dev";
    const response = await worker.fetch(new Request(`${productionOrigin}/`), {
      ...env,
      SITE_URL: productionOrigin
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.doesNotMatch(html, /الإعداد غير مكتمل/);
    assert.match(html, /<link rel="canonical" href="https:\/\/quran\.athirquran\.workers\.dev\/"/);
    const websiteScript = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]))
      .find((schema) => schema["@type"] === "WebSite");
    assert.equal(websiteScript.name, "أثير القرآن");
    assert.equal(websiteScript.alternateName, "Athir Al-Quran");
    assert.equal(websiteScript.url, "https://quran.athirquran.workers.dev/");
    assertBrandMetadata(html);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Worker renders crawlable pages, metadata, sitemap, robots, and noindex errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fixtureFetch;
  try {
    const request = (path) => worker.fetch(new Request(`https://atheer-quran.workers.dev${path}`), env);

    const home = await request("/");
    const homeHtml = await home.text();
    assert.equal(home.status, 200);
    assert.equal(home.headers.get("cache-control"), "public, max-age=300, stale-while-revalidate=86400");
    assert.equal(home.headers.get("cdn-cache-control"), "public, max-age=3600, stale-while-revalidate=86400");
    assert.equal(canonicalCount(homeHtml), 1);
    assert.match(homeHtml, /<h2>استمع إلى القرآن الكريم كما تحب<\/h2>/);
    assert.match(homeHtml, /يجمع أثير القرآن إذاعات قرآنية مباشرة، وتلاوات السور بصوت القراء، مع إمكانية حفظ السور للاستماع دون اتصال/);
    assert.match(homeHtml, /<a href="\/browse\/">تصفح سور القرآن الكريم والقراء والإذاعات<\/a>/);
    assert.doesNotMatch(homeHtml, /class="seo-card"/);
    assert.match(homeHtml, /<script type="application\/ld\+json">/);
    const websiteScript = [...homeHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]))
      .find((schema) => schema["@type"] === "WebSite");
    assert.deepEqual(websiteScript, {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "أثير القرآن",
      alternateName: "Athir Al-Quran",
      url: "https://site.example/",
      inLanguage: "ar"
    });
    assertBrandMetadata(homeHtml);
    assert.match(homeHtml, /<meta name="twitter:card"/);
    assert.match(homeHtml, /<html lang="ar" dir="rtl">/);

    const surah = await request(surahPath(surahs[0]));
    const surahHtml = await surah.text();
    assert.equal(surah.status, 200);
    assert.match(surahHtml, /<h1>سورة الفاتحة<\/h1>/);
    assert.match(surahHtml, /عدد الآيات: 7/);
    assert.match(surahHtml, /مكية/);
    assert.match(surahHtml, /قارئ تجريبي/);
    assert.match(surahHtml, /<audio[^>]+src="https:\/\/audio\.example\/reader\/001\.mp3"/);
    assert.equal(canonicalCount(surahHtml), 1);
    assert.match(surahHtml, new RegExp(`<link rel="canonical" href="https://site\\.example${surahPath(surahs[0]).replaceAll("/", "\\/")}"`));
    assert.match(surahHtml, /<meta name="robots" content="index,follow">/);
    assert.match(surahHtml, /BreadcrumbList/);
    assertBrandMetadata(surahHtml);

    const reciter = await request(reciterPath(reciters[0]));
    const reciterHtml = await reciter.text();
    assert.equal(reciter.status, 200);
    assert.match(reciterHtml, /<h1>القارئ قارئ تجريبي<\/h1>/);
    assert.match(reciterHtml, new RegExp(surahPath(surahs[1]).replaceAll("/", "\\/")));
    assert.equal(canonicalCount(reciterHtml), 1);
    assertBrandMetadata(reciterHtml);

    const radio = await request(radioPath(radios[0]));
    const radioHtml = await radio.text();
    assert.equal(radio.status, 200);
    assert.match(radioHtml, /<h1>إذاعة تجريبية<\/h1>/);
    assert.match(radioHtml, /src="https:\/\/stream\.example\/live"/);
    assert.equal(canonicalCount(radioHtml), 1);
    assertBrandMetadata(radioHtml);

    const browse = await request("/browse/");
    const browseHtml = await browse.text();
    assert.equal(browse.status, 200);
    assert.match(browseHtml, new RegExp(surahPath(surahs[0]).replaceAll("/", "\\/")));
    assert.match(browseHtml, new RegExp(reciterPath(reciters[0]).replaceAll("/", "\\/")));
    assert.match(browseHtml, new RegExp(radioPath(radios[0]).replaceAll("/", "\\/")));
    assertBrandMetadata(browseHtml);

    const sitemap = await request("/sitemap.xml");
    const sitemapXml = await sitemap.text();
    const locs = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    assert.equal(sitemap.status, 200);
    assert.equal(sitemap.headers.get("cache-control"), "public, max-age=300, stale-while-revalidate=86400");
    assert.equal(sitemap.headers.get("cdn-cache-control"), "public, max-age=3600, stale-while-revalidate=86400");
    assert.equal(locs.length, 6);
    assert.equal(new Set(locs).size, locs.length);
    assert.ok(locs.every((loc) => loc.startsWith("https://site.example/")));
    assert.ok(!sitemapXml.includes("settings"));

    const robots = await (await request("/robots.txt")).text();
    assert.match(robots, /User-agent: Googlebot\nAllow: \/\n/);
    assert.match(robots, /User-agent: Bingbot\nAllow: \/\n/);
    assert.match(robots, /User-agent: OAI-SearchBot\nAllow: \/\n/);
    assert.match(robots, /Sitemap: https:\/\/site\.example\/sitemap\.xml/);

    const notFound = await request("/settings/");
    const notFoundHtml = await notFound.text();
    assert.equal(notFound.status, 404);
    assert.match(notFoundHtml, /<meta name="robots" content="noindex,follow">/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
