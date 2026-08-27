import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { content, type Card, type GallerySection } from './content'
import ScrollExpand from './components/ScrollExpand'
import GalleryWall from './components/GalleryWall'
import { heroMedia } from './components/heroMedia'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

function Geometry({ scene }: { scene: string }) {
  return <div className={`geometry geometry--${scene}`} aria-hidden="true"><i/><i/><i/></div>
}

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        el.classList.add('is-visible')
        io.disconnect()
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

function CardDialog({ card, onClose }: { card: Card; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialog.current?.showModal?.()
    document.body.classList.add('dialog-open')
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', escape)
    return () => { document.body.classList.remove('dialog-open'); document.removeEventListener('keydown', escape) }
  }, [onClose])
  return <dialog ref={dialog} aria-labelledby="dialog-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === dialog.current) onClose() }}>
    <button className="dialog-close" autoFocus onClick={onClose} aria-label="关闭详情">×</button>
    <p className="eyebrow">展开档案</p><h2 id="dialog-title">{card.title}</h2><p>{card.detail}</p>
    <ul className="tags">{card.meta.map((tag) => <li key={tag}>{tag}</li>)}</ul>
  </dialog>
}

function GalleryCard({ card, index, onOpen }: { card: Card; index: number; onOpen: (button: HTMLButtonElement) => void }) {
  return <article className="card" style={{ '--i': index } as CSSProperties}>
    {card.image && <img src={asset(card.image)} alt="" loading="lazy"/>}
    <div><p className="card-index">{card.id}</p><h3>{card.title}</h3><p>{card.summary}</p></div>
    <button onClick={(event) => onOpen(event.currentTarget)} aria-label={`查看 ${card.title} 详情`}>查看详情 <span aria-hidden="true">↗</span></button>
  </article>
}

function GallerySectionView({ section, index, onSelect }: { section: GallerySection; index: number; onSelect: (card: Card, button: HTMLButtonElement) => void }) {
  return <GalleryWall id={section.id} index={index} art={<Geometry scene={section.scene}/>}>
    <header className="painting-head">
      <p className="eyebrow">{section.eyebrow}</p>
      <h2>{section.title}</h2>
    </header>
    <div className="cards">{section.cards.map((card, cardIndex) => <GalleryCard key={card.id} card={card} index={cardIndex} onOpen={(button) => onSelect(card, button)}/>)}</div>
  </GalleryWall>
}

export default function App() {
  const [selected, setSelected] = useState<Card | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const outro = useReveal<HTMLDivElement>()
  const close = () => { setSelected(null); queueMicrotask(() => opener.current?.focus()) }
  const open = (card: Card, button: HTMLButtonElement) => { opener.current = button; setSelected(card) }

  return <>
    <header className="site-header"><div className="container header-inner">
      <a className="brand" href="#intro">{content.site.displayName}</a>
      <nav aria-label="章节导航">{content.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav>
    </div></header>
    <main>
      <ScrollExpand
        id="intro"
        className="hero"
        src={heroMedia}
        alt="克莱因蓝几何构成"
        title={<h1>你好，我是<br/><em>{content.site.displayName}</em></h1>}
        scrollHint="滚动展开"
        startWidth={56}
        startHeight={62}
        startRadius={32}
        endRadius={0}
        mediaZoom={1.28}
        scrollDistance={1.15}
        holdDistance={0.3}
        smoothing={0.09}
        overlayScrim={0.55}
        useWindowScroll
      >
        <p className="eyebrow">Personal archive / 2026</p>
        <p className="hero-lede">{content.site.intro}</p>
        <a className="hero-cta" href="#education">开始探索 <span aria-hidden="true">↓</span></a>
      </ScrollExpand>
      {content.sections.map((section, index) => <GallerySectionView key={section.id} section={section} index={index} onSelect={open}/>)}
      <section id="outro" className="outro"><div className="container"><Geometry scene="resolve"/><div ref={outro} className="outro-content" data-reveal><p className="eyebrow">04 / Continue</p><h2>{content.site.closing}</h2><p>{content.site.closingText}</p><div className="contacts">{content.contacts.map((contact) => <a key={contact.label} href={contact.href}>{contact.label} ↗</a>)}</div></div></div></section>
    </main>
    {selected && <CardDialog card={selected} onClose={close}/>}<footer><div className="container footer-inner"><span>© 2026 · {content.site.displayName}</span><span>Edit content in src/content.ts</span></div></footer>
  </>
}
