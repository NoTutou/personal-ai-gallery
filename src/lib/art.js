// Procedural artworks. Each theme is described as a list of shape "items".
// The same items are rendered twice:
//   mode 'sketch' -> graphite outlines + hatching on paper
//   mode 'color'  -> watercolour washes + the very same outlines
// Because outlines use an identically-seeded RNG in both modes, the two images
// line up perfectly and the paint-reveal shader can blend between them.

import { rng, makeCanvas, paper, line, poly, circle, hatch, wash, INK } from './sketch'

const TAU = Math.PI * 2

// ---- item helpers ----------------------------------------------------------
const P = (pts, color, o = {}) => ({
  color,
  path: (c) => {
    c.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1])
    c.closePath()
  },
  outline: (c, r) => poly(c, r, pts, o.stroke),
  bounds: bbox(pts),
  ...o,
})
const C = (cx, cy, rad, color, o = {}) => ({
  color,
  path: (c) => c.arc(cx, cy, rad, 0, TAU),
  outline: (c, r) => circle(c, r, cx, cy, rad, o.stroke),
  bounds: [cx - rad, cy - rad, rad * 2, rad * 2],
  ...o,
})
const R = (x, y, w, h, color, o = {}) =>
  P(
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    color,
    o,
  )
const L = (pts, o = {}) => ({ outline: (c, r, extra) => poly(c, r, pts, { open: true, ...o, ...extra }) })
const Sky = (w, h, color) => ({ ...R(0, 0, w, h, color), noOutline: true, noHatch: true, bg: true })

function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  return [x0, y0, x1 - x0, y1 - y0]
}

function ellipsePts(cx, cy, rx, ry, rot = 0, n = 28) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU
    const x = Math.cos(a) * rx
    const y = Math.sin(a) * ry
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)])
  }
  return pts
}

