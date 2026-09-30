// Procedural "pencil on paper" drawing helpers for 2D canvas.
// Everything is seeded so textures look identical on every load.

export const INK = '#1a1a1a'
export const PAPER = '#f6f3ec'

export function rng(seed = 1) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/** Paper background with grain + faint fibres. */
export function paper(ctx, w, h, r, tone = PAPER, grain = 0.06) {
  ctx.fillStyle = tone
  ctx.fillRect(0, 0, w, h)
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 255 * grain
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
  // fibres
  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.strokeStyle = '#7a6f5a'
  ctx.lineWidth = 1
  const fibres = Math.floor((w * h) / 9000)
  for (let i = 0; i < fibres; i++) {
    const x = r() * w
    const y = r() * h
    const a = r() * Math.PI
    const l = 4 + r() * 14
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l)
    ctx.stroke()
  }
  ctx.restore()
}

/** A single wobbly pencil stroke drawn as 1–2 overlapping passes. */
export function line(ctx, r, x1, y1, x2, y2, opts = {}) {
  const { width = 2, color = INK, wobble = 1.6, passes = 2, alpha = 0.85 } = opts
  const len = Math.hypot(x2 - x1, y2 - y1)
  const segs = Math.max(2, Math.floor(len / 18))
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let p = 0; p < passes; p++) {
    ctx.globalAlpha = alpha * (p === 0 ? 1 : 0.45)
    ctx.lineWidth = width * (p === 0 ? 1 : 0.7)
    ctx.beginPath()
    // overshoot a little like a real hand does
    const os = (r() - 0.3) * 4
    const dx = (x2 - x1) / len || 0
    const dy = (y2 - y1) / len || 0
    ctx.moveTo(x1 - dx * os + (r() - 0.5) * wobble, y1 - dy * os + (r() - 0.5) * wobble)
    for (let i = 1; i <= segs; i++) {
      const t = i / segs
      const x = x1 + (x2 - x1) * t + (r() - 0.5) * wobble
      const y = y1 + (y2 - y1) * t + (r() - 0.5) * wobble
      ctx.lineTo(x + (i === segs ? dx * os : 0), y + (i === segs ? dy * os : 0))
    }
    ctx.stroke()
  }
  ctx.restore()
}

export function rect(ctx, r, x, y, w, h, opts) {
  line(ctx, r, x, y, x + w, y, opts)
  line(ctx, r, x + w, y, x + w, y + h, opts)
  line(ctx, r, x + w, y + h, x, y + h, opts)
  line(ctx, r, x, y + h, x, y, opts)
}

export function poly(ctx, r, pts, opts = {}) {
  for (let i = 0; i < pts.length - (opts.open ? 1 : 0); i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    line(ctx, r, a[0], a[1], b[0], b[1], opts)
  }
}

export function circle(ctx, r, cx, cy, rad, opts = {}) {
  const { width = 2, color = INK, alpha = 0.85, passes = 2 } = opts
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  for (let p = 0; p < passes; p++) {
    ctx.globalAlpha = alpha * (p === 0 ? 1 : 0.45)
    ctx.lineWidth = width * (p === 0 ? 1 : 0.7)
    ctx.beginPath()
    const start = r() * Math.PI * 2
    const steps = Math.max(16, Math.floor(rad / 2))
    const sweep = Math.PI * 2 + 0.25 + r() * 0.2
    for (let i = 0; i <= steps; i++) {
      const a = start + (i / steps) * sweep
      const rr = rad + (r() - 0.5) * Math.max(1.2, rad * 0.03)
      const x = cx + Math.cos(a) * rr
      const y = cy + Math.sin(a) * rr
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.restore()
}

/** Diagonal hatching clipped to a path-building callback. */
export function hatch(ctx, r, buildPath, bounds, opts = {}) {
  const { spacing = 7, angle = -0.8, width = 1, color = INK, alpha = 0.35, cross = false } = opts
  ctx.save()
  ctx.beginPath()
  buildPath(ctx)
  ctx.clip()
  const [bx, by, bw, bh] = bounds
  const diag = Math.hypot(bw, bh)
  const cx = bx + bw / 2
  const cy = by + bh / 2
  const draw = (ang) => {
    const cos = Math.cos(ang)
    const sin = Math.sin(ang)
    for (let d = -diag / 2; d < diag / 2; d += spacing * (0.8 + r() * 0.4)) {
      const px = cx - sin * d
      const py = cy + cos * d
      line(ctx, r, px - cos * diag / 2, py - sin * diag / 2, px + cos * diag / 2, py + sin * diag / 2, {
        width,
        color,
        alpha: alpha * (0.7 + r() * 0.5),
        wobble: 1.2,
        passes: 1,
      })
    }
  }
  draw(angle)
  if (cross) draw(angle + Math.PI / 2)
  ctx.restore()
}

/** Soft graphite smudge / shading blob. */
export function smudge(ctx, r, x, y, rad, alpha = 0.12, color = '#2a2a2a') {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
  g.addColorStop(0, hexA(color, alpha))
  g.addColorStop(1, hexA(color, 0))
  ctx.fillStyle = g
  ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
}

/** Watercolour-ish fill: several low-alpha jittered layers with darker edges. */
export function wash(ctx, r, buildPath, color, opts = {}) {
  const { layers = 4, alpha = 0.28 } = opts
  ctx.save()
  for (let i = 0; i < layers; i++) {
    ctx.save()
    ctx.translate((r() - 0.5) * 3, (r() - 0.5) * 3)
    ctx.beginPath()
    buildPath(ctx)
    ctx.fillStyle = hexA(color, alpha)
    ctx.fill()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = hexA(shade(color, -0.25), alpha * 0.8)
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

export function handText(ctx, r, text, x, y, opts = {}) {
  const { size = 48, font = 'Cabin Sketch', color = INK, align = 'center', alpha = 0.9, weight = 700 } = opts
  ctx.save()
  ctx.font = `${weight} ${size}px "${font}", "Caveat", cursive`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.globalAlpha = alpha
  ctx.fillText(text, x, y)
  ctx.globalAlpha = alpha * 0.35
  ctx.fillText(text, x + 1 + r(), y + 1)
  ctx.restore()
}

export function hexA(hex, a) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

export function hexToRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function shade(hex, amt) {
  const { r, g, b } = hexToRgb(hex)
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt))))
  return '#' + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('')
}
