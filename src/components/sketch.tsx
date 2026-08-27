import { useEffect, useRef, type ReactNode } from 'react'
import type { DoodleKey } from '../content'

// 铅笔线抖动滤镜：全站共享，手绘感的来源
export function SketchDefs() {
  return <svg className="sketch-defs" aria-hidden="true" focusable="false" width="0" height="0">
    <defs>
      <filter id="pencil-a"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="4" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.5"/></filter>
      <filter id="pencil-b"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="4" seed="23" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4.5"/></filter>
      <filter id="pencil-c"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="41" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.5"/></filter>
    </defs>
  </svg>
}

// 滚动进入视口时加 is-visible；偏好减少动画时直接可见
export function useReveal<T extends HTMLElement>() {
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

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useReveal<HTMLDivElement>()
  return <div ref={ref} className={className} data-reveal="">{children}</div>
}

const paths: Record<DoodleKey, ReactNode> = {
  camera: <>
    <path d="M8 18c-1-6 1-11 5-12l3 3h8l2-3c4 2 6 7 5 12-1 5-5 8-11 8s-11-3-12-8z" fill="none"/>
    <circle cx="24" cy="20" r="5.5" fill="none"/><circle cx="24" cy="20" r="2" fill="none"/>
    <circle cx="35" cy="14" r="1.2"/><path d="M14 13l4 3" fill="none"/>
  </>,
  game: <>
    <path d="M10 24c-3-1-6 2-5 6 1 3 4 4 6 2l3-4h20l3 4c2 2 5 1 6-2 1-4-2-7-5-6-4-3-24-3-28 0z" fill="none"/>
    <path d="M16 28v6M13 31h6" fill="none"/><circle cx="31" cy="29" r="1.4"/><circle cx="35" cy="32" r="1.4"/>
  </>,
  wave: <>
    <path d="M4 24c3-8 6-8 9 0s6 8 9 0 6-8 9 0 6 8 9 0" fill="none"/>
    <path d="M10 34v4M18 32v7M26 34v4M34 32v7M42 34v4" fill="none"/>
  </>,
  grid: <>
    <rect x="6" y="8" width="14" height="12" rx="2" fill="none"/><rect x="26" y="8" width="16" height="6" rx="2" fill="none"/>
    <rect x="6" y="26" width="10" height="12" rx="2" fill="none"/><rect x="22" y="20" width="20" height="18" rx="2" fill="none"/>
    <path d="M13 14h.01M27 11h14M10 32h2M28 25l6 5" fill="none"/>
  </>,
  pen: <>
    <path d="M8 40l3-9L34 8c2-2 5-2 7 0s2 5 0 7L18 37l-10 3z" fill="none"/>
    <path d="M31 11l6 6" fill="none"/><path d="M8 40l5 1" fill="none"/>
    <path d="M40 12c2 1 3 3 2 5" fill="none"/>
  </>,
  play: <>
    <rect x="6" y="10" width="36" height="26" rx="6" fill="none"/>
    <path d="M21 18l11 5-11 5V18z" fill="none"/><path d="M15 40l-2 4M33 40l2 4" fill="none"/>
  </>,
  share: <>
    <circle cx="12" cy="24" r="5" fill="none"/><circle cx="36" cy="12" r="5" fill="none"/><circle cx="36" cy="36" r="5" fill="none"/>
    <path d="M16 21l16-7M16 27l16 7" fill="none"/>
  </>,
  rss: <>
    <path d="M10 14c14 0 24 10 24 24" fill="none"/><path d="M10 24c8 0 14 6 14 14" fill="none"/>
    <circle cx="13" cy="35" r="2.5" fill="none"/>
  </>,
  photo: <>
    <path d="M6 14c0-2 2-4 4-4h6l3-4h10l3 4h6c2 0 4 2 4 4v22c0 2-2 4-4 4H10c-2 0-4-2-4-4V14z" fill="none"/>
    <circle cx="24" cy="26" r="7" fill="none"/><path d="M35 15h.01" fill="none"/>
  </>,
  phone: <>
    <rect x="14" y="5" width="20" height="38" rx="5" fill="none"/><path d="M22 39h4" fill="none"/>
    <path d="M21 17l6 4-6 4v-8z" fill="none"/>
  </>,
  medal: <>
    <circle cx="24" cy="28" r="11" fill="none"/><path d="M24 21l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7L24 21z" fill="none"/>
    <path d="M15 14L10 4M33 14l5-10" fill="none"/>
  </>,
  ribbon: <>
    <circle cx="24" cy="20" r="11" fill="none"/><path d="M18 30l-6 14 7-4 5 6 5-6 7 4-6-14" fill="none"/>
    <path d="M18 20c2-3 4-4 6-4s4 1 6 4" fill="none"/>
  </>,
  avatar: <>
    <circle cx="24" cy="24" r="19" fill="none"/>
    <path d="M12 26c0-9 5-14 12-14s12 5 12 14" fill="none"/>
    <circle cx="18" cy="26" r="1.4"/><circle cx="30" cy="26" r="1.4"/>
    <path d="M16 22c2-1 4-1 5 0M27 22c2-1 4-1 5 0" fill="none"/>
    <path d="M20 32c2 2 6 2 8 0" fill="none"/>
    <path d="M24 40v-4" fill="none"/>
  </>,
}

export function Doodle({ name, className, title }: { name: DoodleKey; className?: string; title?: string }) {
  return <svg viewBox="0 0 48 48" className={`doodle${className ? ` ${className}` : ''}`} role={title ? 'img' : 'presentation'} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
    <g filter="url(#pencil-c)">{paths[name]}</g>
  </svg>
}

export type DialogItem = {
  eyebrow: string
  title: string
  paragraphs: string[]
  tags?: string[]
  link?: { href: string; label: string }
}

export function PaperDialog({ item, onClose }: { item: DialogItem; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialog.current?.showModal?.()
    document.body.classList.add('dialog-open')
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', escape)
    return () => { document.body.classList.remove('dialog-open'); document.removeEventListener('keydown', escape) }
  }, [onClose])
  return <dialog ref={dialog} className="paper-dialog" aria-labelledby="paper-dialog-title"
    onCancel={(event) => { event.preventDefault(); onClose() }}
    onClick={(event) => { if (event.target === dialog.current) onClose() }}>
    <button className="dialog-close" autoFocus onClick={onClose} aria-label="关闭详情">×</button>
    <p className="eyebrow">{item.eyebrow}</p>
    <h2 id="paper-dialog-title">{item.title}</h2>
    {item.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    {item.tags && item.tags.length > 0 && <ul className="tags">{item.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
    {item.link && <a className="btn-sketch btn-sketch--accent" href={item.link.href} target={item.link.href.startsWith('#') ? undefined : '_blank'} rel="noreferrer">{item.link.label} ↗</a>}
  </dialog>
}
