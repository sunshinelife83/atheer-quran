const API = "https://mp3quran.net/api/v3";
const VALID_TABS = new Set(["home", "radios", "library", "downloads", "history", "settings"]);

const SURAH_NAMES = [
  "الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"
];
const MAKKI = new Set([1,6,7,10,11,12,14,15,16,17,18,19,20,21,23,25,26,27,28,29,30,31,32,34,35,36,37,38,39,40,41,42,43,44,45,46,50,51,52,53,54,56,67,68,69,70,71,72,73,74,75,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,100,101,102,103,104,105,106,107,108,109,111,112,113,114]);
const SUWAR = SURAH_NAMES.map((name, index) => ({ id: index + 1, name, makkiah: MAKKI.has(index + 1) ? 1 : 0 }));

const FALLBACK_RADIOS = [
  { id: 1, name: "إذاعة القرآن الكريم من القاهرة", url: "https://stream.radiojar.com/8whg7ytv3v8uv" },
  { id: 2, name: "تفسير القرآن الكريم", url: "https://quraan.us:7010/;" },
  { id: 3, name: "عبد الباسط عبد الصمد", url: "https://server7.mp3quran.net/basit/001.mp3" },
  { id: 4, name: "محمود خليل الحصري", url: "https://server13.mp3quran.net/husr/001.mp3" },
  { id: 5, name: "تكبيرات وذكر", url: "https://stream.radiojar.com/00yp8vy7m4zuv" }
];

const DAILY_LINES = [
  "ورتل القرآن ترتيلًا",
  "ألا بذكر الله تطمئن القلوب",
  "إن هذا القرآن يهدي للتي هي أقوم",
  "فاقرؤوا ما تيسر من القرآن"
];

