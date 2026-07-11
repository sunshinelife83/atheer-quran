# أثير القرآن — Design System

## Visual direction

Quiet Swiss product UI with a restrained glossy player. The product is dark-first for a listener using it in a quiet personal setting, with an equally crisp light theme. Color is restrained: forest is functional, brass is a small signal, and surfaces are mostly solid.

## Foundations

- **UI type:** Tajawal for navigation, controls, labels, metadata, and product headings.
- **Quranic line:** Amiri, limited to the daily listening line.
- **Radii:** 8px for controls, 12px for cards, 16px for the player.
- **Spacing:** 4px base; major gaps are 12px, 16px, 24px, and 32px.
- **Color:** neutral forest dark/light ramps, teal-green action accent, restrained brass secondary accent, semantic success/danger states.

## Components

- One shared bordered card treatment for lists, drill-down cards, and empty states.
- Solid primary button, outlined secondary button, and compact icon button.
- Search and selects use the same 44px control height and visible focus ring.
- The player alone may use backdrop blur and a light reflective edge.

## Motion

- 120ms press feedback, 180–220ms view and state changes, 280ms player expansion.
- Easing uses quart/quint/expo deceleration only; no bounce or elastic curves.
- Motion uses transform and opacity where possible. The active equalizer is the sole continuous effect.
- `prefers-reduced-motion` disables nonessential animation and makes state changes immediate.
