import { useStore } from '../store'
import { rooms, contact, site } from '../data/content'
import { travelTo, exitRoom } from '../director'
import { Scribble, SketchBox, tornClip } from './sketchy'
import { sound } from '../lib/audio'

const clip = tornClip({ bottom: true, seed: 71, depth: 2.5, steps: 60 })

export default function Menu() {
  const open = useStore((s) => s.menuOpen)
  const phase = useStore((s) => s.phase)
  const current = useStore((s) => s.room)
  const visited = useStore((s) => s.visited)
  const setPanel = useStore((s) => s.setPanel)

  const go = (id) => {
    sound.click()
    useStore.getState().set({ menuOpen: false })
    setTimeout(() => travelTo(id), 350)
  }

  return (
    <div className={`menu-overlay ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="menu-overlay__paper" style={{ clipPath: clip }}>
        <nav className="menu-overlay__nav" aria-label="Rooms">
          {rooms.map((r, i) => (
            <button
              key={r.id}
              className={`menu-link ${current === r.id ? 'active' : ''}`}
              onClick={() => go(r.id)}
              onMouseEnter={() => sound.pencil()}
              style={{ '--c': r.color, '--i': i }}
              tabIndex={open ? 0 : -1}
              aria-label={`Go to ${r.label}`}
            >
              <span className="menu-link__num">0{i + 1}</span>
              <span className="menu-link__label">{r.label}</span>
              {visited[r.id] && <span className="menu-link__visited">visited ✓</span>}
              <Scribble seed={i * 7 + 1} className="menu-link__scribble" />
            </button>
          ))}
        </nav>

        <div className="menu-overlay__side">
          <p className="menu-overlay__note">
            {site.tagline}
            <br />
            <span>— {site.name}</span>
          </p>
          <div className="menu-overlay__tools">
            {phase === 'room' && (
              <button className="sketch-btn" onClick={() => { useStore.getState().set({ menuOpen: false }); exitRoom() }} tabIndex={open ? 0 : -1}>
                <SketchBox seed={31} />
                <span>← Back to corridor</span>
              </button>
            )}
            <button className="sketch-btn" onClick={() => setPanel('map')} tabIndex={open ? 0 : -1}>
              <SketchBox seed={32} />
              <span>Map</span>
            </button>
            <button className="sketch-btn" onClick={() => setPanel('audio')} tabIndex={open ? 0 : -1}>
              <SketchBox seed={33} />
              <span>Audio</span>
            </button>
            <button className="sketch-btn" onClick={() => setPanel('achievements')} tabIndex={open ? 0 : -1}>
              <SketchBox seed={34} />
              <span>Achievements</span>
            </button>
          </div>
          <ul className="menu-overlay__social">
            {contact.methods.slice(1).map((m) => (
              <li key={m.label}>
                <a href={m.url} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
                  {m.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
