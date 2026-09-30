import { useEffect, useRef } from 'react'
import { exitRoom } from '../../director'
import { SketchBox, IconArrowLeft, Scribble } from '../sketchy'

/** Shared paper page wrapper for HTML rooms. */
export default function RoomPage({ id, title, kicker, children }) {
  const scroller = useRef()

  // reveal-on-scroll for elements marked with data-reveal
  useEffect(() => {
    const root = scroller.current
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-in')),
      { root, threshold: 0.15 },
    )
    root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className={`room-page zone-${id}`} ref={scroller}>
      <button className="back-btn" onClick={() => exitRoom()} aria-label="Back to corridor">
        <SketchBox seed={id.length * 5} />
        <IconArrowLeft size={20} />
        <span>corridor</span>
      </button>
      <div className="room-page__inner">
        <header className="room-page__header" data-reveal>
          {kicker && <p className="room-page__kicker">{kicker}</p>}
          <h1 className="title">
            {title}
            <Scribble seed={id.length * 3} className="title__scribble" />
          </h1>
        </header>
        {children}
      </div>
    </div>
  )
}
