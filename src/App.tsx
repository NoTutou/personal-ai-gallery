import { useEffect, useRef, useState } from 'react'
import { content, type Card, type GallerySection } from './content'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

function Geometry({ scene }: { scene: string }) {
  return <div className={`geometry geometry--${scene}`} aria-hidden="true"><i/><i/><i/></div>
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

function GalleryCard({ card, onOpen }: { card: Card; onOpen: (button: HTMLButtonElement) => void }) {
  return <article className="card">
    {card.image && <img src={asset(card.image)} alt="" loading="lazy"/>}
    <div><p className="card-index">{card.id}</p><h3>{card.title}</h3><p>{card.summary}</p></div>
    <button onClick={(event) => onOpen(event.currentTarget)} aria-label={`查看 ${card.title} 详情`}>查看详情 <span aria-hidden="true">↗</span></button>
  </article>
}

function GallerySectionView({ section, onSelect }: { section: GallerySection; onSelect: (card: Card, button: HTMLButtonElement) => void }) {
  return <section id={section.id} className="gallery-section" data-scene={section.scene}>
    <div className="stage"><Geometry scene={section.scene}/><div className="section-heading"><p className="eyebrow">{section.eyebrow}</p><h2>{section.title}</h2></div></div>
    <div className="cards">{section.cards.map((card) => <GalleryCard key={card.id} card={card} onOpen={(button) => onSelect(card, button)}/>)}</div>
  </section>
}

export default function App() {
  const [selected, setSelected] = useState<Card | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const close = () => { setSelected(null); queueMicrotask(() => opener.current?.focus()) }
  const open = (card: Card, button: HTMLButtonElement) => { opener.current = button; setSelected(card) }

  return <>
    <header><a className="brand" href="#intro">{content.site.displayName}</a><nav aria-label="章节导航">{content.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav></header>
    <main>
      <section id="intro" className="hero"><Geometry scene="intro"/><p className="eyebrow">Personal archive / 2026</p><h1>你好，我是<br/><em>{content.site.displayName}</em></h1><p className="lede">{content.site.intro}</p><a className="scroll-cue" href="#education">向下探索 <span aria-hidden="true">↓</span></a></section>
      {content.sections.map((section) => <GallerySectionView key={section.id} section={section} onSelect={open}/>)}
      <section id="outro" className="outro"><Geometry scene="resolve"/><p className="eyebrow">04 / Continue</p><h2>{content.site.closing}</h2><p>{content.site.closingText}</p><div className="contacts">{content.contacts.map((contact) => <a key={contact.label} href={contact.href}>{contact.label} ↗</a>)}</div></section>
    </main>
    {selected && <CardDialog card={selected} onClose={close}/>}<footer>© 2026 · Edit content in src/content.ts</footer>
  </>
}
