import { useEffect, useRef } from 'react'
import { useStore, view, progressOf } from '../store'
import { site, rooms, CORRIDOR } from '../data/content'
import { exitRoom, walkTo } from '../director'
import { SketchBox, IconMap, IconSound, IconMute, IconTrophy, tornClip } from './sketchy'
import { sound } from '../lib/audio'

const isTouch = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches

function Logo() {
  const onClick = () => {
    const s = useStore.getState()
    sound.click()
    if (s.phase === 'room') exitRoom()
    else if (s.phase === 'corridor') walkTo(CORRIDOR.startZ)
  }
  return (
    <button className="logo" onClick={onClick} aria-label="Back to start">
      <span className="logo__name">{site.name}</span>
      <span className="logo__role">{site.role}</span>
    </button>
  )
}

function Hamburger() {
  const open = useStore((s) => s.menuOpen)
  return (
    <button className={`hamburger-btn ${open ? 'open' : ''}`} onClick={() => useStore.getState().toggleMenu()} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
      <SketchBox seed={11} />
      <svg className="hamburger-icon" viewBox="0 0 32 32" aria-hidden="true">
        <path className="l1" d="M6 9.5 Q16 8.2 26.5 9.8" />
        <path className="l2" d="M5.6 16.2 Q15 15.4 26 16.6" />
        <path className="l3" d="M6.2 22.8 Q17 21.9 26.2 23.3" />
      </svg>
    </button>
  )
}

function NavControls() {
  const panel = useStore((s) => s.panel)
  const soundOn = useStore((s) => s.soundOn)
  const unlocked = useStore((s) => Object.keys(s.unlocked).length)
  const setPanel = useStore((s) => s.setPanel)
  return (
    <div className="nav-controls">
      <button className={`nav-btn ${panel === 'map' ? 'active' : ''}`} onClick={() => setPanel('map')} aria-label="Open map" data-tip="Map">
        <SketchBox seed={21} />
        <IconMap />
      </button>
      <button className={`nav-btn ${panel === 'audio' ? 'active' : ''}`} onClick={() => setPanel('audio')} aria-label="Audio settings" data-tip="Audio">
        <SketchBox seed={22} />
        {soundOn ? <IconSound /> : <IconMute />}
      </button>
      <button className={`nav-btn ${panel === 'achievements' ? 'active' : ''}`} onClick={() => setPanel('achievements')} aria-label="Achievements" data-tip="Achievements">
        <SketchBox seed={23} />
        <IconTrophy />
        {unlocked > 0 && <span className="nav-btn__badge">{unlocked}</span>}
      </button>
    </div>
  )
}

function Hints() {
  const phase = useStore((s) => s.phase)
  const hasWalked = useStore((s) => s.hasWalked)
  const nearDoor = useStore((s) => s.nearDoor)
  const hovered = useStore((s) => s.hoveredDoor)
  const inCorridor = phase === 'corridor'
  const door = rooms.find((r) => r.id === (hovered || nearDoor))

  return (
    <>
      <div className={`scroll-hint ${inCorridor && !hasWalked ? '' : 'hiding'}`}>
        <span className="scroll-hint__text">{isTouch ? 'swipe up to walk' : 'scroll to walk'}</span>
        <svg className="scroll-hint__arrow" viewBox="0 0 24 40" aria-hidden="true">
          <path d="M12 3 Q11 18 12.4 35 M5 27 L12.3 35.5 L19.2 26.6" />
        </svg>
      </div>
      <div className={`corridor-hint ${inCorridor && hasWalked && door ? '' : 'hiding'}`}>
        {door && (
          <>
            {hovered ? 'click to enter' : isTouch ? 'tap the door to enter' : 'click the door to enter'} <b style={{ '--c': door.color }}>{door.label}</b>
          </>
        )}
      </div>
    </>
  )
}

function TornScrollbar() {
  const phase = useStore((s) => s.phase)
  const thumb = useRef()
  const track = useRef()
  const clip = useRef(tornClip({ top: true, bottom: true, seed: 17, depth: 18, steps: 8 }))

  useEffect(() => {
    let raf
    const loop = () => {
      if (thumb.current && track.current) {
        const p = Math.max(0, Math.min(1, progressOf(view.z)))
        const h = track.current.clientHeight - thumb.current.clientHeight
        thumb.current.style.transform = `translateY(${p * h}px) rotate(${Math.sin(p * 20) * 3}deg)`
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className={`torn-scroll-track ${phase === 'corridor' || phase === 'cinematic' ? '' : 'hiding'}`} ref={track}>
      <svg className="torn-scroll-line" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M5 0 Q4 25 5.4 50 T5 100" />
      </svg>
      {rooms.map((r) => (
        <button
          key={r.id}
          className="torn-scroll-tick"
          style={{ top: `${progressOf(r.z) * 100}%`, '--c': r.color }}
          onClick={() => walkTo(r.z)}
          aria-label={`Walk to ${r.label}`}
        >
          <span>{r.label}</span>
        </button>
      ))}
      <div className="torn-scroll-thumb" ref={thumb} style={{ clipPath: clip.current }} />
    </div>
  )
}

export default function UIOverlay() {
  const phase = useStore((s) => s.phase)
  const visible = phase !== 'loading' && phase !== 'ready'
  return (
    <div className={`ui-overlay ${visible ? '' : 'ui-hidden'}`}>
      <Logo />
      <Hamburger />
      <NavControls />
      <Hints />
      <TornScrollbar />
    </div>
  )
}
