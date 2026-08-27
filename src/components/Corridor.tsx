import { useEffect, useRef, useState } from 'react'
import { profile } from '../content'

// 单点透视走廊：所有坐标由 lerp 插值得出，保证透视正确
const VIEW = { w: 1200, h: 640 }
const FAR = { left: 525, right: 675, top: 275, bottom: 385 }
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

type Side = 'left' | 'right'

function wallPointAt(side: Side, t: number, h: number) {
  const outerX = side === 'left' ? 0 : VIEW.w
  const farX = side === 'left' ? FAR.left : FAR.right
  const x = lerp(outerX, farX, t)
  const floorY = lerp(VIEW.h, FAR.bottom, t)
  const ceilY = lerp(0, FAR.top, t)
  return { x, y: lerp(floorY, ceilY, h) }
}

function wallQuad(side: Side, t1: number, t2: number, hBottom: number, hTop: number) {
  const p1 = wallPointAt(side, t1, hBottom)
  const p2 = wallPointAt(side, t2, hBottom)
  const p3 = wallPointAt(side, t2, hTop)
  const p4 = wallPointAt(side, t1, hTop)
  return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`
}

function doorPolygon(side: Side, t1: number, t2: number, hTop: number) {
  return wallQuad(side, t1, t2, 0, hTop)
}

type Door = { href: string; label: string; full: string; side: Side; t1: number; t2: number }

const DOORS: Door[] = [
  { href: '#about', label: '关于我', full: '关于我', side: 'left', t1: 0.19, t2: 0.41 },
  { href: '#projects', label: '项目', full: '项目作品', side: 'left', t1: 0.51, t2: 0.73 },
  { href: '#studio', label: '动态', full: '工作室动态', side: 'right', t1: 0.19, t2: 0.41 },
  { href: '#awards', label: '奖项', full: '奖项与证书', side: 'right', t1: 0.51, t2: 0.73 },
  { href: '#faq', label: '问答', full: '常见问题', side: 'right', t1: 0.81, t2: 0.98 },
]

function CorridorDoor({ door }: { door: Door }) {
  const { side, t1, t2 } = door
  const mid = (t1 + t2) / 2
  const center = wallPointAt(side, mid, 0.3)
  const angle = side === 'left' ? 27 : -27
  const fontSize = 30 - mid * 12
  const knob = wallPointAt(side, side === 'left' ? t1 + 0.055 : t2 - 0.055, 0.08)
  return <a href={door.href} className="corridor-door" aria-label={`走到「${door.full}」房间`}>
    <polygon points={doorPolygon(side, t1, t2, 0.62)} className="corridor-door__panel" />
    <polygon points={doorPolygon(side, t1 + 0.035, t2 - 0.035, 0.55)} className="corridor-door__inner" />
    <circle cx={knob.x} cy={knob.y} r={4.5} className="corridor-door__knob" />
    <text x={center.x} y={center.y} className="corridor-door__label" fontSize={fontSize}
      textAnchor="middle" transform={`rotate(${angle} ${center.x} ${center.y})`}>{door.label}</text>
  </a>
}

function CorridorArt() {
  const floorLine = (t: number) => {
    const a = wallPointAt('left', t, 0)
    const b = wallPointAt('right', t, 0)
    return <line key={`f${t}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="corridor-line corridor-line--floor" />
  }
  const ceilLine = (t: number) => {
    const a = wallPointAt('left', t, 1)
    const b = wallPointAt('right', t, 1)
    return <line key={`c${t}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="corridor-line corridor-line--ceil" />
  }
  return <g aria-hidden="true">
    <line x1={0} y1={VIEW.h} x2={FAR.left} y2={FAR.bottom} className="corridor-edge" />
    <line x1={VIEW.w} y1={VIEW.h} x2={FAR.right} y2={FAR.bottom} className="corridor-edge" />
    <line x1={0} y1={0} x2={FAR.left} y2={FAR.top} className="corridor-line corridor-line--ceil" />
    <line x1={VIEW.w} y1={0} x2={FAR.right} y2={FAR.top} className="corridor-line corridor-line--ceil" />
    {[0.22, 0.45, 0.68].map(floorLine)}
    {[0.22, 0.45, 0.68].map(ceilLine)}
    {/* 挂在近处墙上的装饰画框 */}
    <polygon points={wallQuad('left', 0.05, 0.13, 0.48, 0.72)} className="corridor-frame" />
    <polygon points={wallQuad('right', 0.05, 0.13, 0.48, 0.72)} className="corridor-frame" />
    {/* 走廊尽头的窗户与吊灯 */}
    <rect x={542} y={286} width={116} height={66} className="corridor-window" />
    <line x1={600} y1={286} x2={600} y2={352} className="corridor-window__bar" />
    <path d="M546 331c9-8 18-8 27 0s18 8 27 0 18-8 27 0 18 8 27 0" className="corridor-window__hills" />
    <circle cx={637} cy={302} r={7} className="corridor-window__sun" />
    <line x1={600} y1={FAR.top} x2={600} y2={FAR.top + 18} className="corridor-line" />
    <circle cx={600} cy={FAR.top + 24} r={6.5} className="corridor-lamp" />
    <path d={`M600 ${FAR.top + 35} l-4 6 M600 ${FAR.top + 35} l4 6`} className="corridor-line" />
  </g>
}

export default function Corridor() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const frame = useRef(0)
  const reduced = useRef(false)
  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return () => cancelAnimationFrame(frame.current)
  }, [])
  const onMove = (event: React.MouseEvent<HTMLElement>) => {
    if (reduced.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => setTilt({ x, y }))
  }
  return <section id="top" className="hero" onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
    <svg className="corridor" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="xMidYMid slice"
      style={{ transform: `translate3d(${(tilt.x * 12).toFixed(1)}px, ${(tilt.y * 7).toFixed(1)}px, 0)` }}>
      <CorridorArt />
      {DOORS.map((door) => <CorridorDoor key={door.href} door={door} />)}
    </svg>
    <div className="hero-overlay">
      <p className="eyebrow">手绘作品集 · Sketch Portfolio</p>
      <h1 className="hero-title">{profile.name}</h1>
      {profile.latinName && <p className="hero-latin">{profile.latinName}</p>}
      <p className="hero-role">{profile.role}</p>
      <p className="hero-tagline">{profile.tagline}</p>
      <div className="hero-cta">
        <a className="btn-sketch btn-sketch--accent" href={profile.primaryCta.href}>{profile.primaryCta.label} ↓</a>
        <a className="btn-sketch" href={profile.secondaryCta.href}>{profile.secondaryCta.label}</a>
      </div>
    </div>
    <nav className="door-chips" aria-label="走廊房间导航">
      {DOORS.map((door) => <a key={door.href} href={door.href} className="door-chip">{door.label}</a>)}
      <a href="#faq" className="door-chip">常见问题</a>
    </nav>
    <a className="hero-scroll" href="#about">向下走进走廊 <span aria-hidden="true">↓</span></a>
  </section>
}
