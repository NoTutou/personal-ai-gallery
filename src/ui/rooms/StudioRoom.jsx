import { useEffect, useMemo, useState } from 'react'
import RoomPage from './RoomPage'
import { studio } from '../../data/content'
import { artDataURL } from '../../lib/textures'
import { sound } from '../../lib/audio'
import { SketchBox, IconClose, IconExternal } from '../sketchy'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'article', label: 'Articles' },
  { id: 'video', label: 'Videos' },
  { id: 'post', label: 'Posts' },
]

export default function StudioRoom() {
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)
  const thumbs = useMemo(() => studio.map((s, i) => artDataURL(s.art, 5000 + i * 53)), [])
  const items = studio.map((s, i) => ({ ...s, i })).filter((s) => filter === 'all' || s.type === filter)

  useEffect(() => {
    if (open === null) return
    const onKey = (e) => e.key === 'Escape' && (e.stopPropagation(), setOpen(null))
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  const current = open !== null ? studio[open] : null

  return (
    <RoomPage id="studio" title="The Studio" kicker="room 03 · articles, videos & posts">
      <div className="studio-filters" data-reveal>
        {FILTERS.map((f) => (
          <button key={f.id} className={`chip ${filter === f.id ? 'active' : ''}`} onClick={() => { setFilter(f.id); sound.click() }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="studio-grid">
        {items.map((s) => (
          <article
            key={s.i}
            className="studio-paper-card"
            style={{ '--r': `${((s.i * 37) % 5) - 2}deg` }}
            data-reveal
            onClick={() => { setOpen(s.i); sound.paper() }}
            onKeyDown={(e) => e.key === 'Enter' && setOpen(s.i)}
            tabIndex={0}
            role="button"
            aria-label={`Open ${s.title}`}
          >
            <span className="tape tape--top" />
            <SketchBox seed={200 + s.i} />
            <div className={`studio-thumb studio-thumb--${s.type}`}>
              <img src={thumbs[s.i]} alt="" loading="lazy" />
              {s.type === 'video' && <span className="play-badge">▶</span>}
            </div>
            <div className="studio-meta">
              <span className={`platform platform--${s.type}`}>{s.platform}</span>
              <time>{s.date}</time>
            </div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <span className="studio-action-button">open →</span>
          </article>
        ))}
      </div>

      <div className={`studio-modal ${current ? 'open' : ''}`} onClick={() => setOpen(null)}>
        {current && (
          <div className="studio-modal__card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={current.title}>
            <SketchBox seed={300 + open} />
            <button className="studio-close-btn" onClick={() => setOpen(null)} aria-label="Close">
              <IconClose size={22} />
            </button>
            <div className="studio-media-container">
              <img src={thumbs[open]} alt="" />
              {current.type === 'video' && <span className="play-badge play-badge--big">▶</span>}
            </div>
            <div className="text-content">
              <div className="studio-meta">
                <span className={`platform platform--${current.type}`}>{current.platform}</span>
                <time>{current.date}</time>
              </div>
              <h2>{current.title}</h2>
              <p>{current.text}</p>
              <a className="sketch-btn" href={current.url} target="_blank" rel="noreferrer">
                <SketchBox seed={310 + open} />
                <span>
                  View content <IconExternal size={18} />
                </span>
              </a>
            </div>
          </div>
        )}
      </div>
    </RoomPage>
  )
}
