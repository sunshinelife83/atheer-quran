import {
  audioUrl, escapeHtml, jsonLd, pageSchema, radioPath, radioSlug,
  reciterPath, reciterSlug, renderPage, surahPath, surahSlug
} from "./seo.js";
import { normalizeRadioUrl } from "./audio/radio-url.js";

const API_BASE = "https://www.mp3quran.net/api/v3";
const SURAH_INFO_URL = "https://api.alquran.cloud/v1/surah";
const API_ENDPOINTS = new Set(["radios", "reciters", "suwar"]);
const CACHE_SECONDS = 3600;
const HTML_CACHE_VERSION = "seo-assets-v2";
const BROWSER_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=86400";
const EDGE_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";

function isCacheableRequest(request) {
  return request.method === "GET" && !request.headers.has("authorization") && !request.headers.has("cookie") && !/no-cache|no-store/i.test(request.headers.get("cache-control") || "");
}

function cacheKey(request, includeSearch = false, version = "") {
  const url = new URL(request.url);
  url.hash = "";
  if (!includeSearch) url.search = "";
  if (version) url.searchParams.set("__cache", version);
  return new Request(url, { method: "GET" });
}

function withCacheHeaders(response, cacheControl, cdnCacheControl = null) {
  const headers = new Headers(response.headers);
  headers.set("cache-control", cacheControl);
  if (cdnCacheControl) headers.set("cdn-cache-control", cdnCacheControl);
  else headers.delete("cdn-cache-control");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function cachedPublic(request, context, render, { includeSearch = false, cacheSafe = true, version = "" } = {}) {
  const eligible = cacheSafe && isCacheableRequest(request);
  const cache = eligible ? globalThis.caches?.default : null;
  const key = cache ? cacheKey(request, includeSearch, version) : null;
  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit) return withCacheHeaders(hit, BROWSER_CACHE_CONTROL, EDGE_CACHE_CONTROL);
    } catch { /* Cache API may be unavailable in local/test runtimes. */ }
  }

  const response = await render();
  if (!eligible) return withCacheHeaders(response, "private, no-store");
  if (response.status !== 200) return response;
  const cached = withCacheHeaders(response, BROWSER_CACHE_CONTROL, EDGE_CACHE_CONTROL);
  if (cache) {
    try {
      // Cache API entry TTL follows Cache-Control; keep it at the edge TTL, not the browser TTL.
      const storageResponse = withCacheHeaders(cached.clone(), EDGE_CACHE_CONTROL, EDGE_CACHE_CONTROL);
      const write = cache.put(key, storageResponse);
      if (context?.waitUntil) context.waitUntil(write.catch(() => {}));
      else await write;
    } catch { /* Serve the response even when edge storage is unavailable. */ }
  }
  return cached;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
  });
  if (!response.ok) throw new Error(`Metadata API returned ${response.status}`);
  return response.json();
}

async function loadSurahs() {
  const [source, info] = await Promise.all([
    fetchJson(`${API_BASE}/suwar?language=ar`),
    fetchJson(SURAH_INFO_URL)
  ]);
  const details = new Map((info.data || []).map((item) => [Number(item.number), item]));
  return (source.suwar || []).map((item) => {
    const verified = details.get(Number(item.id));
    return {
      ...item,
      id: Number(item.id),
      numberOfAyahs: Number(verified?.numberOfAyahs) || 0,
      revelationType: verified?.revelationType || "",
      name: String(item.name || "").replace(/[\u064B-\u065F\u0670]/g, "").trim()
    };
  }).filter((item) => item.id > 0 && item.name && item.numberOfAyahs > 0);
}

async function loadReciters() {
  const data = await fetchJson(`${API_BASE}/reciters?language=ar`);
  const unique = new Map();
  for (const item of data.reciters || []) {
    if (!item?.id || !item.name || !Array.isArray(item.moshaf)) continue;
    const existing = unique.get(Number(item.id));
    if (!existing) unique.set(Number(item.id), { ...item, moshaf: [...item.moshaf] });
    else {
      const editions = new Set(existing.moshaf.map((moshaf) => Number(moshaf.id)));
      existing.moshaf.push(...item.moshaf.filter((moshaf) => !editions.has(Number(moshaf.id))));
    }
  }
  return [...unique.values()];
}

async function loadRadios() {
  const data = await fetchJson(`${API_BASE}/radios?language=ar`);
  const unique = new Map();
  for (const item of data.radios || []) {
    if (item?.id && item.name && /^https:\/\//i.test(item.url || "") && !unique.has(Number(item.id))) {
      unique.set(Number(item.id), { ...item, url: normalizeRadioUrl(item.url) });
    }
  }
  return [...unique.values()];
}

