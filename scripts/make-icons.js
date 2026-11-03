// Draws FAITH's app icons from vector geometry: a white heart outline with a heartbeat line on a
// clinic-teal gradient (the app's primary colour). Run: node scripts/make-icons.js
// Writes the app icon, Android adaptive layers, splash, notification icon, favicon and PWA icons.
// Anti-aliased by exact distance to each stroke; uses pngjs (already in node_modules via Expo).
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.join(__dirname, '..');
const TEAL_A = [0x16, 0xa3, 0x94]; // top-left
const TEAL_B = [0x0e, 0x6e, 0x8c]; // bottom-right

// The heart from src/ui/Brand.tsx (24-unit box), plus the heartbeat line through it.
const HEART = 'M12 20.3c-.36 0-.72-.12-1-.36C7.6 17.1 3.4 13.5 3.4 9.1 3.4 6.4 5.5 4.3 8.1 4.3c1.6 0 3 .8 3.9 2.1.9-1.3 2.3-2.1 3.9-2.1 2.6 0 4.7 2.1 4.7 4.8 0 4.4-4.2 8-7.6 10.84-.28.24-.64.36-1 .36z';
const PULSE = [[5.6, 11.6], [9, 11.6], [10.4, 8.9], [12.3, 14.4], [13.8, 11.6], [18.4, 11.6]];
const HEART_W = 17.2; // width of the heart in units
const CENTER = [12, 12.3];

function flattenPath(d) {
  const tokens = d.match(/[MmCcLlZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  const pts = [];
  let cmd = null;
  let x = 0;
  let y = 0;
  let i = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === 'z' || cmd === 'Z') {
      pts.push(pts[0]);
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    if (cmd === 'M' || cmd === 'm' || cmd === 'L' || cmd === 'l') {
      const nx = num() + (rel ? x : 0);
      const ny = num() + (rel ? y : 0);
      x = nx;
      y = ny;
      pts.push([x, y]);
      if (cmd === 'M') cmd = 'L';
      if (cmd === 'm') cmd = 'l';
    } else if (cmd === 'C' || cmd === 'c') {
      const ox = rel ? x : 0;
      const oy = rel ? y : 0;
      const c1 = [num() + ox, num() + oy];
      const c2 = [num() + ox, num() + oy];
      const p = [num() + ox, num() + oy];
      const p0 = [x, y];
      for (let s = 1; s <= 40; s++) {
        const t = s / 40;
        const u = 1 - t;
        pts.push([
          u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p[0],
          u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p[1],
        ]);
      }
      [x, y] = p;
    } else throw new Error(`Unsupported path command ${cmd}`);
  }
  return pts;
}

const HEART_PTS = flattenPath(HEART);

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? clamp01(((px - ax) * dx + (py - ay) * dy) / len) : 0;
  const cx = ax + t * dx - px;
  const cy = ay + t * dy - py;
  return Math.sqrt(cx * cx + cy * cy);
}

/**
 * size: px. tile: 'none' | 'square' | 'rounded'. mark: 'white' | 'teal' | 'none'. markWidth: heart
 * width as a fraction of the size.
 */
function render({ size, tile, mark, markWidth = 0.5, radius = 0.225 }) {
  const png = new PNG({ width: size, height: size });
  const s = (markWidth * size) / HEART_W;
  const map = ([ux, uy]) => [size / 2 + (ux - CENTER[0]) * s, size / 2 + (uy - CENTER[1]) * s];
  const strokes =
    mark === 'none'
      ? []
      : [
          { pts: HEART_PTS.map(map), hw: (2.1 * s) / 2 },
          { pts: PULSE.map(map), hw: (1.6 * s) / 2 },
        ];
  for (const st of strokes) {
    const xs = st.pts.map((p) => p[0]);
    const ys = st.pts.map((p) => p[1]);
    st.box = [Math.min(...xs) - st.hw - 2, Math.min(...ys) - st.hw - 2, Math.max(...xs) + st.hw + 2, Math.max(...ys) + st.hw + 2];
  }
  const r = radius * size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const t = (px + py) / (2 * size);
      const grad = [0, 1, 2].map((k) => lerp(TEAL_A[k], TEAL_B[k], t));

      let bgA = 0;
      if (tile === 'square') bgA = 1;
      else if (tile === 'rounded') {
        const cx = Math.min(Math.max(px, r), size - r);
        const cy = Math.min(Math.max(py, r), size - r);
        bgA = clamp01(r + 0.5 - Math.hypot(px - cx, py - cy));
      }

      let cov = 0;
      for (const st of strokes) {
        if (px < st.box[0] || py < st.box[1] || px > st.box[2] || py > st.box[3]) continue;
        let d = Infinity;
        for (let i = 1; i < st.pts.length; i++) {
          d = Math.min(d, segDist(px, py, st.pts[i - 1][0], st.pts[i - 1][1], st.pts[i][0], st.pts[i][1]));
        }
        cov = Math.max(cov, clamp01(st.hw + 0.5 - d));
      }

      const markRGB = mark === 'white' ? [255, 255, 255] : grad;
      const a = cov + bgA * (1 - cov);
      const rgb = a > 0 ? [0, 1, 2].map((k) => (markRGB[k] * cov + grad[k] * bgA * (1 - cov)) / a) : [0, 0, 0];
      const o = (y * size + x) * 4;
      png.data[o] = Math.round(rgb[0]);
      png.data[o + 1] = Math.round(rgb[1]);
      png.data[o + 2] = Math.round(rgb[2]);
      png.data[o + 3] = Math.round(a * 255);
    }
  }
  return PNG.sync.write(png);
}

const OUTPUTS = [
  // App icon (iOS and Android legacy launchers mask it themselves).
  ['assets/images/icon.png', { size: 1024, tile: 'square', mark: 'white', markWidth: 0.58 }],
  // Android adaptive icon: gradient background, white mark kept inside the 66% safe zone.
  ['assets/images/android-icon-background.png', { size: 1024, tile: 'square', mark: 'none' }],
  ['assets/images/android-icon-foreground.png', { size: 1024, tile: 'none', mark: 'white', markWidth: 0.42 }],
  ['assets/images/android-icon-monochrome.png', { size: 1024, tile: 'none', mark: 'white', markWidth: 0.42 }],
  // Status-bar notifications must be a white silhouette.
  ['assets/images/notification-icon.png', { size: 96, tile: 'none', mark: 'white', markWidth: 0.82 }],
  // Splash: the teal mark on the light (or dark) splash colour.
  ['assets/images/splash-icon.png', { size: 512, tile: 'none', mark: 'teal', markWidth: 0.8 }],
  ['assets/images/favicon.png', { size: 48, tile: 'rounded', mark: 'white', markWidth: 0.62 }],
  // PWA: rounded "any" icons, a full-bleed maskable icon (mark inside the 80% safe circle), Apple touch icon.
  ['public/icons/icon-192.png', { size: 192, tile: 'rounded', mark: 'white', markWidth: 0.56 }],
  ['public/icons/icon-512.png', { size: 512, tile: 'rounded', mark: 'white', markWidth: 0.56 }],
  ['public/icons/maskable-512.png', { size: 512, tile: 'square', mark: 'white', markWidth: 0.44 }],
  ['public/icons/apple-touch-icon.png', { size: 180, tile: 'square', mark: 'white', markWidth: 0.56 }],
];

for (const [file, opts] of OUTPUTS) {
  const dest = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, render(opts));
  console.log(`wrote ${file} (${opts.size}px)`);
}
