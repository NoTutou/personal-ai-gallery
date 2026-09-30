import RoomPage from './RoomPage'
import { about, awards, site } from '../../data/content'
import { travelTo } from '../../director'
import { SketchBox, IconCheck, IconArrowRight } from '../sketchy'

/** An original doodle self-portrait: round head, messy hair, glasses, laptop. */
function Doodle() {
  return (
    <svg className="doodle" viewBox="0 0 240 260" aria-label="Doodle portrait" role="img">
      <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* hair */}
        <path className="doodle-fill hair" d="M72 92 Q66 44 118 38 Q170 34 172 88 Q160 70 140 72 Q128 58 110 70 Q92 62 86 80 Q78 80 72 92 Z" />
        {/* head */}
        <path className="doodle-fill skin" d="M74 90 Q70 150 120 156 Q170 152 170 90 Q160 70 140 72 Q128 58 110 70 Q92 62 86 80 Q78 80 74 90 Z" />
        {/* glasses */}
        <circle cx="100" cy="108" r="15" />
        <circle cx="142" cy="108" r="15" />
        <path d="M115 107 Q121 102 127 107 M85 104 L74 100 M157 104 L169 100" />
        {/* eyes */}
        <path d="M96 109 q4 -4 8 0 M138 109 q4 -4 8 0" />
        {/* smile */}
        <path d="M106 134 Q121 146 136 132" />
        <path d="M84 124 q-4 2 -3 6 M158 124 q4 2 3 6" opacity="0.5" />
        {/* body */}
        <path className="doodle-fill shirt" d="M60 250 Q56 186 96 168 Q120 176 146 168 Q188 186 184 250 Z" />
        <path d="M108 170 Q121 186 134 170" />
        {/* laptop */}
        <path className="doodle-fill laptop" d="M70 212 L174 212 L186 250 L58 250 Z" />
        <path d="M112 226 q10 -6 20 0" />
        {/* doodle marks */}
        <path d="M30 40 l10 6 M26 58 l14 0 M200 40 l-10 8 M210 62 l-14 0" opacity="0.6" />
      </g>
    </svg>
  )
}

export default function AboutRoom() {
  return (
    <RoomPage id="about" title={about.title} kicker="room 01">
      <div className="about-grid">
        <aside className="about-aside" data-reveal>
          <figure className="polaroid">
            <span className="tape tape--tl" />
            <span className="tape tape--tr" />
            <Doodle />
            <figcaption>that's me (roughly)</figcaption>
          </figure>
          <div className="sticky-note">
            <SketchBox seed={71} double={false} />
            <ul>
              {about.facts.map((f) => (
                <li key={f.k}>
                  <span>{f.k}</span>
                  <b>{f.v}</b>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="about-main">
          <p className="about-intro" data-reveal>
            {about.intro}
          </p>
          {about.paragraphs.map((p, i) => (
            <p key={i} className="about-p" data-reveal>
              {p}
            </p>
          ))}

          <h2 className="section-title" data-reveal>
            Toolbox
          </h2>
          <ul className="checklist" data-reveal>
            {about.skills.map((s, i) => (
              <li key={s.label} className={s.checked ? 'checked' : ''} style={{ '--i': i }}>
                <span className="checkmark">
                  <SketchBox seed={80 + i} double={false} />
                  {s.checked ? <IconCheck size={22} /> : <span className="checkmark__cross">?</span>}
                </span>
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="awards" data-reveal>
        <h2 className="section-title">Awards & Certificates</h2>
        <div className="awards-scroll-container">
          {awards.map((a, i) => (
            <article key={i} className="award-card" style={{ '--r': `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg` }}>
              <SketchBox seed={90 + i} />
              <svg className="award-ribbon" viewBox="0 0 40 56" aria-hidden="true">
                <circle cx="20" cy="18" r="14" />
                <path d="M12 30 L8 52 L20 44 L32 52 L28 30" />
              </svg>
              <span className={`award-kind award-kind--${a.kind}`}>{a.kind === 'sotd' ? 'Site of the Day' : 'Honor'}</span>
              <h3>{a.title}</h3>
              <p>{a.org}</p>
              <time>{a.date}</time>
            </article>
          ))}
        </div>
        <p className="awards-hint">← drag / scroll sideways →</p>
      </section>

      <section className="about-cta" data-reveal>
        <p>
          Like what you see? {site.name.split(' ')[0]} is open for freelance work.
        </p>
        <button className="sketch-btn sketch-btn--big" onClick={() => travelTo('contact')}>
          <SketchBox seed={99} />
          <span>
            Go to the Contact room <IconArrowRight size={22} />
          </span>
        </button>
      </section>
    </RoomPage>
  )
}
