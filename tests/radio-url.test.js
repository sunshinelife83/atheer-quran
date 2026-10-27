import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRadioUrl, normalizeRadios } from "../src/audio/radio-url.js";

test("replaces the unavailable Qurango backup host with its live host", () => {
  assert.equal(
    normalizeRadioUrl("https://backup.qurango.net/radio/shaik_abu_bakr_al_shatri"),
    "https://qurango.net/radio/shaik_abu_bakr_al_shatri"
  );
});

test("leaves other radio URLs intact and does not mutate source records", () => {
  const source = [{ id: 1, url: "https://stream.radiojar.com/live" }];
  const normalized = normalizeRadios(source);
  assert.deepEqual(normalized, source);
  assert.notEqual(normalized[0], source[0]);
  assert.equal(normalizeRadioUrl("not a URL"), "not a URL");
});
