// Builds every CanvasTexture used in the 3D scenes. Called once from the
// preloader (prepareAssets) so the corridor appears instantly afterwards.

import * as THREE from 'three'
import { rng, makeCanvas, paper, line, rect, circle, hatch, smudge, wash, handText, hexA, INK, PAPER } from './sketch'
import { renderArt } from './art'
import { rooms, projects, corridorArt, site } from '../data/content'

const store = new Map()

export function tex(key) {
  const t = store.get(key)
  if (!t) console.warn('[textures] missing', key)
  return t
}

function toTexture(canvas, { repeat, anisotropy = 8 } = {}) {
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = anisotropy
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  t.needsUpdate = true
  return t
}

// ---------------------------------------------------------------------------
// Corridor surfaces
// ---------------------------------------------------------------------------
function wallCanvas(seed) {
  // one tile = 4m wide x 3.6m tall
  const w = 1024, h = 922
  const c = makeCanvas(w, h)
  const x = c.getContext('2d')
  const r = rng(seed)
  paper(x, w, h, r, PAPER, 0.05)
  const m = h / 3.6 // px per metre
  const yFloor = h
  const rail = h - 0.95 * m
  const crown = 0.14 * m

  // lower wainscot shading
  hatch(x, r, (p) => p.rect(0, rail, w, h - rail), [0, rail, w, h - rail], { spacing: 9, angle: -1.05, alpha: 0.13 })
  // panels on the wainscot
  for (let i = 0; i < 2; i++) {
    const px = 40 + i * (w / 2)
    rect(x, r, px, rail + 36, w / 2 - 80, h - rail - 86, { width: 2, alpha: 0.6 })
  }
  // chair rail + skirting + crown moulding
  line(x, r, 0, rail, w, rail, { width: 3.5 })
  line(x, r, 0, rail + 10, w, rail + 10, { width: 1.5, alpha: 0.5 })
  line(x, r, 0, yFloor - 36, w, yFloor - 36, { width: 3 })
  hatch(x, r, (p) => p.rect(0, yFloor - 36, w, 36), [0, yFloor - 36, w, 36], { spacing: 5, angle: -0.6, alpha: 0.35 })
  line(x, r, 0, crown, w, crown, { width: 3 })
  line(x, r, 0, crown + 12, w, crown + 12, { width: 1.4, alpha: 0.5 })

  // occasional smudges and pencil marks
  for (let i = 0; i < 5; i++) smudge(x, r, r() * w, crown + r() * (rail - crown), 40 + r() * 80, 0.05)
  for (let i = 0; i < 6; i++) {
    const sx = r() * w, sy = crown + 30 + r() * (rail - crown - 60)
    line(x, r, sx, sy, sx + 10 + r() * 30, sy + (r() - 0.5) * 8, { width: 1, alpha: 0.18, passes: 1 })
  }
  // ambient occlusion near floor/ceiling
  let g = x.createLinearGradient(0, 0, 0, crown * 3)
  g.addColorStop(0, 'rgba(40,30,20,0.18)')
  g.addColorStop(1, 'rgba(40,30,20,0)')
  x.fillStyle = g
  x.fillRect(0, 0, w, crown * 3)
  g = x.createLinearGradient(0, h, 0, h - 120)
  g.addColorStop(0, 'rgba(40,30,20,0.22)')
  g.addColorStop(1, 'rgba(40,30,20,0)')
  x.fillStyle = g
  x.fillRect(0, h - 120, w, 120)
  return c
}

