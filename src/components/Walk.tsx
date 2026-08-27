import { useCallback, useEffect, useRef, useState } from 'react'
import { profile } from '../content'
import type { RoomId } from './sections'

// ============================================================
//  一镜到底行走走廊 —— 滚动=步伐、无限分段循环、中途选择
//  全部坐标由「相机相对深度 → 透视 t」实时插值得出，不引 WebGL。
// ============================================================

export const OPEN_MS = 620
// 测试/自动化用：URL 带 ?instant 时滑行与开门动画瞬时完成（惰性读取，方便运行时切换）
export const instantMode = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('instant')

const VIEW = { w: 1200, h: 640 }
const FAR = { left: 525, right: 675, top: 275, bottom: 385 }
const F = 7          // 透视焦距（单位：步）
const D_MIN = 1.4    // 相机近处裁剪面
const AHEAD = 78     // 前方渲染窗口
const SEG = 48       // 走廊一个循环周期的长度
const APPROACH = 4.4 // 走到门前停下时，门留在相机前方多远
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const persp = (d: number) => d / (d + F)

type Side = 'left' | 'right'

function wallPt(side: Side, d: number, h: number) {
  const t = persp(Math.max(d, 0.02))
  const x = side === 'left' ? lerp(0, FAR.left, t) : lerp(VIEW.w, FAR.right, t)
  const floorY = lerp(VIEW.h, FAR.bottom, t)
  const ceilY = lerp(0, FAR.top, t)
  return { x, y: lerp(floorY, ceilY, h) }
}

function quad(side: Side, d1: number, d2: number, hB: number, hT: number) {
  const p1 = wallPt(side, d1, hB)
  const p2 = wallPt(side, d2, hB)
  const p3 = wallPt(side, d2, hT)
  const p4 = wallPt(side, d1, hT)
  return `${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)} ${p4.x.toFixed(1)},${p4.y.toFixed(1)}`
}

type DoorDef = {
  id: RoomId; label: string; full: string; side: Side; at: number
  halfW: number; hTop: number; tone: string; terminal?: boolean
}

export const DOORS: DoorDef[] = [
  { id: 'about',    label: '关于我', full: '关于我房间',     side: 'left',  at: 8.5, halfW: 2.3, hTop: 0.60, tone: '#d96f32' },
  { id: 'studio',   label: '工作室动态', full: '工作室动态房间', side: 'right', at: 16.5, halfW: 2.3, hTop: 0.60, tone: '#3f8f68' },
  { id: 'projects', label: '项目作品', full: '项目作品房间',   side: 'left',  at: 25,  halfW: 2.3, hTop: 0.60, tone: '#b58a2c' },
  { id: 'awards',   label: '奖项与证书', full: '奖项与证书房间', side: 'right', at: 33,  halfW: 2.3, hTop: 0.60, tone: '#7a5fb0' },
  { id: 'contact',  label: '联系 · 终点站', full: '海边终点的联系房间', side: 'left', at: 40.5, halfW: 2.9, hTop: 0.70, tone: '#2f5f9e', terminal: true },
]

const doorById = (id: RoomId) => DOORS.find((door) => door.id === id)!
const wrapDelta = (delta: number) => {
  const m = delta % SEG
  if (m > SEG / 2) return m - SEG
  if (m < -SEG / 2) return m + SEG
  return m
}
// 某个周期内位置 u 的所有实例，落在相机视窗 [cam-D_MIN, cam+AHEAD] 内
function instancesOf(cam: number, u: number): number[] {
  const out: number[] = []
  let k = Math.floor((cam + AHEAD - u) / SEG) + 1
  for (;;) {
    const w = u + k * SEG
    if (w < cam - D_MIN) break
    if (k < -60) break
    if (w <= cam + AHEAD) out.push(w)
    k--
  }
  return out.reverse()
}

export type WalkHandle = {
  enterRoom: (id: RoomId) => void
  resetToStart: () => void
}

type Phase = 'free' | 'glide' | 'opening' | 'in-room'

