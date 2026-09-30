import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useStore } from '../store'
import { prepareAssets } from '../lib/textures'
import { sound } from '../lib/audio'
import { rng } from '../lib/sketch'
import { site } from '../data/content'
import { SketchBox } from './sketchy'

const MESSAGES = ['sharpening pencils…', 'stretching the paper…', 'sketching the corridor…', 'mixing watercolours…', 'hanging the frames…']

function tearLine(seed = 42) {
  const r = rng(seed)
  const pts = []
  let x = 50
  for (let y = 0; y <= 100; y += 1.5 + r() * 2.5) {
    x += (r() - 0.5) * 3.2
    x = Math.max(45, Math.min(55, x))
    pts.push([x, Math.min(100, y)])
  }
  pts.push([x, 100])
  return pts
}

export default function Preloader() {
  const phase = useStore((s) => s.phase)
  const soundOn = useStore((s) => s.soundOn)
  const [progress, setProgress] = useState(0)
  const [msg, setMsg] = useState(0)
  const [gone, setGone] = useState(false)
  const root = useRef()
  const left = useRef()
  const right = useRef()
  const overlay = useRef()
  const shown = useRef({ v: 0 })

  const { leftClip, rightClip } = useMemo(() => {
    const line = tearLine()
    const f = (p) => `${p[0].toFixed(2)}% ${p[1].toFixed(2)}%`
    return {
      leftClip: `polygon(0% 0%, ${line.map(f).join(',')}, 0% 100%)`,
      rightClip: `polygon(100% 0%, ${line.map(f).join(',')}, 100% 100%)`,
    }
  }, [])

  useEffect(() => {
    // smooth the displayed number so it never jumps
    prepareAssets((p) => gsap.to(shown.current, { v: p, duration: 0.4, overwrite: true, onUpdate: () => setProgress(shown.current.v) })).then(() => {
      gsap.to(shown.current, {
        v: 1,
        duration: 0.5,
        overwrite: true,
        onUpdate: () => setProgress(shown.current.v),
        onComplete: () => useStore.getState().set({ phase: 'ready' }),
      })
    })
    const id = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 1400)
    return () => clearInterval(id)
  }, [])

  const enter = () => {
    const s = useStore.getState()
    if (s.phase !== 'ready') return
    sound.init()
    sound.setVolumes(s.volumes)
    sound.setEnabled(s.soundOn)
    sound.tear()
    s.set({ phase: 'corridor' })
    const tl = gsap.timeline({ onComplete: () => setGone(true) })
    tl.to(overlay.current, { autoAlpha: 0, y: -20, duration: 0.35, ease: 'power2.in' })
      .to(left.current, { xPercent: -8, rotate: -1.5, duration: 0.25, ease: 'power1.out' }, 0.3)
      .to(right.current, { xPercent: 8, rotate: 1.5, duration: 0.25, ease: 'power1.out' }, 0.3)
      .to(left.current, { xPercent: -75, yPercent: 30, rotate: -14, duration: 1.1, ease: 'power3.in' }, 0.6)
      .to(right.current, { xPercent: 75, yPercent: 38, rotate: 12, duration: 1.1, ease: 'power3.in' }, 0.62)
  }

  useEffect(() => {
    if (phase !== 'ready') return
    const onKey = (e) => e.key === 'Enter' && enter()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  if (gone) return null
  const pct = Math.round(progress * 100)
  const ready = phase === 'ready'

  return (
    <div className="preloader" ref={root}>
      <div className="preloader__half preloader__half--left" ref={left}>
        <div className="preloader__paper" style={{ clipPath: leftClip }} />
      </div>
      <div className="preloader__half preloader__half--right" ref={right}>
        <div className="preloader__paper" style={{ clipPath: rightClip }} />
      </div>

      <div className="preloader__overlay" ref={overlay}>
        <p className="preloader__name">{site.name}</p>
        <div className="preloader__percentage">{pct}%</div>
        <svg className="preloader__bar" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
          <path d="M4 11 Q40 5 80 11 T160 10 T240 11 T296 9" pathLength="1" style={{ strokeDashoffset: 1 - progress }} />
        </svg>
        <p className="preloader__msg">{ready ? 'the paper is ready.' : MESSAGES[msg]}</p>

        <div className={`preloader__actions ${ready ? 'is-ready' : ''}`}>
          <button className="sketch-btn sketch-btn--big" onClick={enter} disabled={!ready}>
            <SketchBox seed={5} />
            <span>Tear it open</span>
          </button>
          <button
            className={`inline-sound-toggle ${soundOn ? '' : 'off'}`}
            onClick={() => useStore.getState().set({ soundOn: !soundOn })}
            aria-pressed={soundOn}
          >
            sound: <b>{soundOn ? 'on' : 'off'}</b>
          </button>
          <p className="preloader__tip">best with headphones · scroll to walk · click doors to enter</p>
        </div>
      </div>
    </div>
  )
}
