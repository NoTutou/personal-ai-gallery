import type { ReactNode } from 'react'
import { about, awards, faqs, footer, profile, projects, sourceDoodles, sourceLabels, studioItems } from '../content'
import { Doodle, Reveal, type DialogItem } from './sketch'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

// 行走模式下的房间编号（contact 是走廊尽头的海边终点站）
export type RoomId = 'about' | 'projects' | 'studio' | 'awards' | 'contact'
export type NavTarget = RoomId | 'reset'

const NAV: { id: RoomId; label: string }[] = [
  { id: 'about', label: '关于我' },
  { id: 'projects', label: '项目' },
  { id: 'studio', label: '动态' },
  { id: 'awards', label: '奖项' },
]
const NAV_FAQ_LABEL = '问答'

export function SiteHeader({ onNavigate }: { onNavigate?: (target: NavTarget) => void }) {
  return <header className="site-header">
    <div className="site-header__inner">
      <a className="brand" href="#top"
        onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate('reset') } : undefined}>
        <Doodle name="pen" className="brand__icon"/><span>{profile.name}</span>
      </a>
      <nav className="site-nav" aria-label="房间导航">
        {onNavigate
          ? <>{NAV.map((item) => <button key={item.id} type="button" className="site-nav__link"
              onClick={() => onNavigate(item.id)}>{item.label}</button>)}
            <button type="button" className="site-nav__link" onClick={() => onNavigate('contact')}>{NAV_FAQ_LABEL} / 联系</button></>
          : <><a href="#about">关于我</a><a href="#projects">项目</a><a href="#studio">动态</a><a href="#awards">奖项</a><a href="#faq">问答</a></>}
      </nav>
      {onNavigate
        ? <button type="button" className="btn-sketch btn-sketch--small site-header__cta" onClick={() => onNavigate('contact')}>联系我</button>
        : <a className="btn-sketch btn-sketch--small site-header__cta" href={`mailto:${footer.email}`}>联系我</a>}
    </div>
  </header>
}

export function FaqList({ heading }: { heading?: string }) {
  return <>
    {heading && <SectionHead index="05" eyebrow="FAQ · 上船前想问的" title={heading} />}
    <Reveal className="faq-wrap">
      <div className="sheet faq-list">
        {faqs.map((faq) => <details key={faq.q} className="faq-item" name="endpoint-faq">
          <summary><span className="faq-q">{faq.q}</span><span className="faq-marker" aria-hidden="true">＋</span></summary>
          <p>{faq.a}</p>
        </details>)}
      </div>
    </Reveal>
  </>
}

export function SectionHead({ index, eyebrow, title, note }: { index: string; eyebrow: string; title: string; note?: string }) {
  return <header className="section-head">
    <span className="section-index" aria-hidden="true">{index}</span>
    <p className="eyebrow">{eyebrow}</p>
    <h2>{title}</h2>
    <svg className="section-squiggle" viewBox="0 0 220 14" aria-hidden="true" preserveAspectRatio="none">
      <path d="M3 8c14-6 28-6 42 0s28 6 42 0 28-6 42 0 28 6 42 0 24-6 46-2" fill="none" filter="url(#pencil-b)"/>
    </svg>
    {note && <p className="section-note">{note}</p>}
  </header>
}

