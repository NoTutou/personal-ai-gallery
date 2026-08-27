import { useRef, useState } from 'react'
import Corridor from './components/Corridor'
import { About, awardCardItems, Faq, ItemSection, projectItems, SiteFooter, SiteHeader, studioCardItems, type CardItem } from './components/sections'
import { PaperDialog, SketchDefs, useReveal, type DialogItem } from './components/sketch'

export default function App() {
  const [selected, setSelected] = useState<DialogItem | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const close = () => { setSelected(null); queueMicrotask(() => opener.current?.focus()) }
  const open = (item: CardItem, button: HTMLButtonElement) => { opener.current = button; setSelected(item.dialog) }
  const outro = useReveal<HTMLDivElement>()

  return <>
    <SketchDefs />
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