export default function Walk({ paused, onEnter, onReady }: {
  paused: boolean
  onEnter: (id: RoomId) => void
  onReady?: (api: WalkHandle) => void
}) {
  const [, setTick] = useState(0)
  const [openDoorId, setOpenDoorId] = useState<RoomId | null>(null)
  const [hoverId, setHoverId] = useState<RoomId | null>(null)

  const cam = useRef(26)         // 起始位置：正好看到前几扇门
  const target = useRef(26)
  const vel = useRef(0)          // 触摸惯性
  const phase = useRef<Phase>('free')
  const glideRef = useRef<{ door: DoorDef | null; startAt: number; from: number; dur: number }>({ door: null, startAt: 0, from: 0, dur: 0 })
  const touch = useRef<{ lastY: number } | null>(null)
  const rafRef = useRef(0)
  const lastNow = useRef(0)
  const openTimer = useRef<number | undefined>(undefined)
  const stageRef = useRef<HTMLDivElement>(null)

  // ---------- 主循环：推进相机，触发重绘（统一 16ms 步进，环境无关） ----------
  const advance = useCallback((now: number) => {
    rafRef.current = 0
    const dt = Math.min(64, now - (lastNow.current || now)) / 1000
    lastNow.current = now

    if (phase.current === 'glide') {
      const g = glideRef.current
      const inst = instantMode()
      const p = inst ? 1 : clamp01((now - g.startAt) / Math.max(g.dur, 1))
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      cam.current = lerp(g.from, target.current, e)
      if (p >= 1 && g.door) {
        phase.current = 'opening'
        setOpenDoorId(g.door.id)
        window.clearTimeout(openTimer.current)
        const door = g.door
        openTimer.current = window.setTimeout(() => {
          phase.current = 'in-room'
          glideRef.current.door = null
          setOpenDoorId(null)
          onEnter(door.id)
        }, inst ? 0 : OPEN_MS)
      }
    } else if (phase.current === 'free') {
      const diff = target.current - cam.current
      if (Math.abs(diff) > 0.0004) cam.current += diff * Math.min(1, dt * 9)
      if (Math.abs(vel.current) > 0.004) {
        cam.current += vel.current * dt
        vel.current *= Math.pow(0.0018, dt)
        target.current = cam.current
      } else {
        vel.current = 0
      }
    }

    setTick((n) => n + 1)
    if (phase.current !== 'in-room') schedule()
  }, [onEnter])

  const schedule = useCallback(() => {
    if (!rafRef.current) {
      rafRef.current = window.setTimeout(() => advance(performance.now()), 16)
    }
  }, [advance])

  useEffect(() => {
    let api: WalkHandle
    api = {
      enterRoom: (id) => { if (phase.current === 'free') beginGlide(doorById(id)) },
      resetToStart: () => {
        cam.current = ((cam.current % SEG) + SEG) % SEG
        vel.current = 0
        target.current = 0
        if (phase.current === 'free') schedule()
      },
    }
    onReady?.(api)
    schedule()
    return () => { window.clearTimeout(rafRef.current); rafRef.current = 0; window.clearTimeout(openTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!paused && phase.current === 'in-room') { phase.current = 'free'; schedule() }
    if (paused && phase.current === 'free') vel.current = 0
  }, [paused, schedule])

  // ---------- 中途选择：点击门 → 自动走到门前 → 开门 ----------
  const beginGlide = useCallback((door: DoorDef) => {
    window.clearTimeout(rafRef.current); rafRef.current = 0
    vel.current = 0
    const dest = cam.current + wrapDelta(door.at - APPROACH - cam.current)
    const dur = instantMode() ? 1 : Math.min(980, 260 + Math.abs(dest - cam.current) * 46)
    target.current = dest
    glideRef.current = { door, startAt: performance.now(), from: cam.current, dur }
    phase.current = 'glide'
    schedule()
  }, [schedule])

  // ---------- 输入：滚轮 / 触摸滑动 / 键盘 都是“步伐” ----------
  useEffect(() => {
    if (paused) return
    const stage = stageRef.current
    if (!stage) return

    const step = (units: number) => {
      if (phase.current !== 'free') return
      vel.current = 0
      target.current += units
      schedule()
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const dy = Math.max(-240, Math.min(240, e.deltaY))
      step(dy / 95)
    }
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) { touch.current = { lastY: e.touches[0].clientY }; vel.current = 0 }
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const cur = e.touches[0]
      const unitPerPx = window.innerHeight / 24
      if (touch.current) step(-(cur.clientY - touch.current.lastY) / unitPerPx)
      touch.current = { lastY: cur.clientY }
    }
    const onTouchEnd = () => { touch.current = null }
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      if (el && /^(input|textarea|select)$/i.test(el.tagName)) return
      switch (e.key) {
        case 'ArrowDown': case 'PageDown': case 's': e.preventDefault(); step(SEG / 10); break
        case 'ArrowUp': case 'PageUp': case 'w': e.preventDefault(); step(-SEG / 10); break
        case ' ': e.preventDefault(); step(e.shiftKey ? -SEG / 4 : SEG / 4); break
        default: return
      }
    }

    stage.addEventListener('wheel', onWheel, { passive: false })
    stage.addEventListener('touchstart', onTouchStart, { passive: true })
    stage.addEventListener('touchmove', onTouchMove, { passive: false })
    stage.addEventListener('touchend', onTouchEnd)
    window.addEventListener('keydown', onKey)
    return () => {
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('touchstart', onTouchStart)
      stage.removeEventListener('touchmove', onTouchMove)
      stage.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
    }
  }, [paused, schedule])

  // ---------- 渲染场景（由 cam 推导，保持纯函数） ----------
  const near = D_MIN
  const glanceDoor = (() => {
    let best: DoorDef | null = null
    let dist = Infinity
    for (const door of DOORS) {
      for (const w of instancesOf(cam.current, door.at)) {
        const d = w - cam.current
        if (d > 0.6 && d < 22 && d < dist) { dist = d; best = door }
      }
    }
    return best
  })()
  const gf = glanceDoor ? Math.pow(clamp01(1 - (() => {
    let dd = Infinity
    for (const w of instancesOf(cam.current, glanceDoor.at)) {
      const d = w - cam.current
      if (d > 0.6 && d < 22) dd = Math.min(dd, d)
    }
    return dd
  })() / 22), 1.6) : 0
  const gx = glanceDoor ? (glanceDoor.side === 'left' ? 34 : -34) * gf : 0
  const gy = -5 * gf
  const bob = phase.current === 'free'
    ? Math.sin(cam.current * 2.4) * 2.2 * clamp01(Math.abs(target.current - cam.current) * 2)
    : 0

  const seams: number[] = []
  for (const w of instancesOf(cam.current, 0)) {
    for (let s = 0; s < SEG; s += 4) { const q = w + s; if (q > cam.current && q < cam.current + AHEAD) seams.push(q - cam.current) }
  }
  const beams: number[] = []
  for (const w of instancesOf(cam.current, 4)) {
    for (let s = 0; s < SEG; s += 8) { const q = w + s; if (q > cam.current && q < cam.current + AHEAD) beams.push(q - cam.current) }
  }

  const started = phase.current !== 'free' || Math.abs(cam.current - 26) > 0.4

  return (
    <div ref={stageRef} role="region" aria-label="手绘走廊——滚动向前走，点门进入房间" className="walk-stage">
      <svg className="corridor-svg" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g transform={`translate(${gx.toFixed(2)} ${(gy + bob).toFixed(2)})`}>
          {/* 左右墙 */}
          <polygon points={quad('left', near, AHEAD, 0, 1)} className="walk-wall" />
          <polygon points={quad('right', near, AHEAD, 0, 1)} className="walk-wall walk-wall--r" />
          <line {...seg(wallPt('left', near, 0), wallPt('left', AHEAD, 0))} className="corridor-edge" />
          <line {...seg(wallPt('right', near, 0), wallPt('right', AHEAD, 0))} className="corridor-edge" />

          {/* 地面接缝与天花横梁 */}
          {seams.map((d) => (
            <line key={`fs${d.toFixed(1)}`} {...seg(wallPt('left', d, 0), wallPt('right', d, 0))} className="corridor-line corridor-line--floor" />
          ))}
          {beams.map((d) => (
            <line key={`cb${d.toFixed(1)}`} {...seg(wallPt('left', d, 1), wallPt('right', d, 1))} className="corridor-line corridor-line--ceil" />
          ))}

          {/* 天窗光斑 */}
          {[5, 29].flatMap((base) => instancesOf(cam.current, base).map((w) => {
            const d = w - cam.current
            if (d < near || d > AHEAD) return null
            const yFar = 128 + d * 1.15
            return <polygon key={`sky${w}`} className="walk-skylight"
              points={`${508 - d},${246} ${692 + d},${246} ${652},${yFar} ${548},${yFar}`}
              opacity={(0.45 * clamp01(1 - d / AHEAD)).toFixed(2)} />
          }))}

          {/* 门前指路牌 */}
          {instancesOf(cam.current, 36.8).map((w) => <SignPost key={`sp${w}`} d={w - cam.current} />)}

          {/* 挂在门旁的装饰画框：纸底 + 手绘排线 */}
          {DOORS.filter((dr) => !dr.terminal).flatMap((dr) =>
            [-5.6, 5.6].flatMap((off) => instancesOf(cam.current, dr.at + off).map((w) => {
              const d = w - cam.current
              if (d < near + 0.4 || d > AHEAD - 2) return null
              return <g key={`fr${w}`} opacity={distFade(d).toFixed(2)}>
                <polygon points={quad(dr.side, d, d + 1.05, 0.42, 0.72)} className="walk-frame" />
                {hatch(dr.side, d + 0.18, d + 0.88, 0.48, 0.66)}
              </g>
            }))
          )}

          {/* 吊灯 */}
          {[12.5, 30.5].flatMap((base) => instancesOf(cam.current, base).map((w) => {
            const d = w - cam.current
            if (d < near + 1 || d > AHEAD) return null
            const top = wallPt('left', d, 1)
            const k = sizeK(d)
            return <g key={`lp${w}`} className="corridor-lamp-swing" opacity={distFade(d).toFixed(2)}>
              <line x1={top.x} y1={top.y} x2={top.x} y2={top.y + 16 * k} className="corridor-line" />
              <circle cx={top.x} cy={top.y + 21 * k} r={Math.max(1.1, 6 * k)} className="corridor-lamp" />
              <path d={`M${top.x} ${top.y + 30 * k} l${-3.4 * k} ${5 * k} M${top.x} ${top.y + 30 * k} l${3.4 * k} ${5 * k}`} className="corridor-line" />
            </g>
          }))}

          {/* 门（含上色与开门动画） */}
          {DOORS.flatMap((door) => instancesOf(cam.current, door.at).map((w) => {
            const dFront = w - cam.current - door.halfW
            const dBack = w - cam.current + door.halfW
            if (dBack < near + 0.05 || dFront > AHEAD) return null
            const dC = Math.max(w - cam.current, 0.8)
            const p = clamp01(1 - (dC - 7) / 15)
            const paint = hoverId === door.id ? Math.max(p, 0.92) : p
            const active = paint > 0.32
            return <WalkDoor key={`d${door.id}@${w}`} door={door}
              dFront={Math.max(dFront, near)} dBack={dBack}
              paint={paint} active={active} fade={distFade(dC)}
              opening={openDoorId === door.id && phase.current === 'opening'}
              onHover={setHoverId} onClick={() => beginGlide(door)} uid={`d${door.id}${w}`} />
          }))}
        </g>
      </svg>

      {/* 开场名牌：一起步就淡出，像原站的落地招牌 */}
      <div className={`walk-intro${started ? ' is-gone' : ''}`} aria-hidden={started}>
        <p className="eyebrow">手绘作品集 · Sketch Portfolio</p>
        <h1 className="hero-title">{profile.name}</h1>
        {profile.latinName && <p className="hero-latin">{profile.latinName}</p>}
        <p className="hero-role">{profile.role}</p>
        <p className="hero-tagline">{profile.tagline}</p>
      </div>

      <p className="walk-hint">滚轮 / 上下键 / 滑动 = 往走廊深处走 · 走到发亮的门前提笔点它</p>
      <nav className="walk-dock" aria-label="走廊行动与直达房间">
        {DOORS.map((door) => (
          <button key={door.id} type="button" className="door-chip" data-room={door.id}
            onClick={() => { if (phase.current === 'free') beginGlide(door) }}>
            {door.label}
          </button>
        ))}
        <button type="button" className="door-chip" onClick={() => {
          vel.current = 0
          target.current = cam.current
          phase.current = 'free'
          schedule()
        }}>⏹ 停</button>
      </nav>
    </div>
  )
}