function floorCanvas(seed) {
  // one tile = 5m (across) x 5m (along)
  const s = 1024
  const c = makeCanvas(s, s)
  const x = c.getContext('2d')
  const r = rng(seed)
  paper(x, s, s, r, '#efe9dc', 0.06)
  const planks = 8
  const pw = s / planks
  for (let i = 0; i <= planks; i++) line(x, r, i * pw, 0, i * pw, s, { width: 2.4, alpha: 0.7 })
  for (let i = 0; i < planks; i++) {
    // staggered joints
    const off = (i % 2) * (s / 3) + r() * 60
    for (let y = off % (s / 1.5); y < s; y += s / 1.5) line(x, r, i * pw, y, (i + 1) * pw, y + (r() - 0.5) * 4, { width: 2, alpha: 0.6 })
    // grain
    for (let k = 0; k < 7; k++) {
      const gx = i * pw + 10 + r() * (pw - 20)
      const gy = r() * s
      const gl = 40 + r() * 140
      line(x, r, gx, gy, gx + (r() - 0.5) * 8, gy + gl, { width: 1, alpha: 0.2, passes: 1, wobble: 2 })
    }
    if (r() > 0.6) circle(x, r, i * pw + pw / 2 + (r() - 0.5) * 20, r() * s, 6 + r() * 6, { width: 1, alpha: 0.35, passes: 1 })
  }
  // darker edges near the walls (u = 0 and u = 1)
  for (const side of [0, 1]) {
    const g = x.createLinearGradient(side * s, 0, side ? s - 200 : 200, 0)
    g.addColorStop(0, 'rgba(40,30,20,0.28)')
    g.addColorStop(1, 'rgba(40,30,20,0)')
    x.fillStyle = g
    x.fillRect(side ? s - 200 : 0, 0, 200, s)
  }
  return c
}

function ceilingCanvas(seed) {
  const s = 1024
  const c = makeCanvas(s, s)
  const x = c.getContext('2d')
  const r = rng(seed)
  paper(x, s, s, r, '#f2eee5', 0.04)
  // beams across the corridor
  for (const y of [120, 632]) {
    hatch(x, r, (p) => p.rect(0, y, s, 90), [0, y, s, 90], { spacing: 6, angle: 0.9, alpha: 0.3 })
    line(x, r, 0, y, s, y, { width: 3 })
    line(x, r, 0, y + 90, s, y + 90, { width: 3 })
  }
  for (const side of [0, 1]) {
    const g = x.createLinearGradient(side * s, 0, side ? s - 240 : 240, 0)
    g.addColorStop(0, 'rgba(40,30,20,0.3)')
    g.addColorStop(1, 'rgba(40,30,20,0)')
    x.fillStyle = g
    x.fillRect(side ? s - 240 : 0, 0, 240, s)
  }
  return c
}

// Door casing: frame + opening (dark in sketch, warm glow in colour) + sign.
// Plane size 1.8m x 3.3m. Opening is 1.2m x 2.3m from the bottom.
export const DOOR = { casingW: 1.8, casingH: 3.3, leafW: 1.2, leafH: 2.3 }

