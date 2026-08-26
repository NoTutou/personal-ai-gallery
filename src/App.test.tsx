import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'
import App from './App'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    if (this.hasAttribute('open')) throw new DOMException('Dialog is already open as non-modal')
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})

describe('personal gallery', () => {
  it('renders the five-part story and editable gallery content', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /你好，我是/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '教育经历' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '兴趣爱好' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'AI 笔记' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '保持好奇' })).toBeInTheDocument()
  })

  it('opens a card by keyboard, closes with Escape, and returns focus', async () => {
    const user = userEvent.setup()
    render(<App />)
    const card = screen.getByRole('button', { name: /查看 本科 · 示例大学/ })
    card.focus()
    await user.keyboard('{Enter}')
    const dialog = screen.getByRole('dialog', { name: '本科 · 示例大学' })
    expect(dialog).toHaveAttribute('open')
    expect(screen.getByRole('button', { name: '关闭详情' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(card).toHaveFocus()
  })
})
