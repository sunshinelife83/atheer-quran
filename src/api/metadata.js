export function safeExternalUrl(candidateUrl) {
  if (typeof candidateUrl !== "string") return "";
  try {
    const url = new URL(candidateUrl);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch (error) {
    if (error instanceof TypeError) return "";
    throw error;
  }
}

function positiveId(candidateId) {
  if (typeof candidateId !== "number" && (typeof candidateId !== "string" || !/^\d+$/.test(candidateId))) return 0;
  const id = Number(candidateId);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

function normalizeRadio(radio) {
  if (!radio || typeof radio !== "object" || typeof radio.name !== "string" || !radio.name.trim()) return null;
  const id = positiveId(radio.id);
  const url = safeExternalUrl(radio.url);
  if (!id || !url) return null;
  return {
    id,
    name: radio.name,
    url,
    country: typeof radio.country === "string" ? radio.country : "",
    group: typeof radio.group === "string" ? radio.group : "",
    externalUrl: safeExternalUrl(radio.externalUrl),
    externalLabel: typeof radio.externalLabel === "string" ? radio.externalLabel : "",
    mediaType: typeof radio.mediaType === "string" ? radio.mediaType : ""
  };
}

function normalizeEdition(edition) {
  if (!edition || typeof edition !== "object" || typeof edition.name !== "string" || !edition.name.trim()
    || typeof edition.surah_list !== "string") return null;
  const id = positiveId(edition.id);
  const server = safeExternalUrl(edition.server);
  const surahIds = edition.surah_list.split(",")
    .map((candidateId) => /^\d+$/.test(candidateId.trim()) ? Number(candidateId) : 0)
    .filter((surahId) => Number.isSafeInteger(surahId) && surahId >= 1 && surahId <= 114);
  if (!id || !server || !surahIds.length) return null;
  const uniqueIds = [...new Set(surahIds)];
  return { id, name: edition.name, server, surah_list: uniqueIds.join(","), surah_total: uniqueIds.length };
}

function normalizeReciter(reciter) {
  if (!reciter || typeof reciter !== "object" || typeof reciter.name !== "string" || !reciter.name.trim()
    || !Array.isArray(reciter.moshaf)) return null;
  const id = positiveId(reciter.id);
  const moshaf = reciter.moshaf.map(normalizeEdition).filter(Boolean);
  return id && moshaf.length
    ? { id, name: reciter.name, letter: typeof reciter.letter === "string" ? reciter.letter : "", moshaf }
    : null;
}

export function normalizeRadioMetadata(records) {
  if (!Array.isArray(records)) throw new TypeError("Radio metadata must be an array");
  return records.map(normalizeRadio).filter(Boolean);
}

export function normalizeReciterMetadata(records) {
  if (!Array.isArray(records)) throw new TypeError("Reciter metadata must be an array");
  return records.map(normalizeReciter).filter(Boolean);
}
