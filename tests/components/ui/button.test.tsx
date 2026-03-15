import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>)

    expect(screen.getByText('Click me')).toBeDefined()
  })

  it('should handle click events', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await userEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)

    expect(screen.getByText('Click me')).toBeDisabled()
  })

  it('should not be disabled when disabled prop is false', () => {
    render(<Button disabled={false}>Click me</Button>)

    expect(screen.getByText('Click me')).not.toBeDisabled()
  })

  it('should apply variant classes', () => {
    const { container: outline } = render(<Button variant="outline">Outline</Button>)
    const { container: ghost } = render(<Button variant="ghost">Ghost</Button>)
    const { container: destructive } = render(<Button variant="destructive">Destructive</Button>)

    expect(outline.firstChild).toHaveClass('border')
    expect(ghost.firstChild).toHaveClass('hover:bg-accent')
    expect(destructive.firstChild).toHaveClass('bg-destructive')
  })

  it('should apply size classes', () => {
    const { container: sm } = render(<Button size="sm">Small</Button>)
    const { container: lg } = render(<Button size="lg">Large</Button>)
    const { container: icon } = render(<Button size="icon">Icon</Button>)

    expect(sm.firstChild).toHaveClass('h-9')
    expect(lg.firstChild).toHaveClass('h-11')
    expect(icon.firstChild).toHaveClass('h-10')
  })
})