// ---- themes ---------------------------------------------------------------
const themes = {
  mountains(w, h, g) {
    const items = [Sky(w, h, '#bfe0f2'), C(w * 0.72, h * 0.22, 46, '#f7c948', { hatchOpts: { spacing: 9 } })]
    const peaks = [
      [w * 0.05, h * 0.62, w * 0.3, h * 0.3, w * 0.62, '#8aa1b8'],
      [w * 0.35, h * 0.68, w * 0.62, h * 0.24, w * 0.98, '#6d8aa6'],
    ]
    for (const [x0, base, px, py, x1, col] of peaks) {
      items.push(P([[x0 - 60, base + 60], [px, py], [x1 + 40, base + 60]], col, { hatchOpts: { spacing: 8, angle: -0.5 } }))
      items.push(P([[px - 38, py + 44], [px, py], [px + 40, py + 46], [px + 12, py + 36], [px - 10, py + 52]], '#ffffff', { noHatch: true }))
    }
    items.push(P([[0, h * 0.72], [w * 0.4, h * 0.66], [w, h * 0.74], [w, h], [0, h]], '#8cc084', { hatchOpts: { spacing: 10, angle: 0.4 } }))
    for (let i = 0; i < 6; i++) {
      const x = w * 0.08 + g() * w * 0.84
      const y = h * 0.78 + g() * h * 0.14
      const s = 26 + g() * 20
      items.push(P([[x - s * 0.55, y], [x, y - s * 1.9], [x + s * 0.55, y]], '#3f7d4e', { hatchOpts: { spacing: 5 } }))
      items.push(L([[x, y], [x, y + s * 0.4]]))
    }
    return items
  },

  sea(w, h, g) {
    const items = [Sky(w, h, '#ffe2c2'), C(w * 0.3, h * 0.4, 70, '#f59e5b', { hatchOpts: { spacing: 10 } })]
    items.push(R(0, h * 0.5, w, h * 0.5, '#4f9cc9', { hatchOpts: { spacing: 12, angle: 0 } }))
    for (let i = 0; i < 9; i++) {
      const y = h * 0.56 + i * 26
      const x = g() * w * 0.6
      const pts = []
      for (let k = 0; k < 6; k++) pts.push([x + k * 28, y + (k % 2 ? -6 : 4)])
      items.push(L(pts, { width: 1.6 }))
    }
    // boat
    const bx = w * 0.62, by = h * 0.62
    items.push(P([[bx - 90, by], [bx + 90, by], [bx + 62, by + 34], [bx - 62, by + 34]], '#b0563a', { hatchOpts: { spacing: 6 } }))
    items.push(P([[bx, by - 170], [bx, by - 8], [bx + 80, by - 8]], '#fafafa', { noHatch: true }))
    items.push(P([[bx - 6, by - 150], [bx - 6, by - 8], [bx - 70, by - 8]], '#f3d36b', { noHatch: true }))
    for (let i = 0; i < 3; i++) {
      const x = w * 0.15 + g() * w * 0.6, y = h * 0.1 + g() * h * 0.15
      items.push(L([[x - 16, y - 6], [x, y + 4], [x + 16, y - 8]], { width: 2 }))
    }
    return items
  },

  house(w, h, g) {
    const items = [Sky(w, h, '#cfe9f7')]
    items.push(P([[0, h * 0.7], [w * 0.5, h * 0.62], [w, h * 0.7], [w, h], [0, h]], '#9ccf7e', { hatchOpts: { spacing: 11, angle: 0.3 } }))
    const hx = w * 0.22, hy = h * 0.42, hw = w * 0.5, hh = h * 0.28
    items.push(R(hx + hw * 0.66, hy - 110, 30, 80, '#a0522d'))
    items.push(R(hx, hy, hw, hh, '#f3dfb3', { hatchOpts: { spacing: 12, angle: -1.2, alpha: 0.2 } }))
    items.push(P([[hx - 26, hy + 4], [hx + hw / 2, hy - 120], [hx + hw + 26, hy + 4]], '#c8553d', { hatchOpts: { spacing: 6 } }))
    items.push(R(hx + hw * 0.42, hy + hh * 0.42, hw * 0.18, hh * 0.58, '#7a4b2a', { hatchOpts: { spacing: 5 } }))
    items.push(R(hx + hw * 0.1, hy + hh * 0.2, hw * 0.2, hh * 0.3, '#fff3a8', { noHatch: true }))
    items.push(R(hx + hw * 0.7, hy + hh * 0.2, hw * 0.2, hh * 0.3, '#fff3a8', { noHatch: true }))
    items.push(L([[hx + hw * 0.2, hy + hh * 0.2], [hx + hw * 0.2, hy + hh * 0.5]]))
    items.push(L([[hx + hw * 0.8, hy + hh * 0.2], [hx + hw * 0.8, hy + hh * 0.5]]))
    for (let i = 0; i < 3; i++) items.push(C(hx + hw * 0.7 + i * 14, hy - 130 - i * 32, 14 + i * 6, '#e6e6e6', { noHatch: true }))
    // tree
    items.push(R(w * 0.84, h * 0.52, 18, 110, '#7a4b2a'))
    items.push(C(w * 0.86, h * 0.47, 52, '#4f9a5a', { hatchOpts: { spacing: 6 } }))
    return items
  },

  flowers(w, h, g) {
    const items = [Sky(w, h, '#fbe8ef')]
    items.push(R(0, h * 0.8, w, h * 0.2, '#d9b38c', { hatchOpts: { spacing: 9, angle: 0 } }))
    const vx = w * 0.5
    items.push(P([[vx - 60, h * 0.58], [vx + 60, h * 0.58], [vx + 80, h * 0.7], [vx + 50, h * 0.84], [vx - 50, h * 0.84], [vx - 80, h * 0.7]], '#5c8fd6', { hatchOpts: { spacing: 7 } }))
    const cols = ['#e85d75', '#f6b93b', '#b07bd6', '#ff8c5a', '#f06292']
    for (let i = 0; i < 5; i++) {
      const fx = vx - 130 + i * 65 + (g() - 0.5) * 20
      const fy = h * 0.2 + g() * h * 0.18
      items.push(L([[vx + (i - 2) * 10, h * 0.58], [(fx + vx) / 2, (fy + h * 0.58) / 2 + 20], [fx, fy + 20]], { width: 2.4 }))
      items.push(P([[(fx + vx) / 2, (fy + h * 0.58) / 2 + 20], [(fx + vx) / 2 + 34, (fy + h * 0.58) / 2 - 4], [(fx + vx) / 2 + 12, (fy + h * 0.58) / 2 + 24]], '#5fa55a', { noHatch: true }))
      const col = cols[i % cols.length]
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU
        items.push(C(fx + Math.cos(a) * 24, fy + Math.sin(a) * 24, 17, col, { noHatch: true, stroke: { width: 1.6 } }))
      }
      items.push(C(fx, fy, 14, '#ffd54f', { hatchOpts: { spacing: 4 } }))
    }
    return items
  },

  city(w, h, g) {
    const items = [Sky(w, h, '#2c3e66'), C(w * 0.78, h * 0.16, 40, '#fdf1b8', { noHatch: true })]
    for (let i = 0; i < 26; i++) items.push(C(g() * w, g() * h * 0.45, 2, '#ffffff', { noHatch: true, stroke: { width: 1 } }))
    let x = -10
    while (x < w) {
      const bw = 60 + g() * 60
      const bh = h * (0.25 + g() * 0.4)
      const y = h - bh
      const col = ['#44506e', '#5b4a78', '#3a5a6a'][Math.floor(g() * 3)]
      items.push(R(x, y, bw, bh, col, { hatchOpts: { spacing: 8, angle: -1.1 } }))
      for (let wy = y + 18; wy < h - 30; wy += 34) {
        for (let wx = x + 12; wx < x + bw - 22; wx += 26) {
          if (g() > 0.45) items.push(R(wx, wy, 14, 18, '#ffd76a', { noHatch: true, stroke: { width: 1.2 } }))
        }
      }
      x += bw + 6
    }
    return items
  },

  planet(w, h, g) {
    const items = [Sky(w, h, '#1f2447')]
    for (let i = 0; i < 40; i++) {
      const sx = g() * w, sy = g() * h
      items.push(L([[sx - 5, sy], [sx + 5, sy]], { width: 1.4 }))
      items.push({ ...L([[sx, sy - 5], [sx, sy + 5]], { width: 1.4 }) })
    }
    const cx = w * 0.5, cy = h * 0.48
    items.push(C(cx, cy, 120, '#e59866', { hatchOpts: { spacing: 7 } }))
    items.push(P(ellipsePts(cx, cy - 20, 60, 16, 0.1), '#c0654a', { noHatch: true }))
    items.push(P(ellipsePts(cx + 10, cy + 40, 80, 12, 0.1), '#d67b58', { noHatch: true }))
    items.push({ ...L([...ellipsePts(cx, cy, 200, 44, -0.3, 40), ellipsePts(cx, cy, 200, 44, -0.3, 40)[0]], { width: 3 }), color: '#f5d68a' })
    items.push(C(w * 0.18, h * 0.8, 36, '#b9c7d6', { hatchOpts: { spacing: 5 } }))
    items.push(C(w * 0.84, h * 0.2, 18, '#9bd1c4', { noHatch: true }))
    return items
  },

  tree(w, h, g) {
    const items = [Sky(w, h, '#e3f2d9'), C(w * 0.2, h * 0.16, 36, '#ffcf56', { noHatch: true })]
    items.push(P([[0, h * 0.82], [w, h * 0.78], [w, h], [0, h]], '#8ab86b', { hatchOpts: { spacing: 9, angle: 0.2 } }))
    const tx = w * 0.52
    items.push(P([[tx - 26, h * 0.82], [tx - 14, h * 0.5], [tx - 50, h * 0.36], [tx - 6, h * 0.46], [tx + 4, h * 0.3], [tx + 14, h * 0.46], [tx + 56, h * 0.38], [tx + 18, h * 0.52], [tx + 30, h * 0.82]], '#8b5a3c', { hatchOpts: { spacing: 5, angle: -1.4 } }))
    const blobs = [[0, -0.1, 96], [-80, 0, 74], [84, -0.02, 78], [-40, -0.2, 70], [46, -0.2, 72]]
    for (const [dx, dy, rad] of blobs) items.push(C(tx + dx, h * (0.32 + dy), rad, '#58a55c', { hatchOpts: { spacing: 7 } }))
    for (let i = 0; i < 7; i++) {
      const a = g() * TAU, d = 30 + g() * 90
      items.push(C(tx + Math.cos(a) * d, h * 0.26 + Math.sin(a) * d * 0.6, 9, '#e0463c', { noHatch: true, stroke: { width: 1.5 } }))
    }
    for (let i = 0; i < 14; i++) {
      const gx = g() * w, gy = h * 0.86 + g() * h * 0.1
      items.push(L([[gx - 4, gy], [gx, gy - 12], [gx + 4, gy]], { width: 1.4 }))
    }
    return items
  },

  rocket(w, h, g) {
    const items = [Sky(w, h, '#d6e6fb')]
    for (let i = 0; i < 4; i++) {
      const cx = g() * w, cy = h * 0.1 + g() * h * 0.5
      items.push(C(cx, cy, 26, '#ffffff', { noHatch: true }))
      items.push(C(cx + 28, cy + 4, 20, '#ffffff', { noHatch: true }))
      items.push(C(cx - 26, cy + 6, 18, '#ffffff', { noHatch: true }))
    }
    const rx = w * 0.5, ry = h * 0.2
    items.push(P([[rx - 30, ry + 290], [rx, ry + 390 + g() * 20], [rx + 30, ry + 290]], '#ff8a3d', { noHatch: true }))
    items.push(P([[rx - 16, ry + 290], [rx, ry + 350], [rx + 16, ry + 290]], '#ffd64f', { noHatch: true }))
    items.push(P([[rx - 50, ry + 200], [rx - 100, ry + 300], [rx - 50, ry + 280]], '#d64545', { hatchOpts: { spacing: 5 } }))
    items.push(P([[rx + 50, ry + 200], [rx + 100, ry + 300], [rx + 50, ry + 280]], '#d64545', { hatchOpts: { spacing: 5 } }))
    items.push(P([[rx, ry], [rx + 50, ry + 90], [rx + 54, ry + 290], [rx - 54, ry + 290], [rx - 50, ry + 90]], '#f2f2f2', { hatchOpts: { spacing: 10, alpha: 0.2 } }))
    items.push(P([[rx, ry], [rx + 42, ry + 76], [rx - 42, ry + 76]], '#d64545', { hatchOpts: { spacing: 5 } }))
    items.push(C(rx, ry + 150, 26, '#7cc6f2', { noHatch: true }))
    items.push(C(rx, ry + 150, 17, '#bfe6ff', { noHatch: true, stroke: { width: 1.2 } }))
    return items
  },
}

