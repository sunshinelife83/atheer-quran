import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../public/tokens.css", import.meta.url), "utf8");

function variablesFor(selector) {
  const block = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .find(([, selectors]) => selectors
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split(",")
      .some((candidate) => candidate.trim() === selector))?.[2];
  assert.ok(block, `Missing CSS token block: ${selector}`);
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
}

function colorFromOklch(value) {
  const [, lightness, chroma, hue] = value.match(/^oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)$/) || [];
  assert.ok(lightness, `Expected an opaque OKLCH color, received: ${value}`);
  const angle = Number(hue) * Math.PI / 180;
  const a = Number(chroma) * Math.cos(angle);
  const b = Number(chroma) * Math.sin(angle);
  const l = (Number(lightness) + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (Number(lightness) - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (Number(lightness) - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
  return linear.map((channel) => channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * channel ** (1 / 2.4) - 0.055);
}

function luminance([red, green, blue]) {
  const linear = (channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

function contrastRatio(foreground, background) {
  const first = luminance(colorFromOklch(foreground));
  const second = luminance(colorFromOklch(background));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function themeVariables() {
  return [
    ["dark", variablesFor(":root")],
    ["light", { ...variablesFor(":root"), ...variablesFor(':root[data-theme="light"]') }]
  ];
}

test("faint and muted text meet WCAG AA contrast on all theme surfaces", () => {
  const surfaces = ["bg", "bg-raised", "surface", "surface-hover", "surface-active"];

  for (const [theme, variables] of themeVariables()) {
    for (const foreground of ["ink-muted", "ink-faint"]) {
      for (const surface of surfaces) {
        const ratio = contrastRatio(variables[foreground], variables[surface]);
        assert.ok(ratio >= 4.5, `${theme} ${foreground} contrast on ${surface} is ${ratio.toFixed(2)}:1`);
      }
    }
  }
});

test("primary action text and focus indicators maintain required contrast", () => {
  for (const [theme, variables] of themeVariables()) {
    const actionRatio = contrastRatio(variables["accent-ink"], variables.accent);
    assert.ok(actionRatio >= 4.5, `${theme} primary action text contrast is ${actionRatio.toFixed(2)}:1`);

    for (const surface of ["bg", "bg-raised", "surface", "surface-hover", "surface-active"]) {
      const focusRatio = contrastRatio(variables.focus, variables[surface]);
      assert.ok(focusRatio >= 3, `${theme} focus indicator contrast on ${surface} is ${focusRatio.toFixed(2)}:1`);
    }
  }
});
