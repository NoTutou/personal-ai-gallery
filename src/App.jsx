import { useEffect } from 'react'
import { useStore } from './store'
import { exitRoom } from './director'
import Experience from './three/Experience'
import Preloader from './ui/Preloader'
import UIOverlay from './ui/UIOverlay'
import Menu from './ui/Menu'
import Panels, { AchievementToasts } from './ui/Panels'
import { tornClip } from './ui/sketchy'
import AboutRoom from './ui/rooms/AboutRoom'
import StudioRoom from './ui/rooms/StudioRoom'
import ContactRoom from './ui/rooms/ContactRoom'
import GalleryUI from './ui/rooms/GalleryUI'

const ROOM_UI = { about: AboutRoom, studio: StudioRoom, contact: ContactRoom, gallery: GalleryUI }
const wipeClip = tornClip({ left: true, right: true, seed: 99, depth: 4, steps: 36 })

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

export default function App() {
  const phase = useStore((s) => s.phase)
  const room = useStore((s) => s.room)
  const RoomUI = phase === 'room' && room ? ROOM_UI[room] : null
  useEscape()

  return (
    <div className="app">
      {phase !== 'loading' && <Experience />}
      {RoomUI && <RoomUI key={room} />}
      <UIOverlay />
      <Menu />
      <Panels />
      <AchievementToasts />
      <div id="page-wipe" className="page-wipe" style={{ clipPath: wipeClip }} aria-hidden="true">
        <svg viewBox="0 0 100 100" className="page-wipe__doodle">
          <path d="M20 60 Q35 30 50 55 T80 45" pathLength="1" />
        </svg>
      </div>
      <Preloader />
      <div className="paper-grain" aria-hidden="true" />
    </div>
  )
}
