# أثير القرآن

تطبيق عربي RTL مبني بـVite وVanilla JavaScript للاستماع إلى الإذاعات والتلاوات، وتصفح السور والقراء، والتنزيل للاستماع دون اتصال. واجهة التطبيق التفاعلية باقية كما هي؛ يقدّم Cloudflare Worker صفحات HTML عامة مهيأة للفهرسة ويمرر metadata فقط، بينما يصل الصوت مباشرةً إلى مصدره.

## التشغيل المحلي

يتطلب Node.js `^20.19.0` أو `>=22.12.0` وnpm.

```bash
npm ci
npm start
```

يفتح Vite على `http://localhost:5173` لواجهة التطبيق المعتادة. لاختبار صفحات SEO وWorker وStatic Assets محليًا:

```bash
npm run dev:worker
```

يفتح Wrangler عادةً على `http://localhost:8787`. الأوامر الأخرى:

```bash
npm run build
npm test
```

## صفحات الموقع وSEO

الواجهة الحالية ذات تبويبات client-side داخل `/`؛ الإعدادات والتنزيلات والسجل حالات داخل التطبيق وليست صفحات عامة مستقلة. أضيفت صفحات HTML مولدة على Worker، مع بياناتها الأساسية في HTML قبل JavaScript، وروابط عادية قابلة للزحف:

- `/` — الصفحة الرئيسية وروابط إلى المحتوى العام.
- `/browse/` — فهرس كامل وروابط حقيقية للسور والقراء والإذاعات.
- `/surah/{رقم-ومعرّف}` — مثل `/surah/001-alfathh`، مع رقم السورة وعدد الآيات ونوع النزول عندما يتوفر المصدر، وروابط القراء ومشغل صوت مباشر.
- `/reciter/{id-slug}` — بيانات القارئ والروايات والسور المتاحة وروابط صفحاتها.
- `/radio/{id-slug}` — اسم الإذاعة ومشغل مباشر وروابط لإذاعات أخرى.
- `/sitemap.xml` — Sitemap ديناميكي يضم الصفحة الرئيسية والفهرس وصفحات السور والقراء والإذاعات فقط.
- `/robots.txt` — يسمح بالزحف ويعلن رابط Sitemap.

الصفحات العامة لها `title` وdescription وcanonical وOpen Graph وTwitter metadata فريدة و`lang="ar"`، مع JSON-LD من نوع `WebSite`/`WebPage` و`BreadcrumbList` بحسب الصفحة. صفحات الواجهة غير الموجودة ترجع 404 مع `noindex,follow`، وكذلك JSON APIs ترسل `X-Robots-Tag: noindex`. لا توجد نسخ لغوية متعددة، لذلك لا يضاف `hreflang`.

تأتي بيانات السور والقراء والإذاعات من `mp3quran.net`، وعدد الآيات ونوع النزول من [Quran Cloud API](https://api.alquran.cloud/v1/surah). يخزن Worker الاستجابات مؤقتًا على شبكة Cloudflare. لا يمرر Worker الصوت ولا يحفظه.

## نطاق canonical

يضبط `wrangler.toml` قيمة `SITE_URL` الحالية على `https://quran.athirquran.workers.dev`، وهي عنوان الإنتاج المستخدم لتوليد canonical و`og:url` وروابط Sitemap. أبقِ القيمة مطابقة لعنوان الإنتاج الفعلي؛ لا تستبدلها بعنوان تجريبي أو نطاق غير مربوط بالـWorker.

## Cloudflare Workers

`wrangler.toml` يمرر الصفحات العامة و`/api/*` إلى Worker، ويخدم ملفات `dist` عبر Workers Static Assets. صفحات HTML الإضافية تُولد على Worker عند الطلب، لا بخادم Node دائم ولا بـWorkers Sites. لم يتم تنفيذ نشر Cloudflare ضمن مرحلة SEO هذه.

## الصوت والتخزين

- روابط التلاوات والبث تعمل مباشرة من المتصفح؛ التنزيل الصريح للتشغيل دون اتصال يبقى في `IndexedDB`.
- الإعدادات والمفضلة وتقدم السور تحفظ محليًا؛ توفر الإذاعات يعتمد على مزود البث الخارجي.
- `public/sw.js` يخزن واجهة التطبيق دون طلبات metadata الخارجية أو ملفات الصوت.

## البنية

- `index.html`, `app.js`, `styles.css`: التطبيق والواجهة الحالية.
- `src/worker.js`: صفحات المحتوى العامة، metadata، Sitemap وrobots وproxy بيانات API.
- `src/seo.js`, `public/seo.css`: توليد الروابط والـslugs وHTML الدلالي وتنسيق صفحات المحتوى.
- `tests/`: اختبارات وحدات وتكامل لصفحات SEO وWorker.
