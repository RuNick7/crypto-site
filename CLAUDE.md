# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the site

No build step required. Open any HTML file directly in a browser, or serve locally:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

The cipher modules use ES module `export` syntax (`js/ciphers/*.js`), so they must be loaded via `<script type="module">` or a local server — opening `file://` directly will cause CORS errors on some browsers.

## Architecture

**Pure static site** — no framework, no bundler, no package manager. HTML + CSS + vanilla JS.

### Pages
| File | Operation |
|------|-----------|
| `index.html` | Landing page with matrix rain intro, ops grid, timeline |
| `vigenere.html` | Op. VIGENÈRE — multi-step interactive lesson |
| `enigma.html` | Op. ENIGMA — multi-step interactive lesson |
| `venona.html` | Op. VENONA — multi-step interactive lesson |

### JS split
- `js/ciphers/` — pure crypto logic, no DOM. Each file exports functions/classes.
  - `vigenere.js` — encrypt/decrypt, Kasiski, IoC, frequency analysis
  - `enigma.js` — `EnigmaMachine` class (full rotor/plugboard/reflector sim), `bombeSearch`, `cribDrag`
  - `otp.js` — OTP apply/decrypt, XOR-of-ciphertexts, crib-drag for Venona depth attack
- `js/ui/common.js` — shared nav burger toggle + clearance-bar update (loaded on every page)

### CSS layers (all 4 loaded on every page)
- `base.css` — CSS variables (color palette, fonts), resets, typography
- `layout.css` — nav, container, grid helpers, op-cards, timeline, steps
- `design.css` — component styles (callouts, inputs, buttons, badges, cipher displays)
- `animations.css` — keyframe animations, entrance transitions, `.stagger`

### Clearance / progress system
Completion of each operation is persisted in `localStorage` under keys `done_vigenere`, `done_enigma`, `done_venona`. The nav shows "ДОПУСК N/3" and a progress bar, both read from these keys via `common.js`.

### Design language
Dark terminal aesthetic: near-black `#0a0a0f` background, amber `#f5a623` accents, matrix green `#00ff41` highlights. Fonts: *Special Elite* (headings), *Share Tech Mono* (body/code). All values are CSS custom properties in `base.css`.