// ---- renderer ---------------------------------------------------------------
const cache = new Map()

export function renderArt(theme, seed, mode, w = 512, h = 640) {
  const key = `${theme}|${seed}|${mode}|${w}x${h}`
  if (cache.has(key)) return cache.get(key)

  const canvas = makeCanvas(w, h)
  const ctx = canvas.getContext('2d')
  const geo = rng(seed)
  const items = (themes[theme] || themes.tree)(w, h, geo)

  paper(ctx, w, h, rng(seed + 11), '#f7f4ec', 0.05)

  if (mode === 'color') {
    const wr = rng(seed + 29)
    for (const it of items) if (it.path && it.color) wash(ctx, wr, it.path, it.color, { alpha: it.bg ? 0.45 : 0.32 })
    // colour lines (e.g. the planet ring) get a tinted pass
    for (const it of items) if (!it.path && it.color) it.outline(ctx, rng(seed + 3), { color: it.color })
  } else {
    const hr = rng(seed + 47)
    for (const it of items) {
      if (!it.path || it.noHatch || it.bg) continue
      hatch(ctx, hr, it.path, it.bounds, { spacing: 8, alpha: 0.28, ...(it.hatchOpts || {}) })
    }
  }

  // identical outlines in both modes
  const sr = rng(seed + 101)
  for (const it of items) if (!it.noOutline) it.outline(ctx, sr)

  // light edge vignette
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(60,50,30,0.12)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)

  cache.set(key, canvas)
  return canvas
}

export const artThemes = Object.keys(themes)
export { INK }