const ICONS = {
  play: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  starFilled: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
  starEmpty: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
  download: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  chevronLeft: `<svg class="gold" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  music: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  broadcast: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M21 12c-2.7 2.7-7 2.7-9.7 0M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg>`,
  search: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  chevronUp: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`
};

const state = {
  theme: (() => {
    const stored = localStorage.getItem("atheer_theme");
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  })(),
  themeManuallySet: !!localStorage.getItem("atheer_theme"),
  // A previous release may have saved a tab that no longer exists. Never let
  // persisted browser state leave the content panel without a renderer.
  activeTab: (() => {
    const savedTab = localStorage.getItem("atheer_last_tab");
    return VALID_TABS.has(savedTab) ? savedTab : "home";
  })(),
  radioCategory: "all",
  onlyFavoriteRadios: false,
  radios: [],
  categorizedRadios: {},
  reciters: [],
  groupedRewayat: {},
  libraryStep: "rewayat",
  selectedRewayahKey: "",
  selectedReciter: null,
  downloaded: [],
  downloadsStep: "rewayat",
  selectedDownloadRewayah: "",
  selectedDownloadReciterId: null,
  currentAudio: null,
  activeTrackKey: "",
  activeDownloadId: "",
  downloadSuccessId: "",
  activeBlobUrl: "",
  sleepTimerId: null,
  sleepEndsAt: null,
  repeatOne: false,
  autoNext: localStorage.getItem("atheer_auto_next") === "true",
  playerExpanded: false,
  deferredInstall: null,
  volume: Number(localStorage.getItem("atheer_volume")) || 0.8,
  speed: localStorage.getItem("atheer_speed") || "1",
  searches: { radios: "", reciters: "", suwar: "", downloads: "" },
  favoritesRadios: readJson("atheer_favorites_radios", []),
  favoritesReciters: readJson("atheer_favorites_reciters", []),
  progress: readJson("atheer_local_progress", {}),
  downloadingIds: new Set(),
  playerMinimized: false
};

const els = {
  view: document.getElementById("view"),
  tabs: document.querySelectorAll(".tab"),
  tabIndicator: document.getElementById("tabIndicator"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  installApp: document.getElementById("installApp"),
  player: document.getElementById("player"),
  audio: document.getElementById("audio"),
  title: document.getElementById("trackTitle"),
  subtitle: document.getElementById("trackSubtitle"),
  trackIcon: document.getElementById("trackIcon"),
  eqBars: document.getElementById("eqBars"),
  playPause: document.getElementById("playPauseBtn"),
  closePlayer: document.getElementById("closePlayer"),
  seek: document.getElementById("seek"),
  currentTime: document.getElementById("currentTime"),
  duration: document.getElementById("duration"),
  progress: document.getElementById("playerProgress"),
  speed: document.getElementById("speed"),
  volume: document.getElementById("volume"),
  seekRow: document.getElementById("seekRow"),
  liveRow: document.getElementById("liveRow"),
  prev: document.getElementById("prevBtn"),
  next: document.getElementById("nextBtn"),
  repeat: document.getElementById("repeatBtn"),
  sleep: document.getElementById("sleepTimer"),
  expand: document.getElementById("expandPlayer"),
  hidePlayer: document.getElementById("hidePlayerBtn"),
  exitPlayer: document.getElementById("exitPlayerBtn"),
  unhidePlayer: document.getElementById("unhidePlayerBtn")
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .trim();
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function padSurah(id) {
  return String(id).padStart(3, "0");
}

function streamUrl(server, surahId) {
  return `${server.endsWith("/") ? server : `${server}/`}${padSurah(surahId)}.mp3`;
}

function setTheme(theme, persist = true) {
  state.theme = theme;
  document.body.classList.toggle("light", theme === "light");
  els.themeIcon.innerHTML = theme === "light" ? ICONS.sun : ICONS.moon;
  if (persist) {
    state.themeManuallySet = true;
    localStorage.setItem("atheer_theme", theme);
  }
}

function sectionHeader(title, subtitle, searchId, placeholder, value = "") {
  return `
    <div class="section-title">
      <div class="title-copy">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      ${searchId ? `
        <label class="searchbar">
          <span>${ICONS.search}</span>
          <input id="${searchId}" type="search" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}" autocomplete="off" />
        </label>
      ` : ""}
    </div>
  `;
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let viewRevision = 0;
let lastInputKind = "pointer";

window.addEventListener("pointerdown", () => { lastInputKind = "pointer"; }, { passive: true });
window.addEventListener("keydown", () => { lastInputKind = "keyboard"; });

function syncTabIndicator() {
  const activeTab = [...els.tabs].find((tab) => tab.dataset.tab === state.activeTab);
  if (!activeTab || !els.tabIndicator) return;
  const instant = lastInputKind === "keyboard" || reducedMotion.matches;
  els.tabIndicator.classList.toggle("instant", instant);
  requestAnimationFrame(() => {
    els.tabIndicator.style.width = `${activeTab.offsetWidth}px`;
    els.tabIndicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
    if (instant) requestAnimationFrame(() => els.tabIndicator.classList.remove("instant"));
  });
}

function markViewEntries() {
  if (reducedMotion.matches || lastInputKind === "keyboard") return;
  els.view.querySelectorAll(".home-hero, .panel, .quick-card, .card, .settings-panel").forEach((item, index) => {
    if (index > 7) return;
    item.style.setProperty("--entry-index", index);
    item.classList.add("view-item-enter");
  });
}

function setViewHtml(markup, { animate = true } = {}) {
  const revision = ++viewRevision;
  const focused = document.activeElement;
  const restoreId = focused instanceof HTMLInputElement && els.view.contains(focused) ? focused.id : "";
  const selectionStart = restoreId ? focused.selectionStart : null;
  const selectionEnd = restoreId ? focused.selectionEnd : null;

  const pillsScroll = els.view.querySelector('.pills')?.scrollLeft || 0;

  const commit = () => {
    if (revision !== viewRevision) return;
    
    const updateDOM = () => {
      els.view.innerHTML = markup;
      const newPills = els.view.querySelector('.pills');
      if (newPills) newPills.scrollLeft = pillsScroll;
      
      if (restoreId) {
        const replacement = document.getElementById(restoreId);
        if (replacement instanceof HTMLInputElement) {
          replacement.focus({ preventScroll: true });
          replacement.setSelectionRange(selectionStart ?? replacement.value.length, selectionEnd ?? replacement.value.length);
        }
      }
      markViewEntries();
      els.view.dispatchEvent(new CustomEvent("viewcommit"));
    };

    if (animate && !reducedMotion.matches && document.startViewTransition) {
      document.startViewTransition(updateDOM);
    } else {
      updateDOM();
      if (animate && !reducedMotion.matches && !restoreId && lastInputKind !== "keyboard") {
        els.view.animate(
          [{ opacity: 0.72, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 180, easing: "cubic-bezier(0.25, 1, 0.5, 1)" }
        );
      }
    }
  };

  const shouldExit = animate && !reducedMotion.matches && !restoreId && lastInputKind !== "keyboard" && els.view.childElementCount > 0 && !document.startViewTransition;
  if (!shouldExit) {
    commit();
    return;
  }

  const exitAnim = els.view.animate(
    [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-2px)" }],
    { duration: 100, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "both" }
  );
  exitAnim.finished.catch(() => {}).then(() => {
    exitAnim.cancel();
    commit();
  });
}

function acknowledgeControl(element) {
  if (!element || reducedMotion.matches) return;
  element.animate(
    [{ transform: "scale(1)" }, { transform: "scale(0.97)" }, { transform: "scale(1)" }],
    { duration: 120, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
  );
}

function swapButtonIcon(button, markup) {
  if (!button) return;
  const match = markup.match(/d="([^"]+)"/);
  const signature = match ? match[1] : markup;
  if (button.dataset.iconSig === signature) return;
  if (!button.dataset.iconSig && button.innerHTML.includes(signature)) {
    button.dataset.iconSig = signature;
    return;
  }
  button.dataset.iconSig = signature;
  button.innerHTML = markup;
  if (!reducedMotion.matches) {
    button.animate(
      [{ opacity: 0.65, transform: "scale(0.95)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: 140, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
  }
}

function loading(text) {
  setViewHtml(`
    <div class="skeleton-list" role="status" aria-label="${escapeHtml(text)}">
      <span class="skeleton-row"></span><span class="skeleton-row"></span><span class="skeleton-row"></span>
      <p class="loading-text">${escapeHtml(text)}</p>
    </div>
  `);
}

async function fetchRadios() {
  const cached = readJson("atheer_cached_radios", []);
  if (cached.length) {
    state.radios = cached;
    state.categorizedRadios = categorizeRadios(cached);
    fetch(`${API}/radios?language=ar`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data.radios)) {
        state.radios = data.radios;
        state.categorizedRadios = categorizeRadios(data.radios);
        writeJson("atheer_cached_radios", data.radios);
        if (state.activeTab === "radios" || state.activeTab === "home") render();
      }
    }).catch(() => {});
    return;
  }

  try {
    const res = await fetch(`${API}/radios?language=ar`);
    const data = await res.json();
    state.radios = Array.isArray(data.radios) ? data.radios : FALLBACK_RADIOS;
  } catch {
    state.radios = FALLBACK_RADIOS;
  }
  writeJson("atheer_cached_radios", state.radios);
  state.categorizedRadios = categorizeRadios(state.radios);
}

async function fetchReciters() {
  const cached = readJson("atheer_cached_reciters", []);
  if (cached.length) {
    state.reciters = cached;
    state.groupedRewayat = groupReciters(cached);
    fetch(`${API}/reciters?language=ar`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data.reciters)) {
        const sorted = data.reciters.sort((a, b) => a.name.localeCompare(b.name, "ar"));
        state.reciters = sorted;
        state.groupedRewayat = groupReciters(sorted);
        writeJson("atheer_cached_reciters", sorted);
        if (state.activeTab === "library" || state.activeTab === "home") render();
      }
    }).catch(() => {});
    return;
  }

  const res = await fetch(`${API}/reciters?language=ar`);
  const data = await res.json();
  state.reciters = (data.reciters || []).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  writeJson("atheer_cached_reciters", state.reciters);
  state.groupedRewayat = groupReciters(state.reciters);
}

function categorizeRadios(radios) {
  const result = { all: [], reciters: [], tafsir: [], lessons: [], general: [] };
  const tafsir = ["تفسير", "علوم", "فتاوى", "شرح", "دروس", "محاضرات", "التجويد", "تعليم"];
  const lessons = ["قصص", "سيرة", "الصحابة", "الأنبياء", "التاريخ", "موعظة", "خطب"];
  const general = ["تكبيرات", "أذكار", "دعاء", "المنوعات", "عام", "مختارات"];
  radios.forEach((radio) => {
    const name = radio.name || "";
    result.all.push(radio);
    if (tafsir.some((word) => name.includes(word))) result.tafsir.push(radio);
    else if (lessons.some((word) => name.includes(word))) result.lessons.push(radio);
    else if (general.some((word) => name.includes(word))) result.general.push(radio);
    else result.reciters.push(radio);
  });
  return result;
}

function groupReciters(reciters) {
  const standards = [
    { key: "hafs", name: "رواية حفص عن عاصم", words: ["حفص عن عاصم", "حفص", "المرتل", "المعلم"] },
    { key: "warsh", name: "رواية ورش عن نافع", words: ["ورش عن نافع", "ورش"] },
    { key: "douri", name: "رواية الدوري عن أبي عمرو", words: ["الدوري عن أبي عمرو", "الدوري", "الدورى"] },
    { key: "qaloon", name: "رواية قالون عن نافع", words: ["قالون عن نافع", "قالون"] },
    { key: "shobah", name: "رواية شعبة عن عاصم", words: ["شعبة عن عاصم", "شعبة"] },
    { key: "khalaf", name: "رواية خلف عن حمزة", words: ["خلف عن حمزة", "خلف"] },
    { key: "bazzi", name: "رواية البزي عن ابن كثير", words: ["البزي عن ابن كثير", "البزي"] },
    { key: "qunbul", name: "رواية قنبل عن ابن كثير", words: ["قنبل عن ابن كثير", "قنبل"] },
    { key: "susi", name: "رواية السوسي عن أبي عمرو", words: ["السوسي عن أبي عمرو", "السوسي"] }
  ];
  const groups = {};
  reciters.forEach((reciter) => {
    (reciter.moshaf || []).forEach((moshaf) => {
      const label = normalize(moshaf.name);
      let selected = standards.find((item) => item.words.some((word) => label.includes(normalize(word))));
      if (!selected) selected = { key: "other", name: "روايات وقراءات أخرى" };
      groups[selected.key] ||= { riwayahName: selected.name, reciters: [] };
      groups[selected.key].reciters.push({
        reciterId: reciter.id,
        reciterName: reciter.name,
        letter: reciter.letter,
        moshaf
      });
    });
  });
  Object.values(groups).forEach((group) => group.reciters.sort((a, b) => a.reciterName.localeCompare(b.reciterName, "ar")));
  return groups;
}

function render() {
  if (!VALID_TABS.has(state.activeTab)) state.activeTab = "home";
  localStorage.setItem("atheer_last_tab", state.activeTab);
  els.tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === state.activeTab;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  syncTabIndicator();
  try {
    if (state.activeTab === "home") renderHome();
    else if (state.activeTab === "radios") renderRadios();
    else if (state.activeTab === "library") renderLibrary();
    else if (state.activeTab === "downloads") renderDownloads();
    else if (state.activeTab === "history") renderHistory();
    else if (state.activeTab === "settings") renderSettings();
  } catch (err) {
    console.error("[أثير] render error:", err);
    setViewHtml(empty("حدث خطأ في العرض", "يرجى إعادة تحميل الصفحة أو تجربة قسم آخر."));
  }
}

function getLatestProgress() {
  return Object.values(state.progress).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))[0] || null;
}

function downloadedSizeMb() {
  return state.downloaded.reduce((sum, item) => sum + (parseFloat(item.fileSize) || 0), 0);
}

function isCurrentSurahPlaying(reciterId, surahId) {
  const track = state.currentAudio;
  return !!track && !track.isRadio && !els.audio.paused
    && Number(track.reciterId) === Number(reciterId)
    && Number(track.surahId) === Number(surahId);
}

function resumeActionMarkup(latest, playing) {
  return `
    <span class="resume-icon" aria-hidden="true">${playing ? ICONS.pause : ICONS.play}</span>
    <span class="resume-label">${playing ? `إيقاف ${escapeHtml(latest.surahName)}` : `استكمل ${escapeHtml(latest.surahName)}`}</span>
  `;
}

function renderHome() {
  const latest = getLatestProgress();
  const latestPlaying = latest && isCurrentSurahPlaying(latest.reciterId, latest.surahId);
  const favRadios = state.radios.filter((radio) => state.favoritesRadios.includes(radio.id)).slice(0, 4);
  const recentDownloads = [...state.downloaded].sort((a, b) => (b.downloadedAt || "").localeCompare(a.downloadedAt || "")).slice(0, 4);
  const sizeMb = downloadedSizeMb();
  const dayLine = DAILY_LINES[new Date().getDate() % DAILY_LINES.length];

  setViewHtml(`
    <div class="home-grid">
      <section class="home-hero">
        <div class="home-copy">
          <span class="badge">جلسة هادئة اليوم</span>
          <h2>${escapeHtml(dayLine)}</h2>
          <p>كل شيء قريب: آخر استماع، إذاعاتك المفضلة، المكتبة الصوتية، والتنزيلات المحفوظة على هذا الجهاز.</p>
          <div class="home-actions">
            ${latest
              ? `<button class="cta-button ${latestPlaying ? "is-playing" : ""}" data-resume-latest aria-label="${latestPlaying ? "إيقاف مؤقت" : "استكمال الاستماع"}">
                  ${resumeActionMarkup(latest, latestPlaying)}
                 </button>`
              : `<button class="cta-button" data-go-tab="radios">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg>
                  ابدأ بالاستماع
                 </button>`
            }
            <button class="cta-button secondary" data-go-tab="library">تصفح المكتبة الصوتية</button>
          </div>
        </div>
      </section>

      <aside class="panel">
        <h3>جلساتك على هذا الجهاز</h3>
        <p>تابع ما يهمك من دون ازدحام التفاصيل.</p>
        <div class="mini-list">
          ${latest
            ? miniItem(latest.surahName, `${latest.reciterName} · ${formatTime(latest.timestamp)} من ${formatTime(latest.duration)}`, "data-resume-latest")
            : miniItem("لا يوجد استماع محفوظ", "سيظهر هنا آخر موضع توقفت عنده", "data-go-tab=\"radios\"")}
          ${miniItem("التنزيلات", `${state.downloaded.length} ملف · ${sizeMb.toFixed(1)} MB`, "data-go-tab=\"downloads\"")}
          ${miniItem("المفضلة", `${state.favoritesRadios.length} إذاعة · ${state.favoritesReciters.length} قارئ`, "data-go-tab=\"radios\"")}
        </div>
      </aside>
    </div>

    <div class="quick-grid">
      <button class="quick-card" data-go-tab="radios">
        <div>
          <strong>بث مباشر</strong>
          <span>ادخل إلى الإذاعات النشطة</span>
        </div>
        <span class="gold" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </span>
      </button>
      <button class="quick-card" data-go-tab="library">
        <div>
          <strong>المكتبة الصوتية</strong>
          <span>اختر الرواية والقارئ والسورة</span>
        </div>
        <span class="gold" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </span>
      </button>
    </div>

    <div class="home-grid" style="margin-top:20px">
      <section class="panel">
        <h3>إذاعات مفضلة</h3>
        <div class="mini-list">
          ${favRadios.length
            ? favRadios.map((radio) => miniItem(radio.name, "بث مباشر", `data-play-radio="${radio.id}"`)).join("")
            : miniItem("لا توجد إذاعات مفضلة", "اضغط النجمة في بطاقات الراديو", "data-go-tab=\"radios\"")}
        </div>
      </section>
      <section class="panel">
        <h3>آخر التنزيلات</h3>
        <div class="mini-list">
          ${recentDownloads.length
            ? recentDownloads.map((track) => miniItem(track.surahName, track.reciterName, `data-play-download="${track.id}"`)).join("")
            : miniItem("لا توجد تنزيلات", "احفظ السور من المكتبة للاستماع دون اتصال", "data-go-tab=\"library\"")}
        </div>
      </section>
    </div>
  `);
}

function stat(label, value) {
  return `
    <div class="stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </div>
  `;
}

function miniItem(title, subtitle, attrs) {
  const isPlaybackItem = /data-play-(?:radio|download)=|data-resume-latest/.test(attrs);
  const trailingIcon = isPlaybackItem
    ? `<span class="mini-item-icon" aria-hidden="true">${ICONS.play}</span>`
    : `<svg class="gold" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>`;
  return `
    <button class="mini-item clickable" ${attrs}>
      <div>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(subtitle)}</span>
      </div>
      ${trailingIcon}
    </button>
  `;
}

function renderRadios() {
  if (!state.radios.length) {
    loading("جاري تحميل الإذاعات...");
    fetchRadios().then(render);
    return;
  }

  const labels = [
    ["all", "كل الإذاعات"],
    ["reciters", "إذاعات القراء"],
    ["tafsir", "التفسير والعلوم"],
    ["lessons", "القصص والدروس"],
    ["general", "عام"]
  ];
  let list = state.onlyFavoriteRadios
    ? state.radios.filter((radio) => state.favoritesRadios.includes(radio.id))
    : (state.categorizedRadios[state.radioCategory] || state.radios);
  const query = normalize(state.searches.radios);
  if (query) list = list.filter((radio) => normalize(radio.name).includes(query));

  setViewHtml(`
    ${sectionHeader("الإذاعات والبث المباشر", `${state.radios.length} إذاعة متاحة`, "radioSearch", "ابحث عن إذاعة أو شيخ...", state.searches.radios)}
    <div class="pills">
      ${labels.map(([key, label]) => `<button class="pill ${state.radioCategory === key && !state.onlyFavoriteRadios ? "active" : ""}" data-radio-cat="${key}">${label} <span class="meta">${(state.categorizedRadios[key] || []).length}</span></button>`).join("")}
      <button class="pill ${state.onlyFavoriteRadios ? "active" : ""}" data-fav-radios>المفضلة ${state.favoritesRadios.length}</button>
    </div>
    ${list.length ? `<div class="grid">${list.map(radioCard).join("")}</div>` : empty("لا توجد نتائج", "جرّب تعديل البحث أو اختر تصنيفًا آخر.")}
  `);
}

function radioCard(radio) {
  const playing = state.currentAudio?.isRadio && state.currentAudio.url === radio.url && !els.audio.paused;
  const favorite = state.favoritesRadios.includes(radio.id);
  return `
    <article class="card ${playing ? "playing" : ""}">
      <button class="play-button ${playing ? "active" : ""}" data-play-radio="${radio.id}" title="تشغيل">${playing ? ICONS.pause : ICONS.play}</button>
      <div>
        <h3>${escapeHtml(radio.name)}</h3>
        <span class="live-badge"><i class="live-dot"></i>${playing ? "قيد التشغيل" : "بث مباشر"}</span>
      </div>
      <button class="download-button ${favorite ? "saved" : ""}" data-fav-radio="${radio.id}" title="المفضلة">${favorite ? ICONS.starFilled : ICONS.starEmpty}</button>
    </article>
  `;
}

function renderLibrary() {
  if (!Object.keys(state.groupedRewayat).length) {
    loading("جاري جلب القراء والروايات...");
    Promise.all([fetchReciters(), refreshDownloads()]).then(render).catch(() => {
      setViewHtml(empty("تعذر تحميل المكتبة", "تحقق من الاتصال بالإنترنت ثم أعد المحاولة."));
    });
    return;
  }

  if (state.libraryStep === "rewayat") {
    setViewHtml(`
      ${sectionHeader("المكتبة الصوتية", "اختر رواية لاستعراض القراء المتوفرين", "", "")}
      <div class="grid">${Object.entries(state.groupedRewayat).map(([key, group]) => `
        <article class="card clickable" data-open-rewayah="${key}">
          <div>
            <h3>${escapeHtml(group.riwayahName)}</h3>
            <p>${group.reciters.length} قارئ متوفر</p>
          </div>
          ${ICONS.chevronLeft}
        </article>
      `).join("")}</div>
    `);
    return;
  }

  if (state.libraryStep === "reciters") {
    const group = state.groupedRewayat[state.selectedRewayahKey];
    const query = normalize(state.searches.reciters);
    const list = group.reciters.filter((reciter) => normalize(reciter.reciterName).includes(query));
    setViewHtml(`
      <div class="crumb">
        <button class="back-button" data-back-library>العودة للروايات</button>
        ${sectionHeader(group.riwayahName, "اختر قارئًا لعرض السور", "reciterSearch", "ابحث عن اسم القارئ...", state.searches.reciters)}
      </div>
      ${list.length ? `<div class="grid">${list.map(reciterCard).join("")}</div>` : empty("لا يوجد قراء", "لا توجد أسماء تطابق البحث الحالي.")}
    `);
    return;
  }

  const reciter = state.selectedReciter;
  const group = state.groupedRewayat[state.selectedRewayahKey];
  const available = (reciter.moshaf.surah_list || "").split(",").map((x) => Number(x.trim())).filter(Boolean);
  const query = normalize(state.searches.suwar);
  const suwar = SUWAR.filter((surah) => available.includes(surah.id) && normalize(surah.name).includes(query));

  setViewHtml(`
    <div class="crumb">
      <button class="back-button" data-back-library>العودة للقراء</button>
      ${sectionHeader(`سور القرآن - ${reciter.reciterName}`, `${reciter.moshaf.name} - ${group.riwayahName}`, "surahSearch", "ابحث عن اسم السورة...", state.searches.suwar)}
    </div>
    ${suwar.length ? `<div class="grid">${suwar.map((surah) => surahCard(surah, reciter, group.riwayahName)).join("")}</div>` : empty("لا توجد سور", "لا توجد سورة تطابق البحث الحالي.")}
  `);
}

function reciterCard(reciter) {
  const favorite = state.favoritesReciters.includes(reciter.reciterId);
  return `
    <article class="card">
      <div class="clickable" data-open-reciter="${reciter.reciterId}" data-moshaf="${reciter.moshaf.id}">
        <h3>الشيخ ${escapeHtml(reciter.reciterName)}</h3>
        <p>${reciter.moshaf.surah_total === 114 ? "المصحف كامل" : `${reciter.moshaf.surah_total} سورة`}</p>
      </div>
      <button class="download-button ${favorite ? "saved" : ""}" data-fav-reciter="${reciter.reciterId}" title="المفضلة">${favorite ? ICONS.starFilled : ICONS.starEmpty}</button>
    </article>
  `;
}

function surahCard(surah, reciter, riwayahName) {
  const id = `${riwayahName}_${reciter.reciterId}_${surah.id}`;
  const downloaded = state.downloaded.some((item) => item.id === id);
  const downloading = state.downloadingIds.has(id);
  const trackKey = `${reciter.reciterId}_${surah.id}`;
  const playing = state.activeTrackKey === trackKey && !els.audio.paused;
  return `
    <article class="card ${playing ? "playing" : ""}">
      <div class="row-actions">
        <button class="play-button ${playing ? "active" : ""}" data-play-surah="${surah.id}" data-reciter="${reciter.reciterId}" data-moshaf="${reciter.moshaf.id}" title="تشغيل">${playing ? ICONS.pause : ICONS.play}</button>
        ${downloaded
          ? `<span class="saved-badge ${state.downloadSuccessId === id ? "saved-confirm" : ""}"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-inline-end:4px;"><polyline points="20 6 9 17 4 12"/></svg>محفوظ</span><button class="download-button delete" data-delete-download="${id}" title="حذف">${ICONS.delete}</button>`
          : `<button class="download-button ${downloading ? "is-loading" : ""}" data-download-surah="${surah.id}" data-reciter="${reciter.reciterId}" data-moshaf="${reciter.moshaf.id}" title="${downloading ? "جاري التنزيل" : "تنزيل"}" aria-label="${downloading ? "جاري تنزيل السورة" : "تنزيل السورة"}" aria-busy="${downloading}" ${downloading ? "disabled" : ""}>${ICONS.download}</button>`}
      </div>
      <div>
        <h4>سورة ${escapeHtml(surah.name)}</h4>
        <p>${surah.makkiah ? "مكية" : "مدنية"} - رقم ${surah.id}</p>
      </div>
    </article>
  `;
}

async function renderDownloads() {
  try {
    await refreshDownloads();
  } catch (err) {
    console.warn("[أثير] refreshDownloads failed:", err);
  }
  const sizeMb = downloadedSizeMb();
  if (!state.downloaded.length) {
    setViewHtml(empty("جاهز للتنزيل والاستماع دون اتصال", "لم يتم تنزيل أي ملف بعد. انتقل إلى المكتبة الصوتية واختر السور التي تريد حفظها.", `<button class="pill active" data-go-tab="library">افتح المكتبة الصوتية</button>`));
    return;
  }

  const tree = buildDownloadTree();
  if (state.downloadsStep === "rewayat") {
    setViewHtml(`
      ${sectionHeader("الملفات المحفوظة على جهازك", "مصنفة حسب الروايات والقراء وتشغيلها لا يحتاج اتصالًا", "", "")}
      <div class="storage-bar">
        <strong>${state.downloaded.length} ملف محفوظ - ${sizeMb.toFixed(1)} ميجابايت</strong>
        <div class="storage-track"><span style="width:${Math.min(100, (sizeMb / 1024) * 100)}%"></span></div>
      </div>
      <div class="grid">${Object.entries(tree).map(([riwayah, reciters]) => {
        const total = Object.values(reciters).reduce((sum, item) => sum + item.tracks.length, 0);
        return `<article class="card clickable" data-open-download-rewayah="${escapeHtml(riwayah)}"><div><h3>${escapeHtml(riwayah)}</h3><p>${Object.keys(reciters).length} قارئ - ${total} ملف</p></div>${ICONS.chevronLeft}</article>`;
      }).join("")}</div>
    `);
    return;
  }

  if (state.downloadsStep === "reciters") {
    const reciters = tree[state.selectedDownloadRewayah] || {};
    setViewHtml(`
      <div class="crumb"><button class="back-button" data-back-downloads>العودة للروايات</button><div class="title-copy"><h2>${escapeHtml(state.selectedDownloadRewayah)}</h2><p>اختر الشيخ لفتح ملفاته الصوتية</p></div></div>
      <div class="grid">${Object.entries(reciters).map(([id, reciter]) => `<article class="card clickable" data-open-download-reciter="${id}"><div><h3>الشيخ ${escapeHtml(reciter.reciterName)}</h3><p>${reciter.tracks.length} سور محملة</p></div>${ICONS.chevronLeft}</article>`).join("")}</div>
    `);
    return;
  }

  const reciter = tree[state.selectedDownloadRewayah]?.[state.selectedDownloadReciterId];
  const query = normalize(state.searches.downloads);
  const tracks = (reciter?.tracks || []).filter((track) => normalize(track.surahName).includes(query));
  setViewHtml(`
    <div class="crumb">
      <button class="back-button" data-back-downloads>العودة للقراء</button>
      ${sectionHeader(`ملفات الشيخ ${reciter?.reciterName || ""}`, state.selectedDownloadRewayah, "downloadSearch", "ابحث في السور المحملة...", state.searches.downloads)}
    </div>
    ${tracks.length ? `<div class="grid">${tracks.map(downloadCard).join("")}</div>` : empty("لا توجد سور", "لا توجد سورة محفوظة تطابق البحث.")}
  `);
}

function downloadCard(track) {
  const playing = state.activeDownloadId === track.id && !els.audio.paused;
  return `
    <article class="card ${playing ? "playing" : ""}">
      <div class="row-actions">
        <button class="play-button ${playing ? "active" : ""}" data-play-download="${track.id}" title="تشغيل">${playing ? ICONS.pause : ICONS.play}</button>
        <button class="download-button delete" data-delete-download="${track.id}" title="حذف">${ICONS.delete}</button>
      </div>
      <div>
        <h4>${escapeHtml(track.surahName)}</h4>
        <p>${escapeHtml(track.fileSize || "")} - رقم ${track.surahId}</p>
      </div>
    </article>
  `;
}

function renderHistory() {
  const items = Object.entries(state.progress).sort((a, b) => (b[1].updatedAt || "").localeCompare(a[1].updatedAt || ""));
  setViewHtml(`
    ${sectionHeader("سجل الاستماع", "تقدم محفوظ محليًا على هذا المتصفح", "", "")}
    ${items.length ? `<div class="grid">${items.map(([key, item]) => {
      const pct = Math.min(100, Math.round((item.timestamp / Math.max(item.duration || 1, 1)) * 100));
      return `
        <article class="card clickable" data-history-play="${key}">
          <div>
            <h3>${escapeHtml(item.surahName)} - الشيخ ${escapeHtml(item.reciterName)}</h3>
            <p>${escapeHtml(item.riwayahName || "")}</p>
          </div>
          <div>
            <strong class="gold">${formatTime(item.timestamp)} / ${formatTime(item.duration)}</strong>
            <div class="progress-mini"><span style="width:${pct}%"></span></div>
          </div>
        </article>
      `;
    }).join("")}</div>` : empty("لا يوجد سجل استماع بعد", "ابدأ الاستماع لأي سورة وسنحفظ تقدمك هنا تلقائيًا.")}
  `);
}

function renderSettings() {
  setViewHtml(`
    ${sectionHeader("الإعدادات", "اضبط طريقة الاستماع على هذا الجهاز", "", "")}
    <section class="settings-panel" aria-label="إعدادات التشغيل">
      <div class="settings-row">
        <div>
          <h3>التشغيل التلقائي للسورة التالية</h3>
          <p>عند انتهاء السورة الحالية، انتقل تلقائيًا إلى السورة التالية من المصحف نفسه.</p>
        </div>
        <button class="switch ${state.autoNext ? "active" : ""}" type="button" role="switch" aria-checked="${state.autoNext}" data-auto-next>
          <span class="switch-thumb" aria-hidden="true"></span>
          <span class="sr-only">${state.autoNext ? "إيقاف التشغيل التلقائي للسورة التالية" : "تفعيل التشغيل التلقائي للسورة التالية"}</span>
        </button>
      </div>
    </section>
  `);
}

function empty(title, text, action = "") {
  return `<div class="empty"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>${action}</div>`;
}

function buildDownloadTree() {
  const tree = {};
  state.downloaded.forEach((item) => {
    tree[item.riwayahName] ||= {};
    tree[item.riwayahName][item.reciterId] ||= { reciterName: item.reciterName, tracks: [] };
    tree[item.riwayahName][item.reciterId].tracks.push(item);
  });
  Object.values(tree).forEach((reciters) => Object.values(reciters).forEach((reciter) => reciter.tracks.sort((a, b) => a.surahId - b.surahId)));
  return tree;
}

function currentLibraryReciter(reciterId, moshafId) {
  const group = state.groupedRewayat[state.selectedRewayahKey];
  return group?.reciters.find((reciter) => reciter.reciterId === Number(reciterId) && reciter.moshaf.id === Number(moshafId));
}

function findReciter(reciterId) {
  for (const group of Object.values(state.groupedRewayat)) {
    const found = group.reciters.find((r) => r.reciterId === Number(reciterId));
    if (found) return found;
  }
  return null;
}

function playRadio(id) {
  const radio = state.radios.find((item) => item.id === Number(id));
  if (!radio) return;
  if (state.currentAudio?.url === radio.url && !els.audio.paused) {
    els.audio.pause();
    return;
  }
  playAudio({ url: radio.url, title: radio.name, subtitle: "بث مباشر", isRadio: true });
}

function toggleCurrentSurah(reciterId, surahId) {
  const track = state.currentAudio;
  const isSameSurah = track && !track.isRadio
    && Number(track.reciterId) === Number(reciterId)
    && Number(track.surahId) === Number(surahId);
  if (!isSameSurah) return false;

  if (els.audio.paused) els.audio.play().catch(() => {});
  else els.audio.pause();
  updatePlayer();
  return true;
}

function playSurah(surahId, reciterId, moshafId) {
  if (toggleCurrentSurah(reciterId, surahId)) return;
  const reciter = currentLibraryReciter(reciterId, moshafId);
  if (!reciter) return;
  const surah = SUWAR.find((item) => item.id === Number(surahId));
  const group = state.groupedRewayat[state.selectedRewayahKey];
  const id = `${group.riwayahName}_${reciter.reciterId}_${surah.id}`;
  const surahList = (reciter.moshaf.surah_list || "").split(",").map((x) => Number(x.trim())).filter(Boolean);
  const downloaded = state.downloaded.find((item) => item.id === id);
  if (downloaded) {
    playDownloaded(id);
    return;
  }
  playAudio({
    url: streamUrl(reciter.moshaf.server, surah.id),
    title: `سورة ${surah.name}`,
    subtitle: reciter.reciterName,
    isRadio: false,
    surahId: surah.id,
    reciterId: reciter.reciterId,
    moshafId: reciter.moshaf.id,
    moshafName: reciter.moshaf.name,
    riwayahName: group.riwayahName,
    serverUrl: reciter.moshaf.server,
    surahList
  });
}

async function playDownloaded(id) {
  const record = await getOfflineAudio(id);
  if (!record?.audioBlob) {
    alert("تعذر قراءة الملف المحفوظ.");
    return;
  }
  if (toggleCurrentSurah(record.reciterId, record.surahId)) return;
  if (state.activeBlobUrl) URL.revokeObjectURL(state.activeBlobUrl);
  state.activeBlobUrl = URL.createObjectURL(record.audioBlob);
  const dlReciter = findReciter(record.reciterId);
  const surahList = dlReciter ? (dlReciter.moshaf.surah_list || "").split(",").map((x) => Number(x.trim())).filter(Boolean) : null;
  playAudio({
    url: state.activeBlobUrl,
    title: record.surahName,
    subtitle: record.reciterName,
    isRadio: false,
    surahId: record.surahId,
    reciterId: record.reciterId,
    riwayahName: record.riwayahName,
    serverUrl: record.serverUrl,
    downloadedId: record.id,
    surahList
  });
}

function playAudio(track) {
  state.currentAudio = track;
  state.activeTrackKey = track.isRadio ? "" : `${track.reciterId}_${track.surahId}`;
  state.activeDownloadId = track.downloadedId || "";
  els.audio.src = track.url;
  els.audio.loop = state.repeatOne && !track.isRadio;
  els.audio.playbackRate = Number(els.speed.value);
  els.audio.volume = Number(els.volume.value);
  els.audio.play().then(updatePlayer).catch((err) => {
    if (err.name !== "AbortError") updatePlayer();
  });
  updatePlayer();
  if (!track.isRadio) {
    const saved = state.progress[state.activeTrackKey];
    if (saved && saved.timestamp > 5 && saved.timestamp < (saved.duration || 0) - 10) {
      els.audio.dataset.resumeTime = saved.timestamp;
    } else {
      delete els.audio.dataset.resumeTime;
    }
  } else {
    delete els.audio.dataset.resumeTime;
  }
}

function playAdjacent(direction) {
  const track = state.currentAudio;
  if (!track || track.isRadio || !track.surahId || !track.serverUrl) return;
  const nextId = track.surahId + direction;
  if (nextId < 1 || nextId > 114) return;
  if (track.surahList && !track.surahList.includes(nextId)) return;
  playAudio({
    ...track,
    url: streamUrl(track.serverUrl, nextId),
    title: `سورة ${SURAH_NAMES[nextId - 1]}`,
    surahId: nextId,
    downloadedId: ""
  });
}

function resumeLatest() {
  const latest = getLatestProgress();
  if (!latest) return;
  if (toggleCurrentSurah(latest.reciterId, latest.surahId)) return;
  const downloaded = state.downloaded.find((d) => d.reciterId === latest.reciterId && d.surahId === latest.surahId);
  if (downloaded) playDownloaded(downloaded.id);
  else if (latest.serverUrl) playAudio({ ...latest, url: streamUrl(latest.serverUrl, latest.surahId), title: latest.surahName, subtitle: latest.reciterName, isRadio: false });
}

function updatePlayer() {
  const track = state.currentAudio;
  els.player.classList.toggle("player-hidden", !track || state.playerMinimized);
  els.unhidePlayer.classList.toggle("fab-hidden", !track || !state.playerMinimized);
  els.player.classList.toggle("expanded", state.playerExpanded);
  els.player.classList.toggle("is-playing", !!track && !els.audio.paused);
  els.repeat.classList.toggle("active", state.repeatOne);
  els.expand.innerHTML = state.playerExpanded ? ICONS.chevronDown : ICONS.chevronUp;
  els.expand.setAttribute("aria-expanded", String(state.playerExpanded));
  syncPlayingCards();
  if (!track) return;
  els.title.textContent = track.title;
  els.subtitle.textContent = track.isRadio ? "بث مباشر" : `${track.subtitle}${track.riwayahName ? ` - ${track.riwayahName}` : ""}`;
  els.trackIcon.innerHTML = track.isRadio ? ICONS.broadcast : ICONS.music;
  els.seekRow.classList.toggle("hidden", track.isRadio);
  els.liveRow.classList.toggle("hidden", !track.isRadio);
  els.eqBars.classList.toggle("hidden", els.audio.paused);
  els.speed.disabled = track.isRadio;
  els.prev.disabled = track.isRadio;
  els.next.disabled = track.isRadio;
  swapButtonIcon(els.playPause, els.audio.paused ? ICONS.play : ICONS.pause);
}

function syncPlayingCards() {
  const track = state.currentAudio;
  const paused = els.audio.paused;
  document.querySelectorAll(".card, .mini-item[data-play-radio], .mini-item[data-play-download], .mini-item[data-resume-latest]").forEach((container) => {
    const isMiniItem = container.matches(".mini-item");
    const radioBtn = isMiniItem ? (container.matches("[data-play-radio]") ? container : null) : container.querySelector("[data-play-radio]");
    const surahBtn = isMiniItem ? null : container.querySelector("[data-play-surah]");
    const dlBtn = isMiniItem ? (container.matches("[data-play-download]") ? container : null) : container.querySelector("[data-play-download]");
    const resumeBtn = isMiniItem ? (container.matches("[data-resume-latest]") ? container : null) : null;
    let playing = false;
    if (radioBtn && track && track.isRadio) {
      const radio = state.radios.find((r) => r.id === Number(radioBtn.dataset.playRadio));
      playing = !!radio && radio.url === track.url && !paused;
    } else if (surahBtn && track && !track.isRadio) {
      playing = `${track.reciterId}_${track.surahId}` === `${surahBtn.dataset.reciter}_${surahBtn.dataset.playSurah}` && !paused;
    } else if (dlBtn && track && track.downloadedId) {
      playing = track.downloadedId === dlBtn.dataset.playDownload && !paused;
    } else if (resumeBtn) {
      const latest = getLatestProgress();
      playing = !!latest && isCurrentSurahPlaying(latest.reciterId, latest.surahId);
    }
    container.classList.toggle("playing", playing);
    const btn = radioBtn || surahBtn || dlBtn || resumeBtn;
    if (btn) {
      const iconTarget = isMiniItem ? btn.querySelector(".mini-item-icon") : btn;
      if (iconTarget) swapButtonIcon(iconTarget, playing ? ICONS.pause : ICONS.play);
      if (!isMiniItem) {
        btn.classList.toggle("active", playing);
        btn.title = playing ? "إيقاف مؤقت" : "تشغيل";
        btn.setAttribute("aria-label", playing ? "إيقاف مؤقت" : "تشغيل");
      }
    }
  });
  syncHomeResumeControls();
}

function syncHomeResumeControls() {
  const latest = getLatestProgress();
  const playing = !!latest && isCurrentSurahPlaying(latest.reciterId, latest.surahId);
  document.querySelectorAll(".cta-button[data-resume-latest]").forEach((button) => {
    button.classList.toggle("is-playing", playing);
    button.setAttribute("aria-label", playing ? "إيقاف مؤقت" : "استكمال الاستماع");
    if (latest) button.innerHTML = resumeActionMarkup(latest, playing);
  });
}

els.view.addEventListener("viewcommit", () => {
  syncPlayingCards();
  syncHomeResumeControls();
});

function saveCurrentProgress(force = false) {
  const track = state.currentAudio;
  if (!track || track.isRadio || !track.reciterId || !track.surahId) return;
  const duration = Math.round(els.audio.duration || 0);
  const timestamp = Math.round(els.audio.currentTime || 0);
  if (!force && timestamp % 5 !== 0) return;
  state.progress[`${track.reciterId}_${track.surahId}`] = {
    surahId: track.surahId,
    surahName: track.title,
    reciterId: track.reciterId,
    reciterName: track.subtitle,
    moshafId: track.moshafId || 0,
    moshafName: track.moshafName || "",
    riwayahName: track.riwayahName || "",
    serverUrl: track.serverUrl || "",
    timestamp,
    duration,
    updatedAt: new Date().toISOString()
  };
  writeJson("atheer_local_progress", state.progress);
}

async function downloadSurah(surahId, reciterId, moshafId) {
  const reciter = currentLibraryReciter(reciterId, moshafId);
  const surah = SUWAR.find((item) => item.id === Number(surahId));
  const group = state.groupedRewayat[state.selectedRewayahKey];
  if (!reciter || !surah || !group) return;
  const id = `${group.riwayahName}_${reciter.reciterId}_${surah.id}`;
  if (state.downloaded.some((item) => item.id === id) || state.downloadingIds.has(id)) return;
  state.downloadingIds.add(id);
  renderLibrary();
  try {
    const response = await fetch(streamUrl(reciter.moshaf.server, surah.id));
    if (!response.ok) throw new Error("download failed");
    const blob = await response.blob();
    await saveOfflineAudio({
      id,
      riwayahName: group.riwayahName,
      reciterId: reciter.reciterId,
      reciterName: reciter.reciterName,
      surahId: surah.id,
      surahName: `سورة ${surah.name}`,
      serverUrl: reciter.moshaf.server,
      downloadedAt: new Date().toISOString(),
      fileSize: `${(blob.size / 1024 / 1024).toFixed(1)} ميجابايت`,
      audioBlob: blob
    });
    await refreshDownloads();
    state.downloadSuccessId = id;
  } catch {
    alert("تعذر إتمام التنزيل. يمكنك الاستماع مباشرة عند توفر الاتصال.");
  } finally {
    state.downloadingIds.delete(id);
    render();
    if (state.downloadSuccessId === id) {
      setTimeout(() => { state.downloadSuccessId = ""; }, 260);
    }
  }
}

const DB_NAME = "AtheerQuranOfflineDB";
const STORE = "offline_audios";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveOfflineAudio(record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getOfflineAudio(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteOfflineAudio(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function refreshDownloads() {
  const db = await openDb();
  state.downloaded = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result || []).map(({ audioBlob, ...meta }) => meta));
    request.onerror = () => reject(request.error);
  });
}

function setSleepTimer(minutes) {
  clearTimeout(state.sleepTimerId);
  state.sleepTimerId = null;
  state.sleepEndsAt = null;
  if (!minutes) return;
  state.sleepEndsAt = Date.now() + minutes * 60 * 1000;
  state.sleepTimerId = setTimeout(() => {
    els.audio.pause();
    els.sleep.value = "0";
    state.sleepEndsAt = null;
  }, minutes * 60 * 1000);
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-tab],[data-go-tab],[data-radio-cat],[data-fav-radios],[data-play-radio],[data-fav-radio],[data-open-rewayah],[data-open-reciter],[data-back-library],[data-fav-reciter],[data-play-surah],[data-download-surah],[data-delete-download],[data-open-download-rewayah],[data-open-download-reciter],[data-back-downloads],[data-play-download],[data-history-play],[data-resume-latest],[data-auto-next]");
  if (!target) return;

  if (target.dataset.tab || target.dataset.goTab) {
    state.activeTab = target.dataset.tab || target.dataset.goTab;
    if (state.activeTab === "downloads") state.downloadsStep = "rewayat";
    render();
  } else if (target.hasAttribute("data-resume-latest")) {
    resumeLatest();
  } else if (target.dataset.radioCat) {
    state.radioCategory = target.dataset.radioCat;
    state.onlyFavoriteRadios = false;
    renderRadios();
  } else if (target.hasAttribute("data-fav-radios")) {
    state.onlyFavoriteRadios = true;
    renderRadios();
  } else if (target.hasAttribute("data-auto-next")) {
    state.autoNext = !state.autoNext;
    localStorage.setItem("atheer_auto_next", String(state.autoNext));
    target.classList.toggle("active", state.autoNext);
    target.setAttribute("aria-checked", String(state.autoNext));
    const label = target.querySelector(".sr-only");
    if (label) label.textContent = state.autoNext ? "إيقاف التشغيل التلقائي للسورة التالية" : "تفعيل التشغيل التلقائي للسورة التالية";
    acknowledgeControl(target);
  } else if (target.dataset.playRadio) {
    playRadio(target.dataset.playRadio);
  } else if (target.dataset.favRadio) {
    const id = Number(target.dataset.favRadio);
    state.favoritesRadios = state.favoritesRadios.includes(id) ? state.favoritesRadios.filter((x) => x !== id) : [...state.favoritesRadios, id];
    writeJson("atheer_favorites_radios", state.favoritesRadios);
    acknowledgeControl(target);
    setTimeout(render, 120);
  } else if (target.dataset.openRewayah) {
    state.selectedRewayahKey = target.dataset.openRewayah;
    state.libraryStep = "reciters";
    renderLibrary();
  } else if (target.dataset.openReciter) {
    state.selectedReciter = currentLibraryReciter(target.dataset.openReciter, target.dataset.moshaf);
    state.libraryStep = "suwar";
    renderLibrary();
  } else if (target.hasAttribute("data-back-library")) {
    state.libraryStep = state.libraryStep === "suwar" ? "reciters" : "rewayat";
    renderLibrary();
  } else if (target.dataset.favReciter) {
    const id = Number(target.dataset.favReciter);
    state.favoritesReciters = state.favoritesReciters.includes(id) ? state.favoritesReciters.filter((x) => x !== id) : [...state.favoritesReciters, id];
    writeJson("atheer_favorites_reciters", state.favoritesReciters);
    acknowledgeControl(target);
    setTimeout(renderLibrary, 120);
  } else if (target.dataset.playSurah) {
    playSurah(target.dataset.playSurah, target.dataset.reciter, target.dataset.moshaf);
  } else if (target.dataset.downloadSurah) {
    downloadSurah(target.dataset.downloadSurah, target.dataset.reciter, target.dataset.moshaf);
  } else if (target.dataset.deleteDownload) {
    if (confirm("هل تريد حذف هذا الملف الصوتي من جهازك؟")) {
      await deleteOfflineAudio(target.dataset.deleteDownload);
      await refreshDownloads();
      render();
    }
  } else if (target.dataset.openDownloadRewayah) {
    state.selectedDownloadRewayah = target.dataset.openDownloadRewayah;
    state.downloadsStep = "reciters";
    renderDownloads();
  } else if (target.dataset.openDownloadReciter) {
    state.selectedDownloadReciterId = target.dataset.openDownloadReciter;
    state.downloadsStep = "suwar";
    renderDownloads();
  } else if (target.hasAttribute("data-back-downloads")) {
    state.downloadsStep = state.downloadsStep === "suwar" ? "reciters" : "rewayat";
    renderDownloads();
  } else if (target.dataset.playDownload) {
    playDownloaded(target.dataset.playDownload);
  } else if (target.dataset.historyPlay) {
    const item = state.progress[target.dataset.historyPlay];
    const downloaded = state.downloaded.find((d) => `${d.reciterId}_${d.surahId}` === target.dataset.historyPlay);
    if (downloaded) playDownloaded(downloaded.id);
    else if (item?.serverUrl) playAudio({ ...item, url: streamUrl(item.serverUrl, item.surahId), title: item.surahName, subtitle: item.reciterName, isRadio: false });
  }
});

document.addEventListener("input", (event) => {
  const input = event.target;
  if (input.id === "radioSearch") {
    state.searches.radios = input.value;
    renderRadios();
  }
  if (input.id === "reciterSearch") {
    state.searches.reciters = input.value;
    renderLibrary();
  }
  if (input.id === "surahSearch") {
    state.searches.suwar = input.value;
    renderLibrary();
  }
  if (input.id === "downloadSearch") {
    state.searches.downloads = input.value;
    renderDownloads();
  }
});

els.themeToggle.addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));
els.playPause.addEventListener("click", () => {
  if (!state.currentAudio) return;
  if (els.audio.paused) els.audio.play();
  else {
    els.audio.pause();
    saveCurrentProgress(true);
  }
});
function exitPlayer() {
  els.audio.pause();
  els.audio.removeAttribute("src");
  if (state.activeBlobUrl) URL.revokeObjectURL(state.activeBlobUrl);
  state.currentAudio = null;
  state.activeTrackKey = "";
  state.activeDownloadId = "";
  state.playerMinimized = false;
  updatePlayer();
}

els.closePlayer.addEventListener("click", exitPlayer);
els.exitPlayer.addEventListener("click", exitPlayer);

els.hidePlayer.addEventListener("click", () => {
  state.playerMinimized = true;
  updatePlayer();
});

els.unhidePlayer.addEventListener("click", () => {
  state.playerMinimized = false;
  updatePlayer();
});
els.prev.addEventListener("click", () => playAdjacent(-1));
els.next.addEventListener("click", () => playAdjacent(1));
els.repeat.addEventListener("click", () => {
  state.repeatOne = !state.repeatOne;
  els.audio.loop = state.repeatOne && state.currentAudio && !state.currentAudio.isRadio;
  updatePlayer();
});
els.expand.addEventListener("click", () => {
  state.playerExpanded = !state.playerExpanded;
  updatePlayer();
});
els.sleep.addEventListener("change", () => setSleepTimer(Number(els.sleep.value)));
els.seek.addEventListener("input", () => {
  els.audio.currentTime = Number(els.seek.value);
});
els.speed.addEventListener("change", () => {
  els.audio.playbackRate = Number(els.speed.value);
  localStorage.setItem("atheer_speed", els.speed.value);
});
els.volume.addEventListener("input", () => {
  els.audio.volume = Number(els.volume.value);
  localStorage.setItem("atheer_volume", els.volume.value);
});
els.audio.addEventListener("play", updatePlayer);
els.audio.addEventListener("pause", () => {
  saveCurrentProgress(true);
  updatePlayer();
});
els.audio.addEventListener("loadedmetadata", () => {
  els.seek.max = els.audio.duration || 100;
  els.duration.textContent = formatTime(els.audio.duration);
  if (els.audio.dataset.resumeTime) {
    els.audio.currentTime = Number(els.audio.dataset.resumeTime);
    delete els.audio.dataset.resumeTime;
  }
});
els.audio.addEventListener("timeupdate", () => {
  const duration = els.audio.duration || 0;
  const current = els.audio.currentTime || 0;
  els.seek.max = duration || 100;
  els.seek.value = current;
  els.currentTime.textContent = formatTime(current);
  els.duration.textContent = formatTime(duration);
  els.progress.style.width = duration ? `${Math.min(100, (current / duration) * 100)}%` : "0";
  els.progress.setAttribute("aria-valuemax", Math.round(duration) || 0);
  els.progress.setAttribute("aria-valuenow", Math.round(current));
  saveCurrentProgress(false);
});
els.audio.addEventListener("ended", () => {
  saveCurrentProgress(true);
  const track = state.currentAudio;
  if (state.repeatOne || !track || track.isRadio || !state.autoNext) {
    updatePlayer();
    return;
  }
  if (track.surahId < 114 && track.serverUrl) playAdjacent(1);
  else updatePlayer();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.deferredInstall = event;
  els.installApp.classList.remove("hidden");
});
els.installApp.addEventListener("click", async () => {
  if (!state.deferredInstall) return;
  state.deferredInstall.prompt();
  await state.deferredInstall.userChoice;
  state.deferredInstall = null;
  els.installApp.classList.add("hidden");
});

if ("serviceWorker" in navigator && import.meta.env?.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

setTheme(state.theme, false);
els.volume.value = state.volume;
els.speed.value = state.speed;
if (!state.themeManuallySet) {
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
    if (!state.themeManuallySet) setTheme(e.matches ? "light" : "dark", false);
  });
}
// Render the selected page immediately. IndexedDB may open slowly (or be
// unavailable in private/restricted browser sessions), and it must not hold
// the whole interface on an empty panel.
try {
  render();
} catch (err) {
  console.error("[أثير] initial render error:", err);
  setViewHtml(empty("حدث خطأ في العرض", "يرجى إعادة تحميل الصفحة."));
}
refreshDownloads().catch(() => {}).finally(() => {
  render();
  Promise.allSettled([fetchRadios(), fetchReciters()]).then(() => {
    if (["home", "radios", "library"].includes(state.activeTab)) render();
  });
});
