import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import App from './App'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    if (this.hasAttribute('open')) throw new DOMException('Dialog is already open as non-modal')
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})

describe('sketch corridor portfolio', () => {
  it('renders the hero sign, corridor doors and all five rooms', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: '你的名字' })).toBeInTheDocument()
    for (const title of ['关于我', '项目作品', '工作室动态', '奖项与证书', '常见问题']) {
      expect(screen.getAllByRole('heading', { name: title }).length).toBeGreaterThan(0)
    }
    // 走廊里的门导航到五个房间
    for (const href of ['#about', '#projects', '#studio', '#awards', '#faq']) {
      expect(document.querySelector(`a[href="${href}"]`)).toBeInTheDocument()
    }
  })

  it('opens a project card by keyboard, closes with Escape, and returns focus', async () => {
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
  })

  it('toggles FAQ accordion entries', async () => {
    const user = userEvent.setup()
    render(<App />)
    const first = screen.getAllByRole('group')[0]
    expect(first).not.toHaveAttribute('open')
    await user.click(first.querySelector('summary')!)
    expect(first).toHaveAttribute('open')
    expect(screen.getByText(/写下你的工作哲学和方法/)).toBeVisible()
  })

  it('shows every room immediately when reduced motion is preferred', () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)', media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(),
      removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }))
    render(<App />)
    const revealed = document.querySelectorAll('[data-reveal].is-visible')
    expect(revealed.length).toBe(document.querySelectorAll('[data-reveal]').length)
  })
})