function casingCanvas(room, mode) {
  const w = 544, h = 998 // ~302px per metre
  const m = w / DOOR.casingW
  const c = makeCanvas(w, h)
  const x = c.getContext('2d')
  const seed = 500 + room.id.length * 17
  x.clearRect(0, 0, w, h)
  const ox = (w - DOOR.leafW * m) / 2
  const oy = h - DOOR.leafH * m
  const ow = DOOR.leafW * m
  const oh = DOOR.leafH * m
  const r = rng(seed)

  // casing boards
  x.fillStyle = PAPER
  x.fillRect(ox - 34, oy - 34, ow + 68, oh + 34)
  if (mode === 'color') wash(x, rng(seed + 5), (p) => p.rect(ox - 34, oy - 34, ow + 68, oh + 34), '#c9a27a', { alpha: 0.35 })
  else hatch(x, rng(seed + 5), (p) => p.rect(ox - 34, oy - 34, ow + 68, oh + 34), [ox - 34, oy - 34, ow + 68, oh + 34], { spacing: 7, alpha: 0.2, angle: -1.3 })

  // opening
  if (mode === 'color') {
    const g = x.createLinearGradient(0, oy, 0, h)
    g.addColorStop(0, room.color)
    g.addColorStop(1, '#fff8e6')
    x.fillStyle = g
    x.fillRect(ox, oy, ow, oh)
    // light rays
    x.globalAlpha = 0.35
    for (let i = 0; i < 6; i++) line(x, r, ox + r() * ow, oy, ox + r() * ow, h, { width: 6 + r() * 8, color: '#ffffff', passes: 1, alpha: 0.5 })
    x.globalAlpha = 1
  } else {
    x.fillStyle = '#3a3733'
    x.fillRect(ox, oy, ow, oh)
    hatch(x, rng(seed + 9), (p) => p.rect(ox, oy, ow, oh), [ox, oy, ow, oh], { spacing: 5, alpha: 0.6, cross: true, color: '#111' })
  }

  const sr = rng(seed + 77)
  rect(x, sr, ox - 34, oy - 34, ow + 68, oh + 34, { width: 3.2 })
  rect(x, sr, ox, oy, ow, oh, { width: 2.6 })
  line(x, sr, ox - 50, oy - 34, ox + ow + 50, oy - 34, { width: 3.4 })
  line(x, sr, ox - 50, oy - 48, ox + ow + 50, oy - 48, { width: 2 })

  // sign board
  const sw = 360, sh = 120
  const sx = (w - sw) / 2
  const sy = oy - 58 - sh - 40
  line(x, sr, sx + 40, sy + sh, sx + 60, oy - 48, { width: 2 })
  line(x, sr, sx + sw - 40, sy + sh, sx + sw - 60, oy - 48, { width: 2 })
  x.fillStyle = '#fbf8f1'
  x.fillRect(sx, sy, sw, sh)
  if (mode === 'color') wash(x, rng(seed + 13), (p) => p.rect(sx, sy, sw, sh), room.color, { alpha: 0.5 })
  rect(x, sr, sx, sy, sw, sh, { width: 3 })
  rect(x, sr, sx + 10, sy + 10, sw - 20, sh - 20, { width: 1.4, alpha: 0.5 })
  handText(x, sr, room.label, w / 2, sy + sh / 2 + 4, { size: 70 })
  return c
}

function leafCanvas(room, mode) {
  const w = 363, h = 696 // 1.2 x 2.3m
  const c = makeCanvas(w, h)
  const x = c.getContext('2d')
  const seed = 900 + room.id.length * 31
  const r = rng(seed)
  paper(x, w, h, r, '#f3eee3', 0.05)
  if (mode === 'color') wash(x, rng(seed + 3), (p) => p.rect(0, 0, w, h), room.color, { alpha: 0.45, layers: 5 })

  const hr = rng(seed + 8)
  const panels = [
    [40, 40, w - 80, h * 0.38],
    [40, h * 0.5, w - 80, h * 0.42],
  ]
  if (mode !== 'color') {
    hatch(x, hr, (p) => p.rect(0, 0, w, h), [0, 0, w, h], { spacing: 11, alpha: 0.12, angle: -1.35 })
    for (const [px, py, pw, ph] of panels) hatch(x, hr, (p) => p.rect(px, py, pw, ph), [px, py, pw, ph], { spacing: 6, alpha: 0.3 })
  } else {
    for (const [px, py, pw, ph] of panels) wash(x, hr, (p) => p.rect(px, py, pw, ph), room.color, { alpha: 0.35 })
  }

  const sr = rng(seed + 41)
  rect(x, sr, 4, 4, w - 8, h - 8, { width: 3.4 })
  for (const [px, py, pw, ph] of panels) {
    rect(x, sr, px, py, pw, ph, { width: 2.6 })
    rect(x, sr, px + 12, py + 12, pw - 24, ph - 24, { width: 1.3, alpha: 0.5 })
  }
  // knob
  const kx = w - 46, ky = h * 0.47
  if (mode === 'color') {
    x.fillStyle = '#e8b64c'
    x.beginPath()
    x.arc(kx, ky, 16, 0, Math.PI * 2)
    x.fill()
  }
  circle(x, sr, kx, ky, 16, { width: 2.6 })
  circle(x, sr, kx - 3, ky - 3, 5, { width: 1.4 })
  rect(x, sr, kx - 10, ky + 26, 20, 34, { width: 1.8 })
  return c
}

