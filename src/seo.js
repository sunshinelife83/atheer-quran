export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

const ARABIC_LATIN = {
  ا: "a", أ: "a", إ: "i", آ: "aa", ٱ: "a", ء: "", ؤ: "u", ئ: "i", ة: "h", ى: "a", ي: "y", و: "w",
  ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "dh", ر: "r", ز: "z", س: "s", ش: "sh",
  ص: "s", ض: "d", ط: "t", ظ: "z", ع: "", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", پ: "p", چ: "ch", گ: "g"
};

export function slugify(value = "") {
  const normalized = String(value).normalize("NFKD").replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
  return [...normalized].map((char) => ARABIC_LATIN[char] ?? char).join("")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "content";
}

export const surahSlug = (surah) => `${String(surah.id).padStart(3, "0")}-${slugify(surah.name)}`;
export const reciterSlug = (reciter) => `${reciter.id}-${slugify(reciter.name)}`;
export const radioSlug = (radio) => `${radio.id}-${slugify(radio.name)}`;
export const surahPath = (surah) => `/surah/${surahSlug(surah)}`;
export const reciterPath = (reciter) => `/reciter/${reciterSlug(reciter)}`;
export const radioPath = (radio) => `/radio/${radioSlug(radio)}`;

export function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function renderPage({ title, description, canonical, content, schema, status = 200, robots = "index,follow" }) {
  const ogType = "website";
  const structured = schema ? `<script type="application/ld+json">${jsonLd(schema)}</script>` : "";
  const canonicalTags = canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:url" content="${escapeHtml(canonical)}">` : "";
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${robots}">
${canonicalTags}<meta property="og:type" content="${ogType}"><meta property="og:locale" content="ar_AR"><meta property="og:site_name" content="أثير القرآن">
<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png"><link rel="icon" type="image/png" sizes="512x512" href="/favicon-512.png"><link rel="shortcut icon" type="image/x-icon" href="/favicon.ico"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="preload" href="/fonts/tajawal-arabic-400.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/tajawal-arabic-700.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/seo.css">
${structured}
</head><body class="seo-document">
<header class="topbar"><div class="shell nav-inner"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">۞</span><span class="brand-copy"><span class="brand-title">أثير القرآن</span><span class="brand-tagline">استمع، واحفظ، واستكمل من حيث توقفت</span></span></a><nav aria-label="روابط الموقع"><a class="tab" href="/browse/">فهرس السور والقراء والإذاعات</a></nav></div></header>
<main class="shell main seo-page">${content}</main>
<footer class="shell seo-footer"><a href="/">أثير القرآن</a> · <a href="/browse/">تصفح السور والقراء والإذاعات</a></footer>
</body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=1800", "x-content-type-options": "nosniff" } });
}

export function pageSchema(name, description, canonical, crumbs = []) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: canonical,
    inLanguage: "ar",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: new URL("/", canonical).href },
        { "@type": "ListItem", position: 2, name: "فهرس المحتوى", item: new URL("/browse/", canonical).href },
        ...crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 3, name: crumb.name, item: crumb.url }))
      ]
    }
  };
}

export function audioUrl(server, surahId) {
  const base = String(server || "").replace(/\/+$/, "");
  if (!/^https:\/\//i.test(base)) return "";
  return `${base}/${String(surahId).padStart(3, "0")}.mp3`;
}
