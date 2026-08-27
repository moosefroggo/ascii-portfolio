# design-engineering

A terminal-native, motion-driven portfolio. Zero dependencies, zero build step —
just HTML, CSS and vanilla JS. Projects are **full-screen ASCII worlds**, not cards.

## Run it

```sh
npx serve .        # or: python3 -m http.server 8000
```

## What's inside

| Piece | Where | What it does |
|---|---|---|
| Hero entrance | `style.css` | Animated ASCII field and staggered hero content on load |
| ASCII plasma | `script.js §2` | Hero canvas: wave field rendered as characters, pointer creates ripples |
| Hero heading | `index.html` + `style.css` | Animated product-focused heading and tagline |
| Scramble | `script.js §4` | Glitch-scramble text on hover |
| Spinners | `script.js §6` | Braille `⠋⠙⠹` spinners next to ACTIVE statuses |
| Typewriter | `script.js §7` | About paragraph types itself when scrolled into view |
| Status bar | `script.js §8` | Vim-style bottom bar: live clock + current buffer |
| **ls menu** | `index.html` | Projects index styled as `ls -la` output |
| Cursor launch | `script.js §9` | Hovering a project scrambles the field and materializes `OPEN ↗` at your cursor; clicking opens the live deployment (from `data-url`) in a new tab |
| Scroll energy | `script.js §0` | Scroll velocity churns the hero plasma, races the marquee dividers, and scrubs every world clock forward |
| Parallax worlds | `script.js §9` | Project backgrounds drift against scroll position |
| **Word morph** | `script.js §10` | 360vh sticky interlude — giant ASCII words (DESIGN → MOTION → CODE → BUILD) morph as you scroll, characters flying between letterforms |
| **Project worlds** | `script.js §9` | Each project is a full-screen living ASCII scene (see below) |

## The seven project worlds

| Project | Scene | Technique |
|---|---|---|
| Agentic Trading | Living graph | drifting nodes, nearest-neighbor edges, travelling pulses |
| Recruitment Platform for Top 0.1% Candidates | Wandering ink lines | momentum random-walk, long phosphor trails |
| Git Visualizations | Git City | procedural skyline, flickering windows, sky twinkles |
| Edtech Product Animations | Hole-eat void | ragged breathing void swallows a noise field |
| 2B Portfolio Generator | Banded gradients | posterized flowing bands, hue slowly cycles "themes" |
| VC Job Board | Data rain | full-screen falling streams with fading trails |
| 3D Gradients Generator | Mirrored plasma | WebGL and Three.js gradients reacting to physics and environment |

Also available but currently unused: `stars`, `mirror`.

Scenes run at 24fps, only while visible, and pause on hidden tabs.
Gentle scroll-snap pulls each world into place. `prefers-reduced-motion`
collapses everything to static frames.

## Customize

- **Projects** — edit the `.ls-row` menu entries and the matching
  `<section class="project">` blocks in `index.html`. Each section's
  `data-fx` picks its world: `graph | stars | mirror | bands | path | rain | city | hole`.
- **Add a project** — copy a section, give it a new `id`, add a menu row.
  To invent a new world, add a ~20-line function to the `FX` object in
  `script.js §9`.
- **Colors** — all in `:root` at the top of `style.css`.
- **Hero phrases** — `PHRASES` array in `script.js §3`.
- **About text** — the `data-text` attribute on `#about-text`.
