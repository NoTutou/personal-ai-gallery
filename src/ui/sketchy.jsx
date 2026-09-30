// Hand-drawn SVG primitives for the HTML UI.
import { useMemo } from 'react'
import { rng } from '../lib/sketch'

/** Wobbly rectangle path in a 0..100 box (stretched with preserveAspectRatio=none). */
export function roughRect(seed, inset = 1.5, jitter = 0.9) {
  const r = rng(seed)
  const j = () => (r() - 0.5) * jitter
  const a = inset, b = 100 - inset
  const pts = [
    [a + j(), a + j()],
    [50 + j() * 4, a + j()],
    [b + j(), a + j()],
    [b + j(), 50 + j() * 4],
    [b + j(), b + j()],
    [50 + j() * 4, b + j()],
    [a + j(), b + j()],
    [a + j(), 50 + j() * 4],
  ]
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i <= pts.length; i++) {
    const p = pts[i % pts.length]
    d += ` L${p[0]},${p[1]}`
  }
  // overshoot a little past the start like a real pen
  d += ` L${pts[1][0] * 0.3 + pts[0][0] * 0.7 + j()},${pts[0][1] + j()}`
  return d
}

export function SketchBox({ seed = 1, className = '', strokeWidth = 2, double = true, fill }) {
  const d1 = useMemo(() => roughRect(seed), [seed])
  const d2 = useMemo(() => roughRect(seed + 99, 2.2, 1.4), [seed])
  return (
    <svg className={`sketch-box ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {fill && <path d={d1} fill={fill} stroke="none" />}
      <path d={d1} fill="none" stroke="currentColor" strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      {double && (
        <path d={d2} fill="none" stroke="currentColor" strokeWidth={strokeWidth * 0.55} opacity="0.45" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      )}
    </svg>
  )
}

/** A scribbled underline that draws itself (CSS animates stroke-dashoffset). */
export function Scribble({ seed = 3, className = '' }) {
  const d = useMemo(() => {
    const r = rng(seed)
    let s = `M2,${10 + r() * 4}`
    for (let x = 12; x <= 198; x += 14) s += ` Q${x - 7},${4 + r() * 14} ${x},${8 + r() * 6}`
    s += ` M20,${16 + r() * 3} Q100,${10 + r() * 6} 185,${15 + r() * 3}`
    return s
  }, [seed])
  return (
    <svg className={`scribble ${className}`} viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} pathLength="1" />
    </svg>
  )
}

/** Torn-paper polygon for clip-path along one or both vertical edges. */
export function tornClip({ left = false, right = false, top = false, bottom = false, seed = 7, depth = 1.6, steps = 40 }) {
  const r = rng(seed)
  const pts = []
  const jag = () => r() * depth
  // top edge (left -> right)
  if (top) for (let i = 0; i <= steps; i++) pts.push([(i / steps) * 100, jag()])
  else pts.push([0, 0], [100, 0])
  // right edge (top -> bottom)
  if (right) for (let i = 1; i < steps; i++) pts.push([100 - jag(), (i / steps) * 100])
  // bottom edge (right -> left)
  if (bottom) for (let i = steps; i >= 0; i--) pts.push([(i / steps) * 100, 100 - jag()])
  else pts.push([100, 100], [0, 100])
  // left edge (bottom -> top)
  if (left) for (let i = steps - 1; i > 0; i--) pts.push([jag(), (i / steps) * 100])
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(',')})`
}

// ---- icons (hand-drawn paths) ----------------------------------------------
const icon = (children) =>
  function Icon({ size = 26, className = '' }) {
    return (
      <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    )
  }

export const IconMap = icon(
  <>
    <path d="M4 8.5 L11.5 5.2 L20.3 8.8 L28 5.6 L27.6 24.2 L20.1 27.3 L11.6 23.8 L4.3 27 Z" />
    <path d="M11.5 5.4 L11.7 23.6 M20.2 9 L20.1 27" />
    <path d="M14 14 l2.5 2.5 M16.5 14 l-2.5 2.5" strokeWidth="1.8" />
  </>,
)
export const IconSound = icon(
  <>
    <path d="M5 12.3 L10 12 L16.8 6 L17 26.2 L10.2 20.3 L5.2 20.1 Z" />
    <path d="M21 11.5 Q24 16 21.2 20.6 M24.5 8.4 Q29.6 16.2 24.6 23.8" />
  </>,
)
export const IconMute = icon(
  <>
    <path d="M5 12.3 L10 12 L16.8 6 L17 26.2 L10.2 20.3 L5.2 20.1 Z" />
    <path d="M21.5 12.5 L28 19.4 M28.2 12.3 L21.3 19.6" />
  </>,
)
export const IconTrophy = icon(
  <>
    <path d="M9.6 5.2 L22.6 5 Q23 15.8 16.2 18.6 Q9.2 16 9.6 5.2 Z" />
    <path d="M9.8 8 Q4.6 8 5.8 12 Q7 15 11 14.6 M22.4 8 Q27.6 8.2 26.3 12.2 Q25 15 21.2 14.5" />
    <path d="M16.1 18.8 L16.2 23.5 M11 27 L21.4 26.8 L20.2 23.4 L12.2 23.6 Z" />
  </>,
)
export const IconClose = icon(<path d="M7.5 7.2 L24.8 24.6 M24.3 7 L7.2 24.9" />)
export const IconArrowLeft = icon(<path d="M26 16.4 L6.5 15.8 M13.4 8.6 L6.2 15.9 L13.8 23.2" />)
export const IconArrowRight = icon(<path d="M6 16.2 L25.6 15.9 M18.6 8.6 L25.8 16 L18.2 23.3" />)
export const IconExternal = icon(
  <>
    <path d="M14 6.4 L6.2 6.6 L6.4 25.8 L25.6 25.6 L25.4 18" />
    <path d="M17.6 5.8 L26.2 5.9 L26 14.4 M26 6 L14.8 17.3" />
  </>,
)
export const IconPin = icon(
  <>
    <path d="M16 29 Q7 18.6 7.4 12.4 Q8.2 4 16.2 3.8 Q24.4 4.2 24.8 12.6 Q24.6 18.8 16 29 Z" />
    <circle cx="16.1" cy="12.4" r="3.4" />
  </>,
)
export const IconCheck = icon(<path d="M6 16.8 L13 23.6 L26.6 7.4" />)
