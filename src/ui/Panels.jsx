import { useEffect, useMemo, useRef } from 'react'
import { useStore, view, ACHIEVEMENTS } from '../store'
import { rooms, CORRIDOR } from '../data/content'
import { travelTo, walkTo } from '../director'
import { rng } from '../lib/sketch'
import { SketchBox, IconClose, IconCheck, IconPin } from './sketchy'

function PanelShell({ id, title, children, className = '' }) {
  const panel = useStore((s) => s.panel)
  const setPanel = useStore((s) => s.setPanel)
  const open = panel === id
  return (
    <section className={`paper-panel ${className} ${open ? 'open' : ''}`} aria-hidden={!open} aria-label={title}>
      <SketchBox seed={id.length * 13} className="popup-border" />
      <header className="paper-panel__header">
        <h2>{title}</h2>
        <button className="close-btn" onClick={() => setPanel(id)} aria-label={`Close ${title}`} tabIndex={open ? 0 : -1}>
          <IconClose size={22} />
        </button>
      </header>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------
const MAP_W = 600
const zToX = (z) => 40 + ((CORRIDOR.backZ - z) / (CORRIDOR.backZ - CORRIDOR.endWallZ)) * (MAP_W - 80)

function roughPath(pts, seed, close = true) {
  const r = rng(seed)
  const j = () => (r() - 0.5) * 2.4
  let d = `M${pts[0][0] + j()},${pts[0][1] + j()}`
  const all = close ? [...pts.slice(1), pts[0]] : pts.slice(1)
  for (const [x, y] of all) d += ` L${x + j()},${y + j()}`
  return d
}

function MapPanel() {
  const visited = useStore((s) => s.visited)
  const room = useStore((s) => s.room)
  const panel = useStore((s) => s.panel)
  const pin = useRef()

  const shapes = useMemo(() => {
    const top = 120, bottom = 180
    const corridor = roughPath([[40, top], [MAP_W - 40, top], [MAP_W - 40, bottom], [40, bottom]], 5)
    const boxes = rooms.map((r, i) => {
      const cx = zToX(r.z)
      const w = 110, h = 80
      const y = r.side === -1 ? top - h : bottom
      return { ...r, cx, y, w, h, d: roughPath([[cx - w / 2, y], [cx + w / 2, y], [cx + w / 2, y + h], [cx - w / 2, y + h]], 20 + i) }
    })
    return { corridor, boxes, top, bottom }
  }, [])

  useEffect(() => {
    if (panel !== 'map') return
    let raf
    const loop = () => {
      if (pin.current) {
        const s = useStore.getState()
        let x = zToX(view.z)
        let y = (shapes.top + shapes.bottom) / 2
        if (s.room) {
          const b = shapes.boxes.find((b) => b.id === s.room)
          x = b.cx
          y = b.y + b.h / 2
        }
        pin.current.setAttribute('transform', `translate(${x - 14}, ${y - 34})`)
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [panel, shapes])

  return (
    <PanelShell id="map" title="Map" className="map-panel">
      <div className="map-container">
        <svg className="map-image" viewBox={`0 0 ${MAP_W} 300`} role="img" aria-label="Hand-drawn map of the corridor">
          <defs>
            <filter id="watercolor" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="3" />
              <feDisplacementMap in="SourceGraphic" scale="9" />
            </filter>
          </defs>
          <g className="painted-map-layer" filter="url(#watercolor)">
            {shapes.boxes.map((b) => (
              <rect key={b.id} x={b.cx - b.w / 2 + 4} y={b.y + 4} width={b.w - 8} height={b.h - 8} fill={b.color} className={visited[b.id] ? 'painted' : ''} />
            ))}
            <rect x="44" y={shapes.top + 4} width={MAP_W - 88} height={shapes.bottom - shapes.top - 8} fill="#e8dcc4" className="painted" />
          </g>
          <path d={shapes.corridor} className="map-stroke" />
          {/* floor boards hint */}
          {Array.from({ length: 14 }).map((_, i) => (
            <path key={i} d={`M${60 + i * 36},${shapes.top + 12} l8,${shapes.bottom - shapes.top - 24}`} className="map-hatch" />
          ))}
          {shapes.boxes.map((b) => (
            <g
              key={b.id}
              className={`map-room ${room === b.id ? 'current' : ''}`}
              onClick={() => {
                useStore.getState().setPanel('map')
                travelTo(b.id)
              }}
              role="button"
              tabIndex={0}
              aria-label={`Go to ${b.label}`}
              onKeyDown={(e) => e.key === 'Enter' && travelTo(b.id)}
            >
              <rect x={b.cx - b.w / 2} y={b.y} width={b.w} height={b.h} fill="transparent" className="map-hover-zone" />
              <path d={b.d} className="map-stroke" />
              {/* door gap */}
              <path d={`M${b.cx - 16},${b.side === -1 ? shapes.top : shapes.bottom} L${b.cx + 16},${b.side === -1 ? shapes.top : shapes.bottom}`} className="map-door" />
              <text x={b.cx} y={b.y + b.h / 2 + 7} className="map-room-label">
                {b.label}
              </text>
            </g>
          ))}
          <text x={MAP_W - 44} y={shapes.bottom + 26} className="map-note" textAnchor="end">
            the end →
          </text>
          <text x={44} y={shapes.bottom + 26} className="map-note">
            ← start
          </text>
          <g ref={pin} className="pin-marker">
            <g transform="scale(0.9)">
              <IconPin size={32} />
            </g>
          </g>
        </svg>
      </div>
      <p className="paper-panel__foot">click a room to walk there · you are the pin</p>
      <div className="map-quick">
        <button className="sketch-btn sketch-btn--small" onClick={() => walkTo(CORRIDOR.startZ)}>
          <SketchBox seed={41} />
          <span>to the start</span>
        </button>
        <button className="sketch-btn sketch-btn--small" onClick={() => walkTo(CORRIDOR.endZ)}>
          <SketchBox seed={42} />
          <span>to the end</span>
        </button>
      </div>
    </PanelShell>
  )
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------
function PaperSlider({ label, value, onChange }) {
  return (
    <label className="slider-group">
      <span className="slider-label">
        {label} <b>{Math.round(value * 100)}</b>
      </span>
      <span className="paper-slider" style={{ '--v': value }}>
        <svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
          <path d="M3 10 Q50 7 100 10.5 T197 9.5" className="track" />
          <path d="M3 10 Q50 7 100 10.5 T197 9.5" className="fill" pathLength="1" style={{ strokeDashoffset: 1 - value }} />
        </svg>
        <input type="range" min="0" max="1" step="0.01" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
      </span>
    </label>
  )
}

function AudioPanel() {
  const volumes = useStore((s) => s.volumes)
  const soundOn = useStore((s) => s.soundOn)
  const setVolume = useStore((s) => s.setVolume)
  const setSound = useStore((s) => s.setSound)
  return (
    <PanelShell id="audio" title="Audio Settings" className="audio-panel">
      <button className={`checkbox ${soundOn ? 'checked' : ''}`} onClick={() => setSound(!soundOn)} aria-pressed={soundOn}>
        <span className="checkmark">
          <SketchBox seed={51} double={false} />
          {soundOn && <IconCheck size={22} />}
        </span>
        Sound {soundOn ? 'on' : 'off'}
      </button>
      <div className={`audio-sliders-container ${soundOn ? '' : 'disabled'}`}>
        <PaperSlider label="Master" value={volumes.master} onChange={(v) => setVolume('master', v)} />
        <PaperSlider label="Music" value={volumes.music} onChange={(v) => setVolume('music', v)} />
        <PaperSlider label="Effects" value={volumes.sfx} onChange={(v) => setVolume('sfx', v)} />
      </div>
      <p className="paper-panel__foot">all sounds are synthesised live in your browser</p>
    </PanelShell>
  )
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
function AchievementsPanel() {
  const unlocked = useStore((s) => s.unlocked)
  const count = Object.keys(unlocked).length
  return (
    <PanelShell id="achievements" title="Achievements" className="achievements-panel">
      <div className="achievements-header">
        <span>
          {count} / {ACHIEVEMENTS.length} unlocked
        </span>
        <span className="achievements-progress">
          <span style={{ width: `${(count / ACHIEVEMENTS.length) * 100}%` }} />
        </span>
      </div>
      <ul className="achievements-list">
        {ACHIEVEMENTS.map((a, i) => {
          const done = !!unlocked[a.id]
          return (
            <li key={a.id} className={`achievement-item ${done ? '' : 'locked'}`}>
              <span className="checkmark">
                <SketchBox seed={60 + i} double={false} />
                {done && <IconCheck size={20} />}
              </span>
              <span className="achievement-icon" aria-hidden="true">
                {a.icon}
              </span>
              <span className="achievement-text">
                <b>{a.title}</b>
                <small>{a.text}</small>
              </span>
            </li>
          )
        })}
      </ul>
      <div className="achievements-footer">
        <button className="text-btn" onClick={() => useStore.getState().resetProgress()}>
          reset progress
        </button>
      </div>
    </PanelShell>
  )
}

export function AchievementToasts() {
  const toasts = useStore((s) => s.toasts)
  return (
    <div className="achievement-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.key} className="achievement-popup">
          <SketchBox seed={t.key * 3} className="popup-border" />
          <span className="achievement-icon" aria-hidden="true">
            {t.icon}
          </span>
          <div className="popup-content">
            <span className="achievement-label">ACHIEVEMENT UNLOCKED</span>
            <b className="achievement-title">{t.title}</b>
            <small>{t.text}</small>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Panels() {
  const panel = useStore((s) => s.panel)
  return (
    <>
      <div className={`panel-backdrop ${panel ? 'open' : ''}`} onClick={() => useStore.getState().set({ panel: null })} />
      <MapPanel />
      <AudioPanel />
      <AchievementsPanel />
    </>
  )
}
