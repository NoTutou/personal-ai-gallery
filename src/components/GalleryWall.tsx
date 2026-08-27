import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

type GalleryWallProps = {
  id: string
  index: number
  art?: ReactNode
  travel?: number
  smoothing?: number
  children: ReactNode
}

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v)

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1)
  return t * t * (3 - 2 * t)
}

// One-shot gallery wall: the section hangs as a painting on a corridor wall.
// A passive scroll listener + rAF lerp write three eased phases as CSS custom
// props (--pin / --popen / --pout); the stylesheet composes them into
// transform/opacity only. prefers-reduced-motion (and JS-less renders) fall
// back to a static framed gallery: no pin, no slide, content fully visible.
export default function GalleryWall({ id, index, art, travel = 2.4, smoothing = 0.1, children }: GalleryWallProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const propsRef = useRef({ travel, smoothing })
  propsRef.current = { travel, smoothing }

  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage) return

    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduceMotion = reduceQuery.matches

    let raf = 0
    let current = 0
    let target = 0
    let stageH = 0
    let running = false

    const apply = (p: number) => {
      if (!stage.classList.contains('wall-live')) return
      stage.style.setProperty('--pin', smoothstep(0.02, 0.3, p).toFixed(4))
      stage.style.setProperty('--popen', smoothstep(0.34, 0.58, p).toFixed(4))
      stage.style.setProperty('--pout', smoothstep(0.74, 0.98, p).toFixed(4))
    }

    const setStatic = () => {
      stage.classList.remove('wall-live')
      stage.style.height = ''
      track.style.height = ''
      stage.style.removeProperty('--pin')
      stage.style.removeProperty('--popen')
      stage.style.removeProperty('--pout')
    }

    const measure = () => {
      stageH = window.innerHeight
      if (reduceMotion || stageH <= 0) {
        setStatic()
        return
      }
      stage.classList.add('wall-live')
      stage.style.height = `${stageH}px`
      track.style.height = `${Math.round(stageH * (1 + propsRef.current.travel))}px`
    }

    const readProgress = () => {
      if (!stage.classList.contains('wall-live')) return 0
      const span = stageH * Math.max(0.01, propsRef.current.travel)
      return clamp(-track.getBoundingClientRect().top / span, 0, 1)
    }

    const tick = () => {
      const k = propsRef.current.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * propsRef.current.smoothing))
      current += (target - current) * k
      if (Math.abs(target - current) < 0.0004) {
        current = target
        running = false
      }
      apply(current)
      raf = running ? requestAnimationFrame(tick) : 0
    }

    const kick = () => {
      if (running) return
      running = true
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onScroll = () => {
      target = readProgress()
      if (propsRef.current.smoothing <= 0 || reduceMotion) {
        current = target
        apply(current)
        return
      }
      kick()
    }

    const onResize = () => {
      measure()
      target = readProgress()
      current = target
      apply(current)
    }

    // Keyboard/click into the painting: if the wall is not currently at its
    // expanded reading state, jump the scroll there so focused content is
    // readable — accessibility does not depend on scroll position.
    const onFocusIn = () => {
      if (!stage.classList.contains('wall-live')) return
      if (target > 0.3 && target < 0.78) return
      const span = stageH * propsRef.current.travel
      const top = track.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: top + span * 0.62, behavior: 'instant' })
    }

    measure()
    target = readProgress()
    current = target
    apply(current)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    stage.addEventListener('focusin', onFocusIn)
    const onReduceChange = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches
      onResize()
    }
    reduceQuery.addEventListener('change', onReduceChange)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      stage.removeEventListener('focusin', onFocusIn)
      reduceQuery.removeEventListener('change', onReduceChange)
    }
  }, [])

  const side = index % 2 === 0 ? '-1' : '1'

  return (
    <section id={id} className="gallery-wall" style={{ '--side': side } as CSSProperties}>
      <div ref={trackRef} className="gallery-wall__track">
        <div ref={stageRef} className="gallery-wall__stage">
          <div className="gallery-wall__spot" aria-hidden="true" />
          <div className="gallery-wall__floor" aria-hidden="true" />
          <div className="gallery-wall__frame">
            {art ? <div className="gallery-wall__art" aria-hidden="true">{art}</div> : null}
            <div className="gallery-wall__scrim" aria-hidden="true" />
            <div className="gallery-wall__content">{children}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
