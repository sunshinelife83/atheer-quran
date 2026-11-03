const UNAVAILABLE_RADIO_HOST = "backup.qurango.net";
const ACTIVE_RADIO_HOST = "qurango.net";

/** Use the active Qurango audio host when API data contains its unavailable backup host. */
export function normalizeRadioUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() === UNAVAILABLE_RADIO_HOST) {
      url.hostname = ACTIVE_RADIO_HOST;
      return url.toString();
    }
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
  }
  return value;
}

export function normalizeRadios(radios) {
  return radios.map((radio) => ({ ...radio, url: normalizeRadioUrl(radio.url) }));
}