// Picture frame border (with a nail and string above). Plane 1.34 x 1.95m.
function frameBorderCanvas(seed) {
  const w = 440, h = 640
  const c = makeCanvas(w, h)
  const x = c.getContext('2d')
  const r = rng(seed)
  x.clearRect(0, 0, w, h)
  const top = 130
  // string
  line(x, r, w / 2, 20, 60, top + 10, { width: 1.8, alpha: 0.7 })
  line(x, r, w / 2, 20, w - 60, top + 10, { width: 1.8, alpha: 0.7 })
  circle(x, r, w / 2, 20, 6, { width: 2 })
  // wooden border
  x.fillStyle = '#efe6d6'
  x.fillRect(12, top, w - 24, h - top - 12)
  hatch(x, r, (p) => p.rect(12, top, w - 24, h - top - 12), [12, top, w - 24, h - top - 12], { spacing: 6, alpha: 0.35, angle: -0.8 })
  rect(x, r, 12, top, w - 24, h - top - 12, { width: 3.4 })
  rect(x, r, 40, top + 28, w - 80, h - top - 68, { width: 2.2 })
  // mitre joints
  line(x, r, 12, top, 40, top + 28, { width: 1.6 })
  line(x, r, w - 12, top, w - 40, top + 28, { width: 1.6 })
  line(x, r, 12, h - 12, 40, h - 40, { width: 1.6 })
  line(x, r, w - 12, h - 12, w - 40, h - 40, { width: 1.6 })
  return c
}

function captionCanvas(text, seed) {
  const w = 512, h = 96
  const c = makeCanvas(w, h)
  const x = c.getContext('2d')
  const r = rng(seed)
  x.fillStyle = '#fbf8f0'
  x.fillRect(40, 10, w - 80, h - 20)
  rect(x, r, 40, 10, w - 80, h - 20, { width: 2 })
  handText(x, r, text, w / 2, h / 2 + 2, { size: 46, font: 'Caveat', weight: 700 })
  return c
}

function lampCanvas(mode) {
  const w = 256, h = 512
  const c = makeCanvas(w, h)
  const x = c.getContext('2d')
  const r = rng(71)
  x.clearRect(0, 0, w, h)
  line(x, r, w / 2, 0, w / 2, 300, { width: 2 })
  const pts = [
    [w / 2 - 30, 300],
    [w / 2 + 30, 300],
    [w / 2 + 100, 410],
    [w / 2 - 100, 410],
  ]
  const build = (p) => {
    p.moveTo(...pts[0])
    for (const q of pts.slice(1)) p.lineTo(...q)
    p.closePath()
  }
  x.fillStyle = PAPER
  x.beginPath()
  build(x)
  x.fill()
  if (mode === 'color') wash(x, rng(5), build, '#f2c46d', { alpha: 0.5 })
  else hatch(x, rng(5), build, [w / 2 - 100, 300, 200, 110], { spacing: 6, alpha: 0.4 })
  for (let i = 0; i < 4; i++) line(x, r, pts[i][0], pts[i][1], pts[(i + 1) % 4][0], pts[(i + 1) % 4][1], { width: 2.8 })
  if (mode === 'color') {
    x.fillStyle = '#fff4c2'
    x.beginPath()
    x.arc(w / 2, 418, 26, 0, Math.PI * 2)
    x.fill()
  }
  circle(x, r, w / 2, 418, 26, { width: 2.2 })
  return c
}

function lightPoolCanvas() {
  const s = 256
  const c = makeCanvas(s, s)
  const x = c.getContext('2d')
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,236,190,0.55)')
  g.addColorStop(1, 'rgba(255,236,190,0)')
  x.fillStyle = g
  x.fillRect(0, 0, s, s)
  return c
}