export function About() {
  return <section id="about" className="room">
    <div className="container">
      <SectionHead index="01" eyebrow={about.eyebrow} title="关于我" />
      <div className="about-grid">
        <Reveal className="about-portrait">
          <div className="sheet sheet--portrait">
            {about.avatar
              ? <img src={asset(about.avatar)} alt={`${profile.name}的头像`}/>
              : <Doodle name="avatar" className="about-avatar" title="手绘头像占位"/>}
            <p className="portrait-note">手绘头像占位 · 放一张你的照片到 public/assets，然后在 content.ts 里填 avatar 字段</p>
          </div>
        </Reveal>
        <Reveal className="about-text">
          {about.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <div className="about-links">
            {about.links.map((link) => <a key={link.label} className="btn-sketch" href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{link.label} ↗</a>)}
          </div>
        </Reveal>
      </div>
    </div>
  </section>
}

export type CardItem = {
  uid: string
  title: string
  summary: string
  art: ReactNode
  meta?: ReactNode
  dialog: DialogItem
}

export function ItemSection({ id, index, eyebrow, title, note, items, onOpen, className }: {
  id: string; index: string; eyebrow: string; title: string; note?: string
  items: CardItem[]; onOpen: (item: CardItem, button: HTMLButtonElement) => void; className?: string
}) {
  return <section id={id} className={`room${className ? ` ${className}` : ''}`}>
    <div className="container">
      <SectionHead index={index} eyebrow={eyebrow} title={title} note={note} />
      <div className="cards">
        {items.map((item, i) => <Reveal key={item.uid} className={`card-slot card-slot--${(i % 4) + 1}`}>
          <article className="sheet card">
            <div className="card__art">{item.art}</div>
            {item.meta}
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <button className="btn-sketch card__more" aria-label={`查看 ${item.title} 详情`}
              onClick={(event) => onOpen(item, event.currentTarget)}>查看详情 <span aria-hidden="true">↗</span></button>
          </article>
        </Reveal>)}
      </div>
    </div>
  </section>
}

export function projectItems(): CardItem[] {
  return projects.map((project) => ({
    uid: project.id,
    title: project.title,
    summary: project.summary,
    art: project.image
      ? <img src={asset(project.image)} alt="" loading="lazy"/>
      : <Doodle name={project.art} className="card__doodle"/>,
    dialog: {
      eyebrow: 'Project · 项目',
      title: project.title,
      paragraphs: [project.summary, ...project.details],
      link: project.link ? { href: project.link, label: project.linkLabel ?? '访问项目' } : undefined,
    },
  }))
}

export function studioCardItems(): CardItem[] {
  return studioItems.map((item) => ({
    uid: item.id,
    title: item.title,
    summary: item.summary,
    art: <Doodle name={sourceDoodles[item.source]} className="card__doodle"/>,
    meta: <p className="card__meta"><span className={`badge badge--${item.source}`}><Doodle name={sourceDoodles[item.source]} className="badge__icon"/>{sourceLabels[item.source]}</span></p>,
    dialog: {
      eyebrow: `The Studio · ${sourceLabels[item.source]}`,
      title: item.title,
      paragraphs: [item.summary],
      link: item.link ? { href: item.link, label: '查看内容' } : undefined,
    },
  }))
}

export function awardCardItems(): CardItem[] {
  return awards.map((award) => ({
    uid: award.id,
    title: award.title,
    summary: award.description,
    art: <Doodle name={award.kind === 'sotd' ? 'medal' : 'ribbon'} className="card__doodle"/>,
    meta: <p className="card__meta">
      <span className={`badge badge--kind-${award.kind}`}>{award.kind === 'sotd' ? '★ 每日精选' : '荣誉'}</span>
      <time>{award.date}</time>
    </p>,
    dialog: {
      eyebrow: 'Award · 奖项',
      title: award.title,
      paragraphs: [award.description],
      tags: [award.date, award.kind === 'sotd' ? '每日精选' : '荣誉提名'],
      link: award.link ? { href: award.link, label: '查看链接' } : undefined,
    },
  }))
}

export function Faq() {
  return <section id="faq" className="room room--faq">
    <div className="container container--narrow">
      <SectionHead index="05" eyebrow="FAQ · 常见问题" title="常见问题" />
      <Reveal className="faq-wrap">
        <div className="sheet faq-list">
          {faqs.map((faq, index) => <details key={faq.q} className="faq-item" name="faq">
            <summary><span className="faq-q">{faq.q}</span><span className="faq-marker" aria-hidden="true">＋</span></summary>
            <p>{faq.a}</p>
          </details>)}
        </div>
      </Reveal>
    </div>
  </section>
}

// 走廊尽头的海边终点站：联系 + 常见问题，进了这里就算“到达”
export function EndpointRoom() {
  return <div className="endpoint-room room-body">
    <svg className="beach-band" viewBox="0 0 1200 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx={980} cy={62} r={34} className="beach-sun" />
      <path d="M870 44c6-9 16-9 22 0M892 60c5-7 13-7 18 0M300 52c6-9 16-9 22 0" fill="none" className="beach-gull" />
      <rect x={0} y={110} width={1200} height={80} className="beach-sea" />
      {[118, 140, 162].map((y, i) => (
        <path key={y} d={`M-40 ${y}q30 -12 60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0`}
          fill="none" strokeDasharray="26 20" className={`beach-wave beach-wave--${i}`} />
      ))}
      <path d="M420 178l14-26 6 10 10-4z M430 150c2-5 8-5 10 0" fill="none" className="beach-bottle" />
    </svg>
    <Doodle name="pen" className="footer-pen" />
    <h2>{footer.heading}</h2>
    <p>{footer.text}</p>
    <a className="btn-sketch btn-sketch--accent" href={`mailto:${footer.email}`}>{footer.email} ✉</a>
    <div className="footer-socials">
      {footer.socials.map((social) => <a key={social.label} className="beach-float" style={{ animationDelay: `${social.label.length * 0.31}s` }}
        href={social.href} target={social.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{social.label} ↗</a>)}
    </div>
    <div className="endpoint-faq">
      <FaqList heading="常见问题" />
    </div>
    <p className="footer-credit">{footer.credit}</p>
  </div>
}

export function SiteFooter() {
  return <footer id="contact" className="site-footer">
    <div className="container">
      <Doodle name="pen" className="footer-pen" />
      <h2>{footer.heading}</h2>
      <p>{footer.text}</p>
      <a className="btn-sketch btn-sketch--accent" href={`mailto:${footer.email}`}>{footer.email} ✉</a>
      <div className="footer-socials">
        {footer.socials.map((social) => <a key={social.label} href={social.href}
          target={social.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{social.label} ↗</a>)}
      </div>
      <a className="footer-loop" href="#top">↺ 沿走廊走回起点</a>
      <p className="footer-credit">{footer.credit}</p>
    </div>
  </footer>
}
