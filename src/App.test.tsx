import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import App from './App'

// __reduced 标志位由各静态测试自行设置；其余一律视为允许动效
const reducedMedia = (query: string) => ({
  matches: (window as unknown as { __reduced?: boolean }).__reduced === true && query === '(prefers-reduced-motion: reduce)',
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    if (this.hasAttribute('open')) throw new DOMException('Dialog is already open as non-modal')
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})

afterEach(() => {
  document.body.classList.remove('walk-mode', 'dialog-open')
  ;(window as unknown as { __reduced?: boolean }).__reduced = false
})

describe('walk experience（默认可动模式）', () => {
  it('renders corridor stage with dock chips for every room and hint', () => {
    render(<App />)
    expect(screen.getByRole('region', { name: /手绘走廊/ })).toBeInTheDocument()
    const dock = screen.getByRole('navigation', { name: /走廊行动与直达房间/ })
    for (const label of ['关于我', '项目作品', '工作室动态', '奖项与证书', '联系 · 终点站']) {
      expect(dock.querySelector(`[data-room]`)?.textContent).toBeDefined()
      expect(Array.from(dock.querySelectorAll('button')).some((b) => b.textContent === label)).toBe(true)
    }
    expect(document.body).toHaveClass('walk-mode')
  })

  it('opens a room from its chip, opens a card dialog inside, ESC back to walk twice', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '项目作品' }))
    const overlay = await screen.findByRole('region', { name: '项目作品' }, { timeout: 3000 })
    expect(overlay).toBeInTheDocument()
    // 房间里复用了卡片与详情弹窗
    await user.click(screen.getAllByRole('button', { name: /查看 .* 详情/ })[0])
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('open')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(overlay).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('region', { name: '项目作品' })).not.toBeInTheDocument(), { timeout: 1500 })
    expect(document.body).toHaveClass('walk-mode')
  })

  it('contact endpoint room contains email CTA and a working FAQ accordion', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '联系 · 终点站' }))
    await screen.findByRole('region', { name: '海边终点 · 联系' }, { timeout: 3000 })
    expect(screen.getByText(/一起做点有趣的东西吧/)).toBeInTheDocument()
    const faq = screen.getAllByRole('group')[0]
    await user.click(faq.querySelector('summary')!)
    expect(faq).toHaveAttribute('open')
    expect(screen.getByText(/写下你的工作哲学和方法/)).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('region', { name: '海边终点 · 联系' })).not.toBeInTheDocument(), { timeout: 1500 })
  })
})

describe('静态回退版（prefers-reduced-motion）', () => {
  it('renders hero sign, corridor doors and all five rooms as one page', () => {
    ;(window as unknown as { __reduced?: boolean }).__reduced = true
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => reducedMedia(q)))
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: '你的名字' })).toBeInTheDocument()
    for (const title of ['关于我', '项目作品', '工作室动态', '奖项与证书', '常见问题']) {
      expect(screen.getAllByRole('heading', { name: title }).length).toBeGreaterThan(0)
    }
    for (const href of ['#about', '#projects', '#studio', '#awards', '#faq']) {
      expect(document.querySelector(`a[href="${href}"]`)).toBeInTheDocument()
    }
    vi.unstubAllGlobals()
  })

  it('shows every room immediately when reduced motion is preferred', () => {
    ;(window as unknown as { __reduced?: boolean }).__reduced = true
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => reducedMedia(q)))
    render(<App />)
    const revealed = document.querySelectorAll('[data-reveal].is-visible')
    expect(revealed.length).toBe(document.querySelectorAll('[data-reveal]').length)
    vi.unstubAllGlobals()
  })

  it('keeps the paper dialog flow intact', async () => {
    ;(window as unknown as { __reduced?: boolean }).__reduced = true
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => reducedMedia(q)))
    const user = userEvent.setup()
    render(<App />)
    const card = screen.getAllByRole('button', { name: /查看 .* 详情/ })[0]
    card.focus()
    await user.keyboard('{Enter}')
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('open')
    expect(screen.getByRole('button', { name: '关闭详情' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(card).toHaveFocus()
    vi.unstubAllGlobals()
  })
})