function plantCanvas(mode, seed) {
  const w = 384, h = 640
  const c = makeCanvas(w, h)
  const x = c.getContext('2d')
  const r = rng(seed)
  x.clearRect(0, 0, w, h)
  const leafs = []
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.28 + (r() - 0.5) * 0.2
    const len = 180 + r() * 150
    leafs.push([a, len])
  }
  const bx = w / 2, by = h - 190
  for (const [a, len] of leafs) {
    const tx = bx + Math.cos(a) * len, ty = by + Math.sin(a) * len
    const nx = -Math.sin(a) * 26, ny = Math.cos(a) * 26
    const mx = (bx + tx) / 2, my = (by + ty) / 2
    const build = (p) => {
      p.moveTo(bx, by)
      p.quadraticCurveTo(mx + nx, my + ny, tx, ty)
      p.quadraticCurveTo(mx - nx, my - ny, bx, by)
    }
    x.fillStyle = PAPER
    x.beginPath()
    build(x)
    x.fill()
    if (mode === 'color') wash(x, rng(seed + 3), build, '#5ea463', { alpha: 0.5 })
    else hatch(x, rng(seed + 3), build, [Math.min(bx, tx) - 30, Math.min(by, ty) - 30, Math.abs(tx - bx) + 60, Math.abs(ty - by) + 60], { spacing: 6, alpha: 0.35 })
    x.save()
    x.strokeStyle = INK
    x.lineWidth = 2.4
    x.globalAlpha = 0.85
    x.beginPath()
    build(x)
    x.stroke()
    x.lineWidth = 1.2
    x.beginPath()
    x.moveTo(bx, by)
    x.lineTo(tx, ty)
    x.stroke()
    x.restore()
  }
  // pot
  const pts = [
    [bx - 90, h - 200],
    [bx + 90, h - 200],
    [bx + 66, h - 10],
    [bx - 66, h - 10],
  ]
  const build = (p) => {
    p.moveTo(...pts[0])
    for (const q of pts.slice(1)) p.lineTo(...q)
    p.closePath()
  }
  x.fillStyle = PAPER
  x.beginPath()
  build(x)
  x.fill()
  if (mode === 'color') wash(x, rng(seed + 9), build, '#c86b4a', { alpha: 0.55 })
  else hatch(x, rng(seed + 9), build, [bx - 90, h - 200, 180, 190], { spacing: 7, alpha: 0.4 })
  for (let i = 0; i < 4; i++) line(x, r, pts[i][0], pts[i][1], pts[(i + 1) % 4][0], pts[(i + 1) % 4][1], { width: 3 })
  line(x, r, bx - 96, h - 170, bx + 96, h - 170, { width: 2.4 })
  return c
}

function endWallCanvas(mode) {
  const w = 1024, h = 737 // 5 x 3.6m
  const c = makeCanvas(w, h)
  const x = c.getContext('2d')
  const r = rng(404)
  paper(x, w, h, r, PAPER, 0.05)
  // big arched window
  const wx = w / 2, wy = 150, ww = 380, wh = 360
  const build = (p) => {
    p.moveTo(wx - ww / 2, wy + wh)
    p.lineTo(wx - ww / 2, wy + ww / 2)
    p.arc(wx, wy + ww / 2, ww / 2, Math.PI, 0)
    p.lineTo(wx + ww / 2, wy + wh)
    p.closePath()
  }
  if (mode === 'color') {
    x.save()
    x.beginPath()
    build(x)
    x.clip()
    const g = x.createLinearGradient(0, wy, 0, wy + wh)
    g.addColorStop(0, '#9fd0f0')
    g.addColorStop(1, '#ffe7c4')
    x.fillStyle = g
    x.fillRect(wx - ww / 2, wy, ww, wh)
    x.fillStyle = '#f7c948'
    x.beginPath()
    x.arc(wx + 60, wy + 190, 40, 0, Math.PI * 2)
    x.fill()
    x.fillStyle = 'rgba(120,170,110,0.8)'
    x.beginPath()
    x.moveTo(wx - ww / 2, wy + wh)
    x.quadraticCurveTo(wx - 60, wy + wh - 120, wx + ww / 2, wy + wh - 60)
    x.lineTo(wx + ww / 2, wy + wh)
    x.fill()
    x.restore()
  } else {
    hatch(x, rng(9), build, [wx - ww / 2, wy, ww, wh], { spacing: 9, alpha: 0.18, angle: -0.6 })
  }
  x.save()
  x.strokeStyle = INK
  x.lineWidth = 4
  x.globalAlpha = 0.85
  x.beginPath()
  build(x)
  x.stroke()
  x.lineWidth = 2
  x.beginPath()
  x.moveTo(wx, wy)
  x.lineTo(wx, wy + wh)
  x.moveTo(wx - ww / 2, wy + wh * 0.62)
  x.lineTo(wx + ww / 2, wy + wh * 0.62)
  x.stroke()
  x.restore()
  circle(x, r, wx + 60, wy + 190, 40, { width: 2 })
  line(x, r, wx - ww / 2 - 30, wy + wh, wx + ww / 2 + 30, wy + wh, { width: 4 })
  handText(x, r, 'to be continued...', wx, wy + wh + 80, { size: 54, font: 'Caveat', weight: 700 })
  // wainscot like the walls
  const rail = h - 0.95 * (h / 3.6)
  line(x, r, 0, rail, w, rail, { width: 3.5 })
  line(x, r, 0, h - 36, w, h - 36, { width: 3 })
  hatch(x, rng(12), (p) => p.rect(0, rail, w, h - rail), [0, rail, w, h - rail], { spacing: 9, angle: -1.05, alpha: 0.13 })
  return c
}

