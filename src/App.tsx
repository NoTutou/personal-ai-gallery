import { useCallback, useEffect, useRef, useState } from 'react'
import Corridor from './components/Corridor'
import Walk, { type WalkHandle } from './components/Walk'
import {
  About, awardCardItems, EndpointRoom, Faq, ItemSection,
  projectItems, SiteHeader, SiteFooter, studioCardItems,
  type CardItem, type NavTarget, type RoomId,
} from './components/sections'
import { PaperDialog, SketchDefs, useReveal, type DialogItem } from './components/sketch'

// 减少动态偏好时退回静态长页；偏好变化即时切换
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

const ROOM_TITLES: Record<RoomId, string> = {
  about: '关于我',
  projects: '项目作品',
  studio: '工作室动态',
  awards: '奖项与证书',
  contact: '海边终点 · 联系',
}

export default function App() {
  const reduced = usePrefersReducedMotion()
  return <>
    <SketchDefs />
    {reduced ? <StaticSite /> : <WalkExperience />}
  </>
}

/* ---------- 静态回退版（prefers-reduced-motion） ---------- */
function StaticSite() {
  const [selected, setSelected] = useState<DialogItem | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const close = () => { setSelected(null); queueMicrotask(() => opener.current?.focus()) }
  const open = (item: CardItem, button: HTMLButtonElement) => { opener.current = button; setSelected(item.dialog) }
  const outro = useReveal<HTMLDivElement>()

  return <>
    <SiteHeader />
    <main>
      <Corridor />
      <About />
      <ItemSection id="projects" index="02" eyebrow="Projects · 项目作品" title="项目作品"
        note="四个手绘画框等着换成你的作品 —— 在 src/content.ts 里填标题、介绍和外链。"
        items={projectItems()} onOpen={open} />
      <ItemSection id="studio" index="03" eyebrow="The Studio · 工作室动态" title="工作室动态"
        note="文章、视频、社交动态都挂在这面墙上。"
        items={studioCardItems()} onOpen={open} />
      <ItemSection id="awards" index="04" eyebrow="Awards · 奖项与证书" title="奖项与证书"
        items={awardCardItems()} onOpen={open} />
      <Faq />
      <div ref={outro} className="outro" data-reveal="">
        <p aria-hidden="true" className="outro-dash">· · ·</p>
      </div>
    </main>
    <SiteFooter />
    {selected && <PaperDialog item={selected} onClose={close} />}
  </>
}

/* ---------- 行走体验版：一镜到底走廊 + 全屏房间 ---------- */
function WalkExperience() {
  const [room, setRoom] = useState<RoomId | null>(null)
  const [closing, setClosing] = useState(false)
  const [dialog, setDialog] = useState<DialogItem | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const walkApi = useRef<WalkHandle | null>(null)

  useEffect(() => {
    document.body.classList.add('walk-mode')
    return () => document.body.classList.remove('walk-mode')
  }, [])

  const closeDialog = useCallback(() => {
    setDialog(null)
    queueMicrotask(() => opener.current?.focus())
  }, [])
  const openCard = useCallback((item: CardItem, button: HTMLButtonElement) => {
    opener.current = button
    setDialog(item.dialog)
  }, [])

  const enterRoom = useCallback((id: RoomId) => setRoom(id), [])

  const leaveRoom = useCallback((id: RoomId) => {
    setClosing(true)
    window.setTimeout(() => {
      setRoom(null)
      setClosing(false)
      queueMicrotask(() => {
        (document.querySelector(`.walk-dock [data-room="${id}"]`) as HTMLElement | null)?.focus()
      })
    }, 230)
  }, [])
  const leaveRoomRef = useRef((id: RoomId) => {})
  useEffect(() => { leaveRoomRef.current = leaveRoom }, [leaveRoom])

  const navigate = useCallback((target: NavTarget) => {
    const api = walkApi.current
    if (!api) return
    if (target === 'reset') api.resetToStart()
    else if (!room) api.enterRoom(target)
  }, [room])

  useEffect(() => {
    if (!room || closing) return
    const onKey = (e: KeyboardEvent) => {
      // 详情纸条弹窗打开时由它自己处理 ESC，别把房间一起关了
      if (document.body.classList.contains('dialog-open')) return
      if (e.key === 'Escape') leaveRoomRef.current(room)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [room, closing])

  return <>
    <SiteHeader onNavigate={navigate} />
    <Walk paused={!!room || !!dialog || closing} onEnter={enterRoom}
      onReady={(api) => { walkApi.current = api }} />

    {room && (
      <section className={`room-overlay${closing ? ' is-closing' : ''}`} aria-label={ROOM_TITLES[room]}>
        <header className="room-overlay__bar">
          <button type="button" className="room-overlay__back" autoFocus onClick={() => leaveRoom(room)}>
            ← 回到走廊原位
          </button>
          <strong className="room-overlay__title">{ROOM_TITLES[room]}</strong>
        </header>
        <div className="room-overlay__body">
          {room === 'about' && <About />}
          {room === 'projects' && (
            <ItemSection id="projects-walk" index="02" eyebrow="Projects · 项目作品" title="项目作品"
              note="四个手绘画框等着换成你的作品 —— 在 src/content.ts 里填标题、介绍和外链。"
              items={projectItems()} onOpen={openCard} />
          )}
          {room === 'studio' && (
            <ItemSection id="studio-walk" index="03" eyebrow="The Studio · 工作室动态" title="工作室动态"
              note="文章、视频、社交动态都挂在这面墙上。"
              items={studioCardItems()} onOpen={openCard} />
          )}
          {room === 'awards' && (
            <ItemSection id="awards-walk" index="04" eyebrow="Awards · 奖项与证书" title="奖项与证书"
              items={awardCardItems()} onOpen={openCard} />
          )}
          {room === 'contact' && <EndpointRoom />}
        </div>
      </section>
    )}

    {dialog && <PaperDialog item={dialog} onClose={closeDialog} />}
  </>
}
