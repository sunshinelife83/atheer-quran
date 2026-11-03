# أثير القرآن — Design System

## Visual direction

Quiet Swiss product UI with a restrained glossy player. The product is dark-first for a listener using it in a quiet personal setting, with an equally crisp light theme. Color is restrained: forest is functional, brass is a small signal, and surfaces are mostly solid.

## Foundations

- **UI type:** Tajawal for navigation, controls, labels, metadata, and product headings.
- **Quranic line:** QPC V2 Page 574 subset, limited to the fixed homepage verse.
- **Radii:** 8px for controls, 12px for cards, 16px for the player.
- **Spacing:** 4px base; major gaps are 12px, 16px, 24px, and 32px.
- **Color:** neutral forest dark/light ramps, teal-green action accent, restrained brass secondary accent, semantic success/danger states.
- **Theme:** shared semantic tokens live in `public/tokens.css`; the app stores the selected theme and public pages follow it, falling back to the system preference.

## Components

- One shared bordered card treatment for lists, drill-down cards, and empty states.
- Solid primary button, outlined secondary button, and compact icon button.
- Search and selects use the same 44px control height and visible focus ring.
- The player is the only persistent expressive surface; inactive content stays solid and quiet.
- App and public content pages share the same color and radius tokens.

## Motion

- 120ms press feedback, 180–220ms view and state changes, 280ms player transitions.
- Easing uses quart/quint/expo deceleration only; no bounce or elastic curves.
- Motion uses transform and opacity where possible. The active equalizer is the sole continuous effect; content does not cascade in on every view change.
- `prefers-reduced-motion` disables nonessential animation and makes state changes immediate.
