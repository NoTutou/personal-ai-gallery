import { useState } from 'react'
import RoomPage from './RoomPage'
import { contact, site } from '../../data/content'
import { useStore } from '../../store'
import { sound } from '../../lib/audio'
import { SketchBox, IconArrowRight } from '../sketchy'

function Envelope() {
  return (
    <svg className="envelope" viewBox="0 0 200 140" aria-hidden="true">
      <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path className="doodle-fill env" d="M12 30 L188 26 L190 128 L10 130 Z" />
        <path d="M12 31 L100 88 L188 27" />
        <path d="M11 129 L78 74 M189 127 L122 72" opacity="0.6" />
        <path className="doodle-fill heart" d="M100 70 Q88 56 80 66 Q74 76 100 94 Q126 76 120 66 Q112 56 100 70 Z" transform="translate(0 -20) scale(1)" />
        <path d="M150 8 l6 10 M168 12 l-4 10 M180 4 l-8 12" opacity="0.7" />
      </g>
    </svg>
  )
}

export default function ContactRoom() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const unlock = useStore((s) => s.unlock)

  const submit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Hello from ${form.name || 'your portfolio'}`)
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`)
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`
    unlock('say-hi')
    setSent(true)
    sound.chime()
  }

  return (
    <RoomPage id="contact" title={contact.title} kicker="room 04">
      <div className="contact-grid">
        <div className="contact-left" data-reveal>
          <p className="contact-text">{contact.text}</p>
          <Envelope />
          <ul className="contact-methods">
            {contact.methods.map((m, i) => (
              <li key={m.label} style={{ '--i': i }}>
                <a
                  href={m.url}
                  target={m.url.startsWith('mailto') ? undefined : '_blank'}
                  rel="noreferrer"
                  className="contact-method"
                  onClick={() => unlock('say-hi')}
                  onMouseEnter={() => sound.pencil()}
                >
                  <SketchBox seed={400 + i} />
                  <span className="contact-method__label">{m.label}</span>
                  <span className="contact-method__value">{m.value}</span>
                  <IconArrowRight size={20} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form className="letter" onSubmit={submit} data-reveal>
          <span className="tape tape--tl" />
          <span className="tape tape--tr" />
          <h2>Write me a letter</h2>
          <label>
            <span>Your name</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ada Lovelace" />
          </label>
          <label>
            <span>Your email</span>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ada@example.com" />
          </label>
          <label>
            <span>Message</span>
            <textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Hi! I have an idea for…" />
          </label>
          <button className="sketch-btn sketch-btn--big" type="submit">
            <SketchBox seed={450} />
            <span>{sent ? 'Opened your mail app ✓' : 'Send it'}</span>
          </button>
        </form>
      </div>
    </RoomPage>
  )
}