function bannerCanvas() {
  const w = 1400, h = 360
  const c = makeCanvas(w, h)
  const x = c.getContext('2d')
  const r = rng(808)
  x.clearRect(0, 0, w, h)
  // strings
  line(x, r, 140, 0, 180, 70, { width: 2 })
  line(x, r, w - 140, 0, w - 180, 70, { width: 2 })
  // paper banner
  x.fillStyle = '#fbf8f1'
  x.fillRect(90, 70, w - 180, h - 100)
  rect(x, r, 90, 70, w - 180, h - 100, { width: 3.2 })
  handText(x, r, `Hi, I'm ${site.name}`, w / 2, 160, { size: 110 })
  handText(x, r, `${site.role} — scroll to walk in`, w / 2, 262, { size: 62, font: 'Caveat', weight: 600, alpha: 0.75 })
  return c
}

function roundWallCanvas() {
  const w = 2048, h = 512
  const c = makeCanvas(w, h)
  const x = c.getContext('2d')
  const r = rng(1234)
  paper(x, w, h, r, PAPER, 0.05)
  const rail = h * 0.72
  line(x, r, 0, rail, w, rail, { width: 3 })
  line(x, r, 0, h - 20, w, h - 20, { width: 3 })
  line(x, r, 0, 30, w, 30, { width: 2.5 })
  hatch(x, r, (p) => p.rect(0, rail, w, h - rail), [0, rail, w, h - rail], { spacing: 9, angle: -1.05, alpha: 0.14 })
  for (let i = 0; i < 16; i++) line(x, r, (i / 16) * w, rail + 10, (i / 16) * w, h - 26, { width: 1.6, alpha: 0.5 })
  const g = x.createLinearGradient(0, h, 0, h - 80)
  g.addColorStop(0, 'rgba(40,30,20,0.2)')
  g.addColorStop(1, 'rgba(40,30,20,0)')
  x.fillStyle = g
  x.fillRect(0, h - 80, w, 80)
  return c
}

function roundFloorCanvas() {
  const s = 1024
  const c = makeCanvas(s, s)
  const x = c.getContext('2d')
  const r = rng(4321)
  paper(x, s, s, r, '#efe9dc', 0.06)
  for (let k = 1; k < 8; k++) circle(x, r, s / 2, s / 2, k * 64, { width: 1.6, alpha: 0.4, passes: 1 })
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2
    line(x, r, s / 2 + Math.cos(a) * 64, s / 2 + Math.sin(a) * 64, s / 2 + Math.cos(a) * 500, s / 2 + Math.sin(a) * 500, { width: 1.2, alpha: 0.3, passes: 1 })
  }
  // rug
  x.fillStyle = hexA('#d98b6a', 0.25)
  x.beginPath()
  x.arc(s / 2, s / 2, 150, 0, Math.PI * 2)
  x.fill()
  circle(x, r, s / 2, s / 2, 150, { width: 3 })
  circle(x, r, s / 2, s / 2, 130, { width: 1.5, alpha: 0.5 })
  return c
}