function siteOrigin(request, env) {
  const configured = String(env.SITE_URL || "").trim().replace(/\/+$/, "");
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === "https:") return parsed.origin;
    } catch { /* Invalid production URL falls through to the local request host. */ }
  }
  const requestUrl = new URL(request.url);
  if (["localhost", "127.0.0.1", "::1"].includes(requestUrl.hostname)) return `https://${requestUrl.host}`;
  return "";
}

function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
}

function xmlResponse(body, contentType = "application/xml; charset=utf-8") {
  return new Response(body, { headers: { "content-type": contentType, "cache-control": BROWSER_CACHE_CONTROL, "cdn-cache-control": EDGE_CACHE_CONTROL, "x-content-type-options": "nosniff" } });
}

function homepageHead(html, origin, homeLinks) {
  const title = "أثير القرآن | استمع إلى السور والتلاوات والإذاعات القرآنية";
  const description = "تصفح سور القرآن الكريم ومعلوماتها، اكتشف القراء والروايات المتاحة، واستمع إلى الإذاعات والتلاوات مباشرة من أثير القرآن.";
  const canonical = `${origin}/`;
  let head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] || "";
  head = head.replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+|robots)["'][^>]*>/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "");
  const tags = `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:type" content="website"><meta property="og:locale" content="ar_AR"><meta property="og:site_name" content="أثير القرآن"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}">`;
  const website = jsonLd({ "@context": "https://schema.org", "@type": "WebSite", name: "أثير القرآن", alternateName: "Athir Al-Quran", url: canonical, inLanguage: "ar" });
  const webpage = jsonLd({ "@context": "https://schema.org", "@type": "WebPage", name: title, description, url: canonical, inLanguage: "ar" });
  head += `${tags}<script type="application/ld+json">${website}</script><script type="application/ld+json">${webpage}</script>`;
  let output = html.replace(/<head>[\s\S]*?<\/head>/i, () => `<head>${head}</head>`);
  output = output.replace(/<!-- SEO_DIRECTORY -->[\s\S]*?<!-- SEO_DIRECTORY_END -->/, `<section id="seo-home-directory" class="shell seo-home-directory" aria-label="روابط المحتوى العام">${homeLinks}</section>`);
  return new Response(output, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": BROWSER_CACHE_CONTROL, "cdn-cache-control": EDGE_CACHE_CONTROL, "x-content-type-options": "nosniff" } });
}

function breadcrumbHtml(title) {
  return `<nav class="seo-breadcrumb" aria-label="مسار التنقل"><a href="/">الرئيسية</a><span aria-hidden="true">/</span><a href="/browse/">فهرس المحتوى</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(title)}</span></nav>`;
}

function resolveById(pathPart, entries) {
  const match = String(pathPart || "").match(/^(\d+)(?:-|$)/);
  return match ? entries.find((item) => Number(item.id) === Number(match[1])) : null;
}

function isAvailable(moshaf, surahId) {
  return String(moshaf.surah_list || "").split(",").some((id) => Number(id.trim()) === Number(surahId));
}

function htmlError(request, env, status, heading, message) {
  const origin = siteOrigin(request, env);
  const url = new URL(request.url);
  return renderPage({
    title: `${heading} | أثير القرآن`, description: message, canonical: origin ? `${origin}${url.pathname}` : "",
    content: `${breadcrumbHtml(heading)}<h1>${escapeHtml(heading)}</h1><p>${escapeHtml(message)}</p><p><a href="/browse/">تصفح فهرس المحتوى</a></p>`,
    schema: null, status, robots: "noindex,follow"
  });
}

async function surahPage(request, env, pathPart) {
  const origin = siteOrigin(request, env);
  if (!origin) return htmlError(request, env, 503, "الإعداد غير مكتمل", "يجب ضبط SITE_URL على نطاق الإنتاج قبل توليد canonical.");
  const [surahs, reciters] = await Promise.all([loadSurahs(), loadReciters()]);
  const surah = resolveById(pathPart, surahs);
  if (!surah) return htmlError(request, env, 404, "السورة غير موجودة", "لم نعثر على سورة بهذا العنوان.");
  const canonical = `${origin}${surahPath(surah)}`;
  if (pathPart !== surahSlug(surah) || !new URL(request.url).pathname.endsWith("/" + surahSlug(surah))) return Response.redirect(canonical, 301);

  const available = reciters.flatMap((reciter) => (reciter.moshaf || []).filter((moshaf) => isAvailable(moshaf, surah.id)).map((moshaf) => ({ reciter, moshaf })));
  const examples = available.slice(0, 16);
  const sample = examples[0];
  const revelation = surah.revelationType === "Meccan" ? "مكية" : surah.revelationType === "Medinan" ? "مدنية" : "";
  const description = `سورة ${surah.name}، السورة رقم ${surah.id} في القرآن الكريم، وعدد آياتها ${surah.numberOfAyahs}${revelation ? `، وهي ${revelation}` : ""}. اكتشف القراء المتاحين واستمع إلى تلاوتها.`;
  const links = examples.map(({ reciter, moshaf }) => `<a class="seo-card" href="${reciterPath(reciter)}"><strong>${escapeHtml(reciter.name)}</strong><small>${escapeHtml(moshaf.name)}</small></a>`).join("");
  const audio = sample ? `<h2>استمع إلى سورة ${escapeHtml(surah.name)}</h2><p>تلاوة ${escapeHtml(sample.reciter.name)} · ${escapeHtml(sample.moshaf.name)}</p><audio class="seo-audio" controls preload="none" src="${escapeHtml(audioUrl(sample.moshaf.server, surah.id))}" aria-label="استمع إلى سورة ${escapeHtml(surah.name)} بصوت ${escapeHtml(sample.reciter.name)}">متصفحك لا يدعم تشغيل الصوت.</audio>` : "";
  const content = `${breadcrumbHtml(`سورة ${surah.name}`)}<h1>سورة ${escapeHtml(surah.name)}</h1><p>${escapeHtml(description)}</p><div class="seo-facts"><span>رقم السورة: ${surah.id}</span><span>عدد الآيات: ${surah.numberOfAyahs}</span>${revelation ? `<span>سورة ${revelation}</span>` : ""}</div>${audio}<h2>قراء متاحون لسورة ${escapeHtml(surah.name)}</h2><div class="seo-grid">${links}</div><p><a href="/browse/#surahs">جميع سور القرآن الكريم</a></p>`;
  const schema = pageSchema(`سورة ${surah.name}`, description, canonical, [{ name: `سورة ${surah.name}`, url: canonical }]);
  return renderPage({ title: `سورة ${surah.name} (${surah.id}) | أثير القرآن`, description, canonical, content, schema });
}

async function reciterPage(request, env, pathPart) {
  const origin = siteOrigin(request, env);
  if (!origin) return htmlError(request, env, 503, "الإعداد غير مكتمل", "يجب ضبط SITE_URL على نطاق الإنتاج قبل توليد canonical.");
  const [reciters, surahs] = await Promise.all([loadReciters(), loadSurahs()]);
  const reciter = resolveById(pathPart, reciters);
  if (!reciter) return htmlError(request, env, 404, "القارئ غير موجود", "لم نعثر على قارئ بهذا العنوان.");
  const canonical = `${origin}${reciterPath(reciter)}`;
  if (pathPart !== reciterSlug(reciter) || new URL(request.url).pathname !== new URL(canonical).pathname) return Response.redirect(canonical, 301);

  const editions = (reciter.moshaf || []).map((moshaf) => {
    const available = surahs.filter((surah) => isAvailable(moshaf, surah.id));
    const sample = available[0];
    return `<section><h2>${escapeHtml(moshaf.name)}</h2><p>${available.length} سورة متاحة من هذه الرواية.</p>${sample ? `<audio class="seo-audio" controls preload="none" src="${escapeHtml(audioUrl(moshaf.server, sample.id))}" aria-label="استمع إلى سورة ${escapeHtml(sample.name)} بصوت ${escapeHtml(reciter.name)}">متصفحك لا يدعم تشغيل الصوت.</audio>` : ""}<ul class="seo-list">${available.map((surah) => `<li><a href="${surahPath(surah)}">سورة ${escapeHtml(surah.name)}</a> <small>(${surah.numberOfAyahs} آية)</small></li>`).join("")}</ul></section>`;
  }).join("");
  const editionCount = (reciter.moshaf || []).length;
  const description = `تعرّف إلى القارئ ${reciter.name}، واستمع إلى رواياته المتاحة (${editionCount}) وتصفح السور المرتبطة بكل رواية.`;
  const content = `${breadcrumbHtml(reciter.name)}<h1>القارئ ${escapeHtml(reciter.name)}</h1><p>${escapeHtml(description)}</p>${editions}<p><a href="/browse/#reciters">جميع قراء القرآن الكريم</a></p>`;
  return renderPage({ title: `تلاوات ${reciter.name} (${reciter.id}) | أثير القرآن`, description, canonical, content, schema: pageSchema(`تلاوات ${reciter.name}`, description, canonical, [{ name: reciter.name, url: canonical }]) });
}

async function radioPage(request, env, pathPart) {
  const origin = siteOrigin(request, env);
  if (!origin) return htmlError(request, env, 503, "الإعداد غير مكتمل", "يجب ضبط SITE_URL على نطاق الإنتاج قبل توليد canonical.");
  const radios = await loadRadios();
  const radio = resolveById(pathPart, radios);
  if (!radio) return htmlError(request, env, 404, "الإذاعة غير موجودة", "لم نعثر على إذاعة بهذا العنوان.");
  const canonical = `${origin}${radioPath(radio)}`;
  if (pathPart !== radioSlug(radio) || new URL(request.url).pathname !== new URL(canonical).pathname) return Response.redirect(canonical, 301);
  const duplicateName = radios.filter((item) => item.name === radio.name).length > 1;
  const disambiguator = duplicateName ? ` (رقم ${radio.id})` : "";
  const description = `استمع إلى ${radio.name}${disambiguator} مباشرةً من مصدر البث. يعمل الصوت مباشرةً من مزود الإذاعة، دون تمريره عبر خادم أثير القرآن.`;
  const related = radios.filter((item) => Number(item.id) !== Number(radio.id)).slice(0, 12);
  const content = `${breadcrumbHtml(radio.name)}<h1>${escapeHtml(radio.name)}</h1><p>${escapeHtml(description)}</p>${duplicateName ? `<p>معرّف المحطة: ${radio.id}</p>` : ""}<p>بث إذاعي مباشر من المصدر.</p><audio class="seo-audio" controls preload="none" src="${escapeHtml(radio.url)}" aria-label="استمع مباشرة إلى ${escapeHtml(radio.name)}">متصفحك لا يدعم تشغيل الصوت.</audio><h2>إذاعات أخرى</h2><div class="seo-grid">${related.map((item) => `<a class="seo-card" href="${radioPath(item)}">${escapeHtml(item.name)}<small>بث مباشر</small></a>`).join("")}</div>`;
  return renderPage({ title: `${radio.name}${disambiguator} — بث مباشر | أثير القرآن`, description, canonical, content, schema: pageSchema(radio.name, description, canonical, [{ name: radio.name, url: canonical }]) });
}

async function browsePage(request, env) {
  const origin = siteOrigin(request, env);
  if (!origin) return htmlError(request, env, 503, "الإعداد غير مكتمل", "يجب ضبط SITE_URL على نطاق الإنتاج قبل توليد canonical.");
  const [surahs, reciters, radios] = await Promise.all([loadSurahs(), loadReciters(), loadRadios()]);
  const canonical = `${origin}/browse/`;
  const list = (items, getPath, renderName) => `<ul class="seo-list">${items.map((item) => `<li><a href="${getPath(item)}">${renderName(item)}</a></li>`).join("")}</ul>`;
  const description = `فهرس قابل للتصفح يضم ${surahs.length} سورة، و${reciters.length} قارئًا، و${radios.length} إذاعة قرآنية مع روابط مباشرة إلى صفحات التفاصيل.`;
  const content = `${breadcrumbHtml("فهرس المحتوى")}<h1>فهرس السور والقراء والإذاعات</h1><p>${escapeHtml(description)}</p><section id="surahs"><h2>سور القرآن الكريم (${surahs.length})</h2>${list(surahs, surahPath, (item) => `سورة ${escapeHtml(item.name)} <small>· ${item.numberOfAyahs} آية</small>`)}</section><section id="reciters"><h2>القراء والتلاوات (${reciters.length})</h2>${list(reciters, reciterPath, (item) => `القارئ ${escapeHtml(item.name)}`)}</section><section id="radios"><h2>الإذاعات القرآنية (${radios.length})</h2>${list(radios, radioPath, (item) => escapeHtml(item.name))}</section>`;
  return renderPage({ title: "فهرس السور والقراء والإذاعات | أثير القرآن", description, canonical, content, schema: pageSchema("فهرس السور والقراء والإذاعات", description, canonical) });
}

async function sitemap(request, env) {
  const origin = siteOrigin(request, env);
  if (!origin) return new Response("SITE_URL must be configured to the production HTTPS domain.", { status: 503 });
  const [surahs, reciters, radios] = await Promise.all([loadSurahs(), loadReciters(), loadRadios()]);
  const urls = new Set([`${origin}/`, `${origin}/browse/`]);
  for (const item of surahs) urls.add(`${origin}${surahPath(item)}`);
  for (const item of reciters) urls.add(`${origin}${reciterPath(item)}`);
  for (const item of radios) urls.add(`${origin}${radioPath(item)}`);
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...urls].map((loc) => `<url><loc>${xmlEscape(loc)}</loc></url>`).join("")}</urlset>`;
  return xmlResponse(body);
}

async function robots(request, env) {
  const origin = siteOrigin(request, env);
  const sitemapLine = origin ? `Sitemap: ${origin}/sitemap.xml\n` : "";
  const body = `User-agent: *\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\n${sitemapLine}`;
  return xmlResponse(body, "text/plain; charset=utf-8");
}

async function handleApi(request, context) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/v3\/([^/]+)\/?$/);
  const headers = { "x-robots-tag": "noindex", "cache-control": "no-store" };
  if (!match || !API_ENDPOINTS.has(match[1])) return Response.json({ error: "Not found" }, { status: 404, headers });
  if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  return cachedPublic(request, context, async () => {
    const upstreamUrl = new URL(`${API_BASE}/${match[1]}`);
    for (const [key, value] of url.searchParams) upstreamUrl.searchParams.append(key, value);
    try {
      const response = await fetch(upstreamUrl, { headers: { accept: "application/json" }, cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true } });
      if (!response.ok) return Response.json({ error: "Upstream API unavailable" }, { status: 502, headers });
      return new Response(response.body, { status: 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": BROWSER_CACHE_CONTROL, "cdn-cache-control": EDGE_CACHE_CONTROL, "x-content-type-options": "nosniff", "x-robots-tag": "noindex" } });
    } catch {
      return Response.json({ error: "Upstream API unavailable" }, { status: 502, headers });
    }
  }, { includeSearch: true, cacheSafe: [...url.searchParams.keys()].every((key) => key === "language") });
}

async function homepage(request, env) {
  const origin = siteOrigin(request, env);
  if (!origin) return htmlError(request, env, 503, "الإعداد غير مكتمل", "يجب ضبط SITE_URL على نطاق الإنتاج قبل توليد canonical.");
  const assetRequest = new Request(new URL("/index.html", request.url), request);
  const response = await env.ASSETS.fetch(assetRequest);
  if (!response.ok) return response;
  const homeLinks = `<nav class="seo-home-links" aria-label="روابط المحتوى العام"><h2>استمع إلى القرآن الكريم كما تحب</h2><p>يجمع أثير القرآن إذاعات قرآنية مباشرة، وتلاوات السور بصوت القراء، مع إمكانية حفظ السور للاستماع دون اتصال.</p><a href="/browse/">تصفح سور القرآن الكريم والقراء والإذاعات</a></nav>`;
  return homepageHead(await response.text(), origin, homeLinks);
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (url.pathname === "/index.html") return Response.redirect(new URL("/", request.url), 301);
    if (url.pathname.startsWith("/api/")) return handleApi(request, context);
    if (url.pathname === "/robots.txt") return robots(request, env);
    if (url.pathname === "/sitemap.xml") return cachedPublic(request, context, () => sitemap(request, env), { cacheSafe: !url.search });
    if (url.pathname === "/") return cachedPublic(request, context, () => homepage(request, env), { cacheSafe: !url.search, version: HTML_CACHE_VERSION });
    if (url.pathname === "/browse") return Response.redirect(new URL("/browse/", request.url), 301);
    if (url.pathname === "/browse/") return cachedPublic(request, context, () => browsePage(request, env), { cacheSafe: !url.search, version: HTML_CACHE_VERSION });
    const match = url.pathname.match(/^\/(surah|reciter|radio)\/([^/]+)\/?$/);
    if (match) {
      return cachedPublic(request, context, async () => {
        try {
          if (match[1] === "surah") return surahPage(request, env, match[2]);
          if (match[1] === "reciter") return reciterPage(request, env, match[2]);
          return radioPage(request, env, match[2]);
        } catch {
          return htmlError(request, env, 502, "تعذر تحميل بيانات المحتوى", "مصدر البيانات الخارجي غير متاح مؤقتًا. حاول مرة أخرى لاحقًا.");
        }
      }, { cacheSafe: !url.search, version: HTML_CACHE_VERSION });
    }
    if (/\.[a-z0-9]{1,10}$/i.test(url.pathname)) return env.ASSETS.fetch(request);
    return htmlError(request, env, 404, "الصفحة غير موجودة", "هذا العنوان لا يشير إلى صفحة عامة في أثير القرآن.");
  }
};
