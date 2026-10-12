import { useEffect, useRef } from 'react'
import { useStore, portal } from './store'
import { exitRoom } from './director'
import Experience, { GalleryStage } from './three/Experience'
import Preloader from './ui/Preloader'
import UIOverlay from './ui/UIOverlay'
import Menu from './ui/Menu'
import Panels, { AchievementToasts } from './ui/Panels'
import AboutRoom from './ui/rooms/AboutRoom'
import StudioRoom from './ui/rooms/StudioRoom'
import ContactRoom from './ui/rooms/ContactRoom'
import GalleryUI from './ui/rooms/GalleryUI'

const ROOM_UI = { about: AboutRoom, studio: StudioRoom, contact: ContactRoom, gallery: GalleryUI }
const HIDDEN = 'polygon(0 0, 0 0, 0 0)'

function useEscape() {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      const s = useStore.getState()
      if (s.panel) s.set({ panel: null })
      else if (s.menuOpen) s.set({ menuOpen: false })
      else if (s.selectedProject !== null) s.set({ selectedProject: null })
      else if (s.phase === 'room') exitRoom()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/**
 * The room behind a door. While the door is opening or closing, the layer is
 * clipped to the door's on-screen gap so you see the room live through it.
 */
function RoomLayer({ id }) {
  const ref = useRef()
  const phase = useStore((s) => s.phase)
  const RoomUI = ROOM_UI[id]

  useEffect(() => {
    let raf
    const loop = () => {
      const el = ref.current
      if (el) {
        let clip = 'none'
        if (portal.active && portal.id === id && !portal.full) {
          clip = portal.points?.length >= 3 ? `polygon(${portal.points.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})` : HIDDEN
        }
        if (el.style.clipPath !== clip) el.style.clipPath = clip
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [id])

  return (
    <div ref={ref} className={`room-layer ${phase === 'room' ? 'is-inside' : ''}`} style={{ clipPath: HIDDEN }}>
      {id === 'gallery' && <GalleryStage />}
      <RoomUI />
    </div>
  )
}

export default function App() {
  const phase = useStore((s) => s.phase)
  const room = useStore((s) => s.room)
  useEscape()

  return (
    <div className="app">
      {phase !== 'loading' && <Experience />}
      {room && <RoomLayer key={room} id={room} />}
      <UIOverlay />
      <Menu />
      <Panels />
      <AchievementToasts />
      <Preloader />
      <div className="paper-grain" aria-hidden="true" />
    </div>
  )
}
