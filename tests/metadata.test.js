import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRadioMetadata, normalizeReciterMetadata } from "../src/api/metadata.js";

test("radio metadata drops invalid IDs and non-HTTPS playback or source links", () => {
  assert.deepEqual(normalizeRadioMetadata([
    { id: 1, name: "إذاعة آمنة", url: "https://radio.example/live", externalUrl: "https://radio.example/" },
    { id: 0, name: "معرف غير صالح", url: "https://radio.example/live" },
    { id: true, name: "معرف منطقي غير صالح", url: "https://radio.example/live" },
    { id: "1e2", name: "معرف بترميز غير صالح", url: "https://radio.example/live" },
    { id: 2, name: "بروتوكول غير آمن", url: "http://radio.example/live" },
    { id: 3, name: "رابط مصدر غير آمن", url: "https://radio.example/live", externalUrl: "javascript:alert(1)" },
    { id: 4, name: "بيانات اعتماد مضمنة", url: "https://user:pass@radio.example/live" }
  ]), [
    { id: 1, name: "إذاعة آمنة", url: "https://radio.example/live", country: "", group: "", externalUrl: "https://radio.example/", externalLabel: "", mediaType: "" },
    { id: 3, name: "رابط مصدر غير آمن", url: "https://radio.example/live", country: "", group: "", externalUrl: "", externalLabel: "", mediaType: "" }
  ]);
});

test("reciter metadata retains only valid editions and unique Quran surah IDs", () => {
  const reciters = normalizeReciterMetadata([{
    id: "7",
    name: "قارئ تجريبي",
    moshaf: [
      { id: 70, name: "حفص", server: "https://audio.example/reader/", surah_list: "1,2,2,115,invalid,1e2" },
      { id: 71, name: "خادم غير آمن", server: "javascript:alert(1)", surah_list: "1" }
    ]
  }]);

  assert.deepEqual(reciters, [{
    id: 7,
    name: "قارئ تجريبي",
    letter: "",
    moshaf: [{ id: 70, name: "حفص", server: "https://audio.example/reader/", surah_list: "1,2", surah_total: 2 }]
  }]);
});

test("metadata normalizers reject a response with the wrong top-level shape", () => {
  assert.throws(() => normalizeRadioMetadata({ radios: [] }), TypeError);
  assert.throws(() => normalizeReciterMetadata(null), TypeError);
});
