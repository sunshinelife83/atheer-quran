import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const themeSource = await readFile(new URL("../public/theme.js", import.meta.url), "utf8");

function initializeTheme({ storedTheme = null, systemTheme = "dark", storageUnavailable = false } = {}) {
  const document = { documentElement: { dataset: {} }, addEventListener(name, listener) { this.clickHandler = listener; } };
  const storage = {
    value: storedTheme,
    getItem() { if (storageUnavailable) throw new Error("storage unavailable"); return this.value; },
    setItem(key, value) {
      if (storageUnavailable) throw new Error("storage unavailable");
      assert.equal(key, "atheer_theme");
      this.value = value;
    }
  };
  const warnings = [];
  runInNewContext(themeSource, { document, localStorage: storage, window: { matchMedia: () => ({ matches: systemTheme === "light" }) }, console: { warn: (...args) => warnings.push(args) } });
  return { document, storage, warnings };
}

test("restores valid saved themes and falls back for missing or invalid values", () => {
  assert.equal(initializeTheme({ storedTheme: "light" }).document.documentElement.dataset.theme, "light");
  assert.equal(initializeTheme({ storedTheme: "dark", systemTheme: "light" }).document.documentElement.dataset.theme, "dark");
  assert.equal(initializeTheme({ storedTheme: "invalid", systemTheme: "light" }).document.documentElement.dataset.theme, "light");
  assert.equal(initializeTheme({ systemTheme: "dark" }).document.documentElement.dataset.theme, "dark");
});

test("public-page theme toggle updates the palette and persists the choice", () => {
  const { document, storage } = initializeTheme({ systemTheme: "dark" });
  document.clickHandler({ target: { closest: (selector) => selector === "[data-theme-toggle]" } });
  assert.equal(document.documentElement.dataset.theme, "light");
  assert.equal(storage.value, "light");

  document.clickHandler({ target: { closest: () => null } });
  assert.equal(document.documentElement.dataset.theme, "light");
});

test("unavailable storage falls back to system preference and reports failures", () => {
  const { document, warnings } = initializeTheme({ systemTheme: "light", storageUnavailable: true });
  assert.equal(document.documentElement.dataset.theme, "light");
  assert.equal(warnings.length, 1);

  document.clickHandler({ target: { closest: () => true } });
  assert.equal(document.documentElement.dataset.theme, "dark");
  assert.equal(warnings.length, 2);
});