function seg(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1) }
}

// 远景淡出：接近渲染窗口尽头时化入素描线，避免堆在灭点
const distFade = (d: number) => clamp01((AHEAD - d) / 22)

// 近大远小的尺寸系数：与投影斜率成正比，远处趋近于 0
const sizeK = (d: number) => persp(D_MIN) / persp(Math.max(d, D_MIN))

// 画框里的手绘排线（纯几何，不依赖字体）
function hatch(side: Side, d1: number, d2: number, hB: number, hT: number) {
  const w = Math.max(0.7, 1.5 * sizeK((d1 + d2) / 2))
  return <g className="walk-hatch">
    <line {...seg(wallPt(side, d1 + 0.08, hT - 0.04), wallPt(side, d2 - 0.08, hB + 0.06))} strokeWidth={w} />
    <line {...seg(wallPt(side, d1 + 0.08, (hB + hT) / 2), wallPt(side, d2 - 0.08, hB))} strokeWidth={w} />
  </g>
}

// ---------- 单扇门：素描底 + 靠近时颜料上色（paint-reveal）+ 开门动画 ----------
function WalkDoor({ door, dFront, dBack, paint, active, opening, fade, onHover, onClick, uid }: {
  door: DoorDef; dFront: number; dBack: number; paint: number; active: boolean
  opening: boolean; fade: number; onHover: (id: RoomId | null) => void; onClick: () => void; uid: string
}) {
  const clipId = `clip-${uid}`
  const side = door.side
  const pts = quad(side, dFront, dBack, 0, door.hTop)
  const inner = quad(side, dFront + 0.16, dBack - 0.16, 0.02, door.hTop - 0.06)
  const midD = (dFront + dBack) / 2
  const knobD = side === 'left' ? dFront + 0.35 : dBack - 0.35
  const knob = wallPt(side, knobD, 0.10)
  const center = wallPt(side, midD, door.hTop * 0.52)
  const angle = side === 'left' ? 25 : -25
  const fontSize = Math.max(9, 34 - midD * 0.62)
  const p = Math.round(paint * 100) / 100

  const nums = pts.match(/-?[\d.]+/g)!.map(Number)
  const xs = nums.filter((_, i) => i % 2 === 0)
  const ys = nums.filter((_, i) => i % 2 === 1)
  const minx = Math.min(...xs), maxx = Math.max(...xs)
  const miny = Math.min(...ys), maxy = Math.max(...ys)
  const w = maxx - minx, hgt = maxy - miny
  const fullReveal = p >= 0.995

  return (
    <g className={`wdoor${active ? ' is-active' : ''}${opening ? ' is-opening' : ''}${side === 'left' ? ' hinge-left' : ' hinge-right'}`}
      data-door={door.id}
      opacity={fade.toFixed(2)}
      style={{ cursor: active ? 'pointer' : 'default' }}
      onClick={() => { if (active && !opening) onClick() }}
      onMouseEnter={() => { if (active) onHover(door.id) }}
      onMouseLeave={() => onHover(null)}>
      {!fullReveal && <clipPath id={clipId}>
        <rect x={minx} y={maxy - hgt * (0.3 + p * 0.75)} width={Math.max(0.001, w * (0.15 + p * 0.9))}
          height={hgt * (0.3 + p * 0.75)} transform={`rotate(${-14} ${minx.toFixed(1)} ${maxy.toFixed(1)})`} />
      </clipPath>}
      {/* 开门时露出的门内暗缝 */}
      <polygon points={pts} className="wdoor__gap" />
      <polygon points={pts} className="wdoor__panel" />
      {p > 0.02 && (!fullReveal
        ? <g clipPath={`url(#${clipId})`} opacity={p}><polygon points={pts} fill={door.tone} className="wdoor__paint" /></g>
        : <polygon points={pts} fill={door.tone} className="wdoor__paint" />)}
      <polygon points={inner} className="wdoor__inner" style={p > 0.55 ? { stroke: door.tone } : undefined} />
      <circle cx={knob.x.toFixed(1)} cy={knob.y.toFixed(1)} r={Math.max(1.6, 4.6 * sizeK(midD))} className="wdoor__knob" />
      <text x={center.x.toFixed(1)} y={center.y.toFixed(1)} textAnchor="middle" fontSize={fontSize}
        transform={`rotate(${angle} ${center.x.toFixed(1)} ${center.y.toFixed(1)})`} className="wdoor__label">{door.label}</text>
      {door.terminal && active && !opening && (
        <text x={center.x.toFixed(1)} y={(center.y + fontSize * 1.5).toFixed(1)} textAnchor="middle" fontSize={fontSize * 0.5}
          transform={`rotate(${angle} ${center.x.toFixed(1)} ${center.y.toFixed(1)})`} className="wdoor__sub">走到底就是海 · 进来歇脚</text>
      )}
    </g>
  )
}

function SignPost({ d }: { d: number }) {
  if (d < 1.2 || d > AHEAD) return null
  const base = wallPt('right', d, 0)
  const top = wallPt('right', d, 0.42)
  const k = Math.max(0.18, sizeK(d))
  return <g className="walk-signpost" opacity={distFade(d).toFixed(2)}>
    <line x1={base.x.toFixed(1)} y1={base.y.toFixed(1)} x2={top.x.toFixed(1)} y2={top.y.toFixed(1)} stroke="#2f2c26" strokeWidth={Math.max(0.8, 2 * k)} opacity={0.85} />
    <rect x={(base.x + top.x) / 2 + 4 * k} y={lerp(base.y, top.y, 0.55)} width={56 * k} height={17 * k} rx={2.5}
      fill="#f5efdf" stroke="#2f2c26" strokeWidth={Math.max(0.5, 1.4 * k)} />
    <text x={(base.x + top.x) / 2 + 32 * k} y={lerp(base.y, top.y, 0.55) + 12.5 * k} textAnchor="middle" fontSize={Math.max(3.5, 11 * k)}
      fontFamily="var(--font-hand)">海边 ↓</text>
  </g>
}