// ---------------------------------------------------------------------------
// Preparation with progress reporting
// ---------------------------------------------------------------------------
const tick = () => new Promise((res) => setTimeout(res, 0))

async function loadFonts() {
  if (!document.fonts) return
  const wanted = ['700 48px "Cabin Sketch"', '400 48px "Cabin Sketch"', '700 48px "Caveat"', '600 48px "Caveat"', '400 32px "Patrick Hand"']
  const timeout = new Promise((res) => setTimeout(res, 3500))
  await Promise.race([Promise.all(wanted.map((f) => document.fonts.load(f).catch(() => null))), timeout])
}

let prepared = null

export function prepareAssets(onProgress = () => {}) {
  if (prepared) return prepared
  prepared = (async () => {
    const jobs = []
    const add = (key, fn, opts) => jobs.push(() => store.set(key, toTexture(fn(), opts)))

    add('wall', () => wallCanvas(7), { repeat: [15, 1] })
    add('floor', () => floorCanvas(13), { repeat: [1, 12] })
    add('ceiling', () => ceilingCanvas(19), { repeat: [1, 12] })
    add('endwall:sketch', () => endWallCanvas('sketch'))
    add('endwall:color', () => endWallCanvas('color'))
    add('backwall', () => wallCanvas(31), { repeat: [1.25, 1] })
    add('banner', bannerCanvas)
    add('lamp:sketch', () => lampCanvas('sketch'))
    add('lamp:color', () => lampCanvas('color'))
    add('pool', lightPoolCanvas)
    add('plant:sketch', () => plantCanvas('sketch', 61))
    add('plant:color', () => plantCanvas('color', 61))
    add('roundwall', roundWallCanvas, { repeat: [2, 1] })
    add('roundfloor', roundFloorCanvas)
    for (let i = 0; i < 3; i++) add(`frame:${i}`, () => frameBorderCanvas(300 + i))
    for (const room of rooms) {
      add(`casing:${room.id}:sketch`, () => casingCanvas(room, 'sketch'))
      add(`casing:${room.id}:color`, () => casingCanvas(room, 'color'))
      add(`leaf:${room.id}:sketch`, () => leafCanvas(room, 'sketch'))
      add(`leaf:${room.id}:color`, () => leafCanvas(room, 'color'))
    }
    corridorArt.forEach((a, i) => {
      const seed = 1000 + i * 97
      add(`art:c${i}:sketch`, () => renderArt(a.art, seed, 'sketch'))
      add(`art:c${i}:color`, () => renderArt(a.art, seed, 'color'))
      add(`caption:c${i}`, () => captionCanvas(a.caption, seed))
    })
    projects.forEach((p, i) => {
      const seed = 2000 + i * 131
      add(`art:p${i}:sketch`, () => renderArt(p.art, seed, 'sketch'))
      add(`art:p${i}:color`, () => renderArt(p.art, seed, 'color'))
      add(`caption:p${i}`, () => captionCanvas(p.title, seed))
    })

    onProgress(0.02)
    await loadFonts()
    onProgress(0.15)
    for (let i = 0; i < jobs.length; i++) {
      jobs[i]()
      onProgress(0.15 + ((i + 1) / jobs.length) * 0.85)
      await tick()
    }
  })()
  return prepared
}

/** Data-URL thumbnail of a procedural artwork (used in HTML cards). */
export function artDataURL(theme, seed, mode = 'color') {
  return renderArt(theme, seed, mode).toDataURL('image/jpeg', 0.85)
}
