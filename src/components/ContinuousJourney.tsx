import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type JourneySection = { id: string; content: ReactNode }
type Props = { intro: ReactNode; sections: JourneySection[]; outro: ReactNode }
const clamp = (value: number) => Math.max(0, Math.min(1, value))

export default function ContinuousJourney({ intro, sections, outro }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const sceneRefs = useRef<(HTMLElement | null)[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduceMotion = reduceQuery.matches
    let rootTop = 0, travel = 1, target = 0, current = 0, lastTime = 0, frame = 0
    let running = false, activeIndex = 0

    const setAccessible = (index: number, enabled: boolean) => {
      const scene = sceneRefs.current[index]
      if (!scene) return
      scene.toggleAttribute('inert', !enabled)
      scene.setAttribute('aria-hidden', enabled ? 'false' : 'true')
      scene.querySelectorAll<HTMLElement>('a, button').forEach((control) => enabled ? control.removeAttribute('tabindex') : control.tabIndex = -1)
    }
    const setStatic = () => {
      root.classList.remove('journey--live')
      root.style.removeProperty('--journey-height')
      sceneRefs.current.forEach((scene, index) => { scene?.removeAttribute('style'); setAccessible(index, true) })
    }
    const apply = (progress: number) => {
      if (!root.classList.contains('journey--live')) return
      root.style.setProperty('--journey', progress.toFixed(4))
      const spacing = 0.78
      const camera = progress * (sections.length * spacing + 0.9) - 0.55
      const nextActive = Math.max(0, Math.min(sections.length - 1, Math.round(camera / spacing)))
      if (nextActive !== activeIndex) {
        setAccessible(activeIndex, false)
        activeIndex = nextActive
        setAccessible(activeIndex, true)
        setActive(activeIndex)
      }
      sections.forEach((_, index) => {
        const scene = sceneRefs.current[index]
        if (!scene) return
        const nearby = Math.abs(index * spacing - camera) <= 1.25
        scene.classList.toggle('journey__scene--near', nearby)
        if (nearby) scene.style.setProperty('--local', clamp(camera - index * spacing + 0.5).toFixed(4))
      })
    }
    const measure = () => {
      if (reduceMotion || window.innerHeight <= 0) { setStatic(); return }
      root.classList.add('journey--live')
      const viewport = window.innerHeight
      const units = 2.4 + sections.length * 2.4
      root.style.setProperty('--journey-height', `${Math.round(viewport * units)}px`)
      rootTop = root.getBoundingClientRect().top + window.scrollY
      travel = Math.max(1, viewport * (units - 1))
      target = current = clamp((window.scrollY - rootTop) / travel)
      sceneRefs.current.forEach((_, index) => setAccessible(index, index === activeIndex))
      apply(current)
    }
    const tick = (time: number) => {
      const delta = Math.min(64, lastTime ? time - lastTime : 16.7)
      lastTime = time
      current += (target - current) * (1 - Math.exp(-delta / 110))
      if (Math.abs(target - current) < 0.0003) { current = target; running = false }
      apply(current)
      frame = running ? requestAnimationFrame(tick) : 0
    }
    const onScroll = () => {
      target = clamp((window.scrollY - rootTop) / travel)
      if (!running) { running = true; lastTime = 0; frame = requestAnimationFrame(tick) }
    }
    const onReduceChange = (event: MediaQueryListEvent) => { reduceMotion = event.matches; measure() }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    reduceQuery.addEventListener('change', onReduceChange)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      reduceQuery.removeEventListener('change', onReduceChange)
    }
  }, [sections.length])

  return <div ref={rootRef} className="journey" data-active-scene={active}>
    <div className="journey__track">
      {sections.map((section, index) => <span key={section.id} id={section.id} className="journey__anchor" style={{ '--anchor': index + 1 } as CSSProperties}/>)}
      <div className="journey__stage">
        <div className="journey__corridor" aria-hidden="true"><i/><i/><i/><i/></div>
        <section id="intro" className="journey__intro">{intro}</section>
        {sections.map((section, index) => <section key={section.id} ref={(node) => { sceneRefs.current[index] = node }} className="journey__scene" style={{ '--side': index % 2 ? 1 : -1 } as CSSProperties} aria-hidden={index ? 'true' : 'false'}>{section.content}</section>)}
        <section className="journey__finale">{outro}</section>
      </div>
    </div>
  </div>
}
