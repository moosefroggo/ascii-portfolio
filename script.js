/* ═══════════════════════════════════════════════
   TERMINAL ASCII PORTFOLIO — motion engine
   no dependencies. just characters.
   ═══════════════════════════════════════════════ */
"use strict";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ── 0 · shared scroll energy — scroll makes everything churn ── */
const scrollState = { vel: 0 };
let _lastY = window.scrollY;
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  scrollState.vel = Math.min(40, scrollState.vel + Math.abs(y - _lastY) * 0.12);
  _lastY = y;
}, { passive: true });
(() => {
  const tracks = $$(".divider-track");
  const decay = () => {
    requestAnimationFrame(decay);
    scrollState.vel *= 0.93;
    if (scrollState.vel > 0.4)   // marquees race with your scrolling
      tracks.forEach((t) => (t.style.animationDuration = `${26 / (1 + scrollState.vel * 0.12)}s`));
  };
  if (!REDUCED) requestAnimationFrame(decay);
})();

/* ─────────────────────────────────────────────
   2 · ASCII PLASMA FIELD  (hero canvas)
   ───────────────────────────────────────────── */
(() => {
  const canvas = $("#ascii");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const RAMP = " .·:;=+xX#%@";
  const FONT = 14;
  const CW = FONT * 0.62, CH = FONT;
  const BUCKETS = 32;

  const bucket = Array.from({ length: BUCKETS }, (_, i) => {
    const t = i / (BUCKETS - 1);
    const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(t * RAMP.length))];
    const light = 14 + t * 52;
    const sat = 55 + t * 25;
    return { ch, color: `hsl(148, ${sat}%, ${light}%)` };
  });

  let cols = 0, rows = 0, W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${FONT}px "JetBrains Mono", monospace`;
    ctx.textBaseline = "top";
    cols = Math.ceil(W / CW) + 1;
    rows = Math.ceil(H / CH) + 1;
  };
  resize();
  window.addEventListener("resize", resize);

  const ptr = { x: -999, y: -999, tx: -999, ty: -999, energy: 0 };
  canvas.parentElement.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const nx = (e.clientX - r.left) / CW, ny = (e.clientY - r.top) / CH;
    const dist = Math.hypot(nx - ptr.tx, ny - ptr.ty);
    ptr.tx = nx; ptr.ty = ny;
    ptr.energy = Math.min(1.6, ptr.energy + dist * 0.08);
  });
  canvas.parentElement.addEventListener("pointerleave", () => { ptr.tx = -999; ptr.ty = -999; });

  const field = (x, y, t) => {
    const nx = x * 0.16, ny = y * 0.16;
    let v = Math.sin(nx * 1.2 + t * 0.9)
          + Math.sin(ny * 1.05 - t * 0.7)
          + Math.sin((nx + ny) * 0.7 + t * 0.45)
          + Math.sin(Math.hypot(nx - cols * 0.08, ny - rows * 0.08) * 1.6 - t * 1.2);
    if (ptr.x > -100) {
      const dx = x - ptr.x, dy = y - ptr.y, d2 = dx * dx + dy * dy;
      v += Math.sin(d2 * 0.03 - t * 5) * Math.exp(-d2 * 0.008) * 3 * ptr.energy;
    }
    return (v + 5.5) / 11;
  };

  const draw = (t) => {
    ctx.fillStyle = "#060807";
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let v = field(x, y, t);
        v = v < 0 ? 0 : v > 1 ? 1 : v;
        const b = bucket[(v * (BUCKETS - 1)) | 0];
        if (b.ch === " ") continue;
        ctx.fillStyle = b.color;
        ctx.fillText(b.ch, x * CW, y * CH);
      }
    }
  };

  let visible = true, last = 0;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  if (REDUCED) { draw(2.4); return; }

  const loop = (ms) => {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    if (ms - last < 33) return;
    last = ms;
    ptr.x += (ptr.tx - ptr.x) * 0.18;
    ptr.y += (ptr.ty - ptr.y) * 0.18;
    ptr.energy *= 0.96;
    draw(ms / 1000 + scrollState.vel * 0.12);   // scrolling churns the plasma
  };
  requestAnimationFrame(loop);
})();

/* ─────────────────────────────────────────────
   4 · SCRAMBLE-ON-HOVER
   ───────────────────────────────────────────── */
(() => {
  if (REDUCED) return;
  const GLYPHS = "!<>-_\\/[]{}=+*^?#·";
  const scramble = (el) => {
    if (el._busy) return;
    el._busy = true;
    const original = el.dataset.text || (el.dataset.text = el.textContent);
    let frame = 0;
    const settle = original.split("").map((_, i) => i * 2 + 4 + Math.random() * 8);
    const total = Math.max(...settle);
    const step = () => {
      let out = "";
      for (let i = 0; i < original.length; i++) {
        out += frame >= settle[i]
          ? original[i]
          : original[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (frame++ <= total) requestAnimationFrame(step);
      else { el.textContent = original; el._busy = false; }
    };
    step();
  };
  $$("[data-scramble]").forEach((el) =>
    el.addEventListener("pointerenter", () => scramble(el)));
})();

/* ─────────────────────────────────────────────
   5 · SCROLL REVEALS
   ───────────────────────────────────────────── */
(() => {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    }),
    { threshold: 0.15 }
  );
  $$(".reveal").forEach((el) => io.observe(el));
})();

/* ─────────────────────────────────────────────
   6 · BRAILLE SPINNERS
   ───────────────────────────────────────────── */
(() => {
  const FRAMES = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
  let i = 0;
  if (REDUCED) { $$(".spinner").forEach((s) => (s.textContent = "◉")); return; }
  setInterval(() => {
    i = (i + 1) % FRAMES.length;
    $$(".spinner").forEach((s) => (s.textContent = FRAMES[i]));
  }, 90);
})();

/* ─────────────────────────────────────────────
   7 · ABOUT TYPEWRITER
   ───────────────────────────────────────────── */
(() => {
  const el = $("#about-text");
  if (!el) return;
  const text = el.dataset.text;
  if (REDUCED) { el.textContent = text; return; }

  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const caret = document.createElement("span");
    caret.className = "caret";
    caret.textContent = "█";
    el.appendChild(caret);
    let i = 0;
    const type = setInterval(() => {
      el.insertBefore(document.createTextNode(text[i]), caret);
      if (++i >= text.length) clearInterval(type);
    }, 16);
  }, { threshold: 0.4 });
  io.observe(el);
})();

/* ─────────────────────────────────────────────
   8 · STATUS BAR — clock
   ───────────────────────────────────────────── */
(() => {
  const clock = $("#clock");
  const tick = () => {
    if (clock) clock.textContent = new Date().toTimeString().slice(0, 8);
  };
  tick();
  setInterval(tick, 1000);


})();

/* ─────────────────────────────────────────────
   9 · PROJECT WORLDS — full-screen living ASCII scenes
   graph · path · city · hole · bands · rain (+ stars · mirror)
   ───────────────────────────────────────────── */
(() => {
  const secs = $$(".project");
  if (!secs.length) return;

  const RAMP = " .·:;=+xX#%@";
  const FONT = 14, LH = 14;
  const BUCKETS = 24;
  const FRAME_MS = 1000 / 24;                  // 24fps, terminal cadence

  const mkBuckets = (hue) => Array.from({ length: BUCKETS }, (_, i) => {
    const t = i / (BUCKETS - 1);
    return {
      ch: RAMP[Math.min(RAMP.length - 1, Math.floor(t * RAMP.length))],
      color: `hsl(${hue}, ${52 + t * 28}%, ${10 + t * 56}%)`,
    };
  });
  const GREEN = mkBuckets(148);

  // char advance of the mono font (canvas measure ≈ DOM advance)
  const probe = document.createElement("canvas").getContext("2d");
  const measureCW = () => {
    probe.font = `${FONT}px "JetBrains Mono", ui-monospace, monospace`;
    return probe.measureText("0".repeat(60)).width / 60;
  };
  let CW = measureCW();

  const scenes = secs.map((el) => ({
    el,
    canvas: $(".p-fx", el),
    fx: el.dataset.fx,
    url: el.dataset.url,
    ctx: null,
    cols: 0, rows: 0, W: 0, H: 0,
    grid: new Float32Array(0),
    buckets: GREEN,
    state: {},
    ptr: { x: 0, y: 0, active: false, age: 0 },   // cursor in cell coords
    t: Math.random() * 100,                     // desync the worlds
    last: 0, visible: false,
  })).filter((s) => s.canvas);

  const setMax = (c, x, y, v) => {
    if (x >= 0 && x < c.cols && y >= 0 && y < c.rows) {
      const i = y * c.cols + x;
      if (v > c.grid[i]) c.grid[i] = v;
    }
  };

  const line = (c, x0, y0, x1, y1, v) => {      // Bresenham
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      setMax(c, x0, y0, v);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };

  /* ── the five worlds ── */
  const FX = {

    // nextwork — drifting nodes, nearest-neighbor edges, travelling pulses
    graph(c) {
      const s = c.state;
      if (!s.nodes) {
        s.nodes = Array.from({ length: 16 }, () => ({
          x: Math.random() * c.cols, y: Math.random() * c.rows,
          vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.22,
        }));
        s.pulses = [];
      }
      for (let i = 0; i < c.grid.length; i++) c.grid[i] *= 0.9;
      const N = s.nodes;
      N.forEach((nd) => {
        nd.x += nd.vx; nd.y += nd.vy;
        if (nd.x < 1 || nd.x > c.cols - 2) nd.vx *= -1;
        if (nd.y < 1 || nd.y > c.rows - 2) nd.vy *= -1;
      });
      const edges = [];
      N.forEach((a, i) => {
        const near = N.map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
          .filter((o) => o.j !== i).sort((p, q) => p.d - q.d).slice(0, 2);
        near.forEach(({ j }) => {
          edges.push([i, j]);
          line(c, a.x, a.y, N[j].x, N[j].y, 0.3);
        });
      });
      if (s.pulses.length < 7 && Math.random() < 0.12 && edges.length) {
        const [a, b] = edges[(Math.random() * edges.length) | 0];
        s.pulses.push({ a, b, t: 0 });
      }
      s.pulses = s.pulses.filter((p) => p.t <= 1);
      s.pulses.forEach((p) => {
        p.t += 0.035;
        const A = N[p.a], B = N[p.b];
        setMax(c, A.x + (B.x - A.x) * p.t, A.y + (B.y - A.y) * p.t, 1);
      });
      N.forEach((nd) => setMax(c, nd.x, nd.y, 1));
    },

    // fps-desk — warp starfield: fly forward through characters
    stars(c) {
      const s = c.state;
      if (!s.stars) {
        s.stars = Array.from({ length: 260 }, () => ({
          x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(),
        }));
      }
      for (let i = 0; i < c.grid.length; i++) c.grid[i] *= 0.7;   // streaks
      const cx = c.cols / 2 + Math.sin(c.t * 0.3) * c.cols * 0.05;
      const cy = c.rows / 2 + Math.cos(c.t * 0.24) * c.rows * 0.07;
      const f = c.cols * 0.38, fy = f * (CW / LH);
      for (const st of s.stars) {
        st.z -= 0.011;
        if (st.z < 0.03) { st.x = Math.random() * 2 - 1; st.y = Math.random() * 2 - 1; st.z = 1; }
        const x = (cx + (st.x / st.z) * f) | 0;
        const y = (cy + (st.y / st.z) * fy) | 0;
        setMax(c, x, y, 1 - st.z);
      }
    },

    // pathline — wandering ink lines with momentum, long fading trails
    path(c) {
      const s = c.state;
      if (!s.walkers) {
        s.walkers = Array.from({ length: 3 }, () => ({
          x: Math.random() * c.cols, y: Math.random() * c.rows,
          a: Math.random() * 6.2832,
        }));
      }
      for (let i = 0; i < c.grid.length; i++) c.grid[i] *= 0.965;   // long memory
      for (const w of s.walkers) {
        w.a += (Math.random() - 0.5) * 0.55;
        w.x += Math.cos(w.a) * 0.55;
        w.y += Math.sin(w.a) * 0.35;
        if (w.x < 0) w.x += c.cols; if (w.x >= c.cols) w.x -= c.cols;
        if (w.y < 0) w.y += c.rows; if (w.y >= c.rows) w.y -= c.rows;
        setMax(c, w.x | 0, w.y | 0, 1);
      }
    },

    // vc-jobs — full-screen data rain with fading trails
    rain(c) {
      const s = c.state;
      if (!s.drops || s.drops.length !== c.cols) s.drops = new Array(c.cols).fill(null);
      for (let i = 0; i < c.grid.length; i++) c.grid[i] *= 0.86;
      for (let x = 0; x < c.cols; x++) {
        let d = s.drops[x];
        if (!d && Math.random() < 0.03) d = s.drops[x] = { y: 0, v: 0.3 + Math.random() * 0.6 };
        if (d) {
          d.y += d.v;
          if (d.y >= c.rows) s.drops[x] = null;
          else setMax(c, x, d.y | 0, 1);
        }
      }
    },

    // nextwork-anims — Git City: a skyline where buildings flicker like commits
    city(c) {
      const s = c.state;
      if (!s.colH || s.colH.length !== c.cols) {
        s.colH = new Array(c.cols).fill(0);
        let x = 0;
        while (x < c.cols) {                       // lay out buildings
          const w = 4 + ((Math.random() * 5) | 0);
          const h = 3 + Math.random() * c.rows * 0.55;
          for (let k = 0; k < w && x < c.cols; k++, x++) s.colH[x] = h + (Math.random() * 2 - 1);
        }
      }
      for (let i = 0; i < c.grid.length; i++) c.grid[i] *= 0.93;
      for (let x = 0; x < c.cols; x++) {
        const roof = c.rows - 1 - (s.colH[x] | 0);
        for (let y = c.rows - 1; y > roof; y--) {
          const i = y * c.cols + x;
          if (Math.random() < 0.02) c.grid[i] = Math.random() < 0.5 ? 0.9 : 0.25;  // window flicker
          else if (c.grid[i] < 0.2) c.grid[i] = 0.25;                              // windows stay dimly lit
        }
        if (roof >= 0) c.grid[roof * c.cols + x] = 0.85;                           // roofline
      }
      if (Math.random() < 0.6) {                   // sparse sky twinkle
        const x = (Math.random() * c.cols) | 0, y = (Math.random() * c.rows * 0.5) | 0;
        setMax(c, x, y, 1);
      }
    },

    // design-demo — the hole-eat: a ragged wandering void swallows the field
    hole(c) {
      const hx = c.cols / 2 + Math.sin(c.t * 0.31) * c.cols * 0.25;
      const hy = c.rows / 2 + Math.sin(c.t * 0.23 + 1.7) * c.rows * 0.28;
      const R = 5 + 3 * Math.sin(c.t * 0.5);       // breathing radius
      const aspect = LH / CW;
      for (let y = 0; y < c.rows; y++) {
        for (let x = 0; x < c.cols; x++) {
          let v = 0.5 + 0.5 * Math.sin(x * 0.21 + c.t * 0.6) * Math.sin(y * 0.26 - c.t * 0.4);
          const dx = x - hx, dy = (y - hy) * aspect;
          const d = Math.sqrt(dx * dx + dy * dy);
          const ang = Math.atan2(dy, dx);
          const ragged = R + Math.sin(ang * 7 + c.t * 2) * 1.5;   // ragged polygon edge
          const swallowed = (d - ragged * 0.55) / (ragged * 0.7);
          v *= swallowed < 0 ? 0 : swallowed > 1 ? 1 : swallowed;
          c.grid[y * c.cols + x] = v;
        }
      }
    },

    // mirror — plasma mirrored on the vertical axis: a living Rorschach
    mirror(c) {
      const half = (c.cols + 1) >> 1;
      const t = c.t;
      for (let y = 0; y < c.rows; y++) {
        const ny = y * 0.16;
        for (let x = 0; x < half; x++) {
          const nx = x * 0.16;
          let v = Math.sin(nx * 1.2 + t * 0.9)
                + Math.sin(ny * 1.05 - t * 0.7)
                + Math.sin((nx + ny) * 0.7 + t * 0.45)
                + Math.sin(Math.hypot(nx - 2, ny - 1.5) * 1.6 - t * 1.2);
          v = (v + 4) / 8;
          v = v < 0 ? 0 : v > 1 ? 1 : v;
          c.grid[y * c.cols + x] = v;
          c.grid[y * c.cols + (c.cols - 1 - x)] = v;
        }
      }
    },

    // theme-engine — banded gradient flow, hue cycling through "themes"
    bands(c) {
      const hue = 148 + 55 * Math.sin(c.t * 0.12);   // green ↔ teal/amber drift
      c.buckets = mkBuckets(hue);
      const t = c.t;
      for (let y = 0; y < c.rows; y++) {
        const wob = 1.3 * Math.sin(y * 0.08 - t * 0.45);
        for (let x = 0; x < c.cols; x++) {
          let v = 0.5 + 0.5 * Math.sin(x * 0.11 + y * 0.16 + t * 0.9 + wob);
          v = ((v * 7) | 0) / 7 + 0.045;              // posterize → visible bands
          c.grid[y * c.cols + x] = v > 1 ? 1 : v;
        }
      }
    },
  };

  /* ── sizing ── */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const sizeScene = (c) => {
    c.W = c.canvas.clientWidth; c.H = c.canvas.clientHeight;
    c.canvas.width = c.W * dpr; c.canvas.height = c.H * dpr;
    c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.ctx.font = `${FONT}px "JetBrains Mono", ui-monospace, monospace`;
    c.ctx.textBaseline = "top";
    c.cols = Math.floor(c.W / CW);
    c.rows = Math.floor(c.H / LH);
    c.grid = new Float32Array(c.cols * c.rows);
    c.state = {};                                     // reset world state
  };
  let rT;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => { CW = measureCW(); scenes.forEach(sizeScene); }, 180);
  });

  const render = (c) => {
    const ctx = c.ctx, bk = c.buckets;
    ctx.fillStyle = "#060807";
    ctx.fillRect(0, 0, c.W, c.H);
    for (let y = 0; y < c.rows; y++) {
      const row = y * c.cols, py = y * LH;
      for (let x = 0; x < c.cols; x++) {
        const v = c.grid[row + x];
        if (v < 0.06) continue;
        const b = bk[(v * (BUCKETS - 1)) | 0];
        ctx.fillStyle = b.color;
        ctx.fillText(b.ch, x * CW, py);
      }
    }
  };

  /* ── cursor: scramble the field + materialize "OPEN ↗" ── */
  const OPEN_TEXT = "OPEN ↗";
  const SCRAMBLE_GLYPHS = "!<>-_\\/[]{}=+*^?#";

  const disturb = (c) => {
    for (let k = 0; k < 90; k++) {
      const rx = (c.ptr.x + (Math.random() - 0.5) * 16) | 0;
      const ry = (c.ptr.y + (Math.random() - 0.5) * 8) | 0;
      if (rx >= 0 && rx < c.cols && ry >= 0 && ry < c.rows)
        c.grid[ry * c.cols + rx] = Math.random();
    }
  };

  const drawOverlay = (c) => {
    const ctx = c.ctx;
    const tx = Math.max(1, Math.min(c.ptr.x + 2 | 0, c.cols - OPEN_TEXT.length - 1));
    const ty = Math.max(1, Math.min(c.ptr.y - 1 | 0, c.rows - 2));
    ctx.fillStyle = "rgba(4, 6, 5, .82)";        // backdrop chip
    ctx.fillRect((tx - 1) * CW, (ty - 0.45) * LH, (OPEN_TEXT.length + 2) * CW, LH * 1.9);
    ctx.font = `700 ${FONT}px "JetBrains Mono", ui-monospace, monospace`;
    for (let i = 0; i < OPEN_TEXT.length; i++) {
      const want = OPEN_TEXT[i];
      const settled = c.ptr.age > i * 3 + 5;      // letters resolve left → right
      const ch = want === " " ? " " : settled ? want
        : SCRAMBLE_GLYPHS[(Math.random() * SCRAMBLE_GLYPHS.length) | 0];
      ctx.fillStyle = settled ? "#c6ffdf" : "#3df08a";
      ctx.fillText(ch, (tx + i) * CW, ty * LH);
    }
    ctx.font = `${FONT}px "JetBrains Mono", ui-monospace, monospace`;
  };

  /* ── wiring ── */
  scenes.forEach((c) => {
    c.ctx = c.canvas.getContext("2d");
    c.el.addEventListener("pointermove", (e) => {
      const r = c.canvas.getBoundingClientRect();
      c.ptr.x = (e.clientX - r.left) / CW;
      c.ptr.y = (e.clientY - r.top) / LH;
      c.ptr.active = true;
    });
    c.el.addEventListener("pointerleave", () => {
      c.ptr.active = false;
      c.ptr.age = 0;
    });
    c.el.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;          // real links win
      if (c.url) window.open(c.url, "_blank", "noopener");
    });
  });
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => {
      const c = scenes.find((k) => k.el === e.target);
      if (c) c.visible = e.isIntersecting;
    }),
    { threshold: 0.05 }
  );
  scenes.forEach((c) => io.observe(c.el));

  const loop = (ms) => {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    for (const c of scenes) {
      if (!c.visible || ms - c.last < FRAME_MS) continue;
      c.t += (ms - c.last) / 1000;
      c.last = ms;
      // scroll-led: parallax drift + scrub the world's clock
      const r = c.el.getBoundingClientRect();
      const prog = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      c.canvas.style.transform = `translateY(${(prog * 7).toFixed(2)}%)`;
      c.t += scrollState.vel * 0.004;
      FX[c.fx](c);
      if (c.ptr.active) { c.ptr.age++; disturb(c); }
      render(c);
      if (c.ptr.active) drawOverlay(c);
    }
  };

  const start = () => {
    CW = measureCW();
    scenes.forEach(sizeScene);
    if (REDUCED) {                                    // one static frame each
      scenes.forEach((c) => { FX[c.fx](c); render(c); });
      return;
    }
    requestAnimationFrame(loop);
  };
  if (document.fonts?.ready) document.fonts.ready.then(start);
  else start();
})();

/* ─────────────────────────────────────────────
   10 · WORD MORPH — scroll-scrubbed giant ASCII words
   the centerpiece: scroll position drives thousands of
   characters flying between letterforms
   ───────────────────────────────────────────── */
(() => {
  const wrap = $("#interlude");
  const canvas = $("#word-canvas");
  if (!wrap || !canvas) return;
  const ctx = canvas.getContext("2d");
  const sticky = $(".interlude-sticky", wrap);
  const countEl = $("#word-count");

  const WORDS = ["DESIGN", "MOTION", "CODE", "BUILD"];
  const FONT = 14, LH = 14;
  const RAMP = " .·:;=+xX#%@";

  const probe = document.createElement("canvas").getContext("2d");
  let CW = 8;
  const measure = () => {
    probe.font = `${FONT}px "JetBrains Mono", ui-monospace, monospace`;
    CW = probe.measureText("0".repeat(60)).width / 60;
  };
  measure();

  let W = 0, H = 0, dpr = 1;
  let wordPts = [], parts = [], visible = false;

  // rasterize a word, sample its pixels into character-cell points
  const sampleWord = (word) => {
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const o = off.getContext("2d");
    const size = Math.min(W / (word.length * 0.62), H * 0.42);
    o.font = `800 ${size}px "JetBrains Mono", ui-monospace, monospace`;
    o.textAlign = "center"; o.textBaseline = "middle";
    o.fillStyle = "#fff";
    o.fillText(word, W / 2, H / 2);
    const img = o.getImageData(0, 0, W, H).data;
    const pts = [];
    const sx = Math.max(3, CW * 0.85), sy = Math.max(3, LH * 0.85);
    for (let y = sy / 2; y < H; y += sy)
      for (let x = sx / 2; x < W; x += sx)
        if (img[((y | 0) * W + (x | 0)) * 4 + 3] > 120) pts.push([x / CW, y / LH]);
    return pts;
  };

  const build = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${FONT}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textBaseline = "top";
    wordPts = WORDS.map(sampleWord);
    const n = Math.max(...wordPts.map((p) => p.length));
    parts = Array.from({ length: n }, () => ({
      seed: Math.random() * 100,
      delay: Math.random() * 0.35,
      bright: 0.55 + Math.random() * 0.45,
    }));
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  let last = 0, time = 0;
  const draw = (ms) => {
    if (ms - last < 33) return;
    time += (ms - last) / 1000; last = ms;

    const rect = wrap.getBoundingClientRect();
    const total = rect.height - sticky.offsetHeight;
    const p = Math.min(1, Math.max(0, -rect.top / total));
    const phase = p * (WORDS.length - 1);
    const wi = Math.min(WORDS.length - 2, Math.floor(phase));
    const local = phase - wi;
    if (countEl)
      countEl.textContent = `${String(Math.round(phase) + 1).padStart(2, "0")} / 0${WORDS.length}`;

    const A = wordPts[wi], B = wordPts[wi + 1];
    ctx.fillStyle = "#060807";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < parts.length; i++) {
      const pt = parts[i];
      const a = A[i % A.length], b = B[i % B.length];
      const li = ease(Math.min(1, Math.max(0, (local - pt.delay) / 0.65)));
      const jx = Math.sin(time * 1.4 + pt.seed) * 0.22;        // idle float
      const jy = Math.cos(time * 1.1 + pt.seed * 1.7) * 0.22;
      const x = lerp(a[0], b[0], li) + jx;
      const y = lerp(a[1], b[1], li) + jy;
      const chaos = Math.sin(li * Math.PI);                    // mid-flight → glyph chaos
      const v = pt.bright;
      const ch = chaos > 0.55 && Math.random() < 0.5
        ? RAMP[1 + ((Math.random() * (RAMP.length - 2)) | 0)]
        : RAMP[Math.min(RAMP.length - 1, (v * RAMP.length) | 0)];
      ctx.fillStyle = `hsl(148, ${60 + v * 20}%, ${18 + v * 48}%)`;
      ctx.fillText(ch, x * CW, y * LH);
    }
  };

  new IntersectionObserver(([e]) => (visible = e.isIntersecting),
    { rootMargin: "10% 0px" }).observe(wrap);

  let rT;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => { measure(); build(); }, 180);
  });

  const start = () => {
    measure(); build();
    if (REDUCED) { requestAnimationFrame((ms) => { last = ms - 34; draw(ms); }); return; }
    const loop = (ms) => {
      requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      draw(ms);
    };
    requestAnimationFrame(loop);
  };
  if (document.fonts?.ready) document.fonts.ready.then(start);
  else start();
})();
