import { useEffect, useState } from 'react'
import { useStore } from '../../store'
import { projects } from '../../data/content'
import { exitRoom } from '../../director'
import { carousel, selectProject } from '../../three/GalleryRoom'
import { SketchBox, IconArrowLeft, IconArrowRight, IconClose, IconExternal } from '../sketchy'

export default function GalleryUI() {
  const selected = useStore((s) => s.selectedProject)
  const [front, setFront] = useState(0)
  const p = selected !== null ? projects[selected] : null

  useEffect(() => {
    let raf
    const loop = () => {
      setFront((f) => (f === carousel.frontIndex() ? f : carousel.frontIndex()))
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  const close = () => useStore.getState().set({ selectedProject: null })

  return (
    <div className={`gallery-ui ${p ? 'has-selection' : ''}`}>
      <button className="back-btn" onClick={() => exitRoom()} aria-label="Back to corridor">
        <SketchBox seed={7} />
        <IconArrowLeft size={20} />
        <span>corridor</span>
      </button>

      <header className="gallery-ui__header">
        <p className="room-page__kicker">room 02</p>
        <h1 className="title">Gallery</h1>
        <p className="instructions">drag to rotate and browse · click a project to inspect</p>
      </header>

      <div className="gallery-ui__controls">
        <button className="nav-btn" onClick={() => carousel.prev()} aria-label="Previous project">
          <SketchBox seed={8} />
          <IconArrowLeft />
        </button>
        <button className="gallery-ui__counter" onClick={() => selectProject(front)}>
          <b>{String(front + 1).padStart(2, '0')}</b> / {String(projects.length).padStart(2, '0')}
          <span>{projects[front].title}</span>
        </button>
        <button className="nav-btn" onClick={() => carousel.next()} aria-label="Next project">
          <SketchBox seed={9} />
          <IconArrowRight />
        </button>
      </div>

      <aside className={`project-panel ${p ? 'open' : ''}`} aria-hidden={!p}>
        {p && (
          <>
            <SketchBox seed={500 + selected} />
            <button className="close-btn" onClick={close} aria-label="Close project">
              <IconClose size={22} />
            </button>
            <p className="project-panel__year">
              {p.year} · project {String(selected + 1).padStart(2, '0')}
            </p>
            <h2>{p.title}</h2>
            <p className="project-panel__subtitle">{p.subtitle}</p>
            <ul className="tags">
              {p.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="description">{p.description}</p>
            <div className="project-panel__actions">
              <a className="sketch-btn" href={p.url} target="_blank" rel="noreferrer">
                <SketchBox seed={520 + selected} />
                <span>
                  Visit site <IconExternal size={18} />
                </span>
              </a>
              <button className="text-btn" onClick={() => { carousel.prev(); }}>
                ← prev
              </button>
              <button className="text-btn" onClick={() => { carousel.next(); }}>
                next →
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
