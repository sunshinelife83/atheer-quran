import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

function variablesFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1];
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

test("faint text meets WCAG AA contrast on all theme surfaces", () => {
  const themes = [
    ["dark", variablesFor(":root")],
    ["light", { ...variablesFor(":root"), ...variablesFor("body.light") }]
  ];

  for (const [theme, variables] of themes) {
    for (const surface of ["bg", "bg-raised", "surface", "surface-hover", "surface-active"]) {
      const ratio = contrastRatio(variables["ink-faint"], variables[surface]);
      assert.ok(ratio >= 4.5, `${theme} ink-faint contrast on ${surface} is ${ratio.toFixed(2)}:1`);
    }
  }
});
