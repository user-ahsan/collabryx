import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { GlassCard } from '@/components/shared/glass-card'

describe('GlassCard', () => {
  it('should render children', () => {
    const { getByText } = render(
      <GlassCard>
        <div>Test Content</div>
      </GlassCard>
    )

    expect(getByText('Test Content')).toBeDefined()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <GlassCard className="custom-class">
        <div>Test</div>
      </GlassCard>
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should apply hoverable effect when enabled', () => {
    const { container } = render(
      <GlassCard hoverable>
        <div>Test</div>
      </GlassCard>
    )

    expect(container.firstChild).toHaveClass('group')
  })

  it('should handle onClick when provided', () => {
    const handleClick = vi.fn()
    const { container } = render(
      <GlassCard onClick={handleClick}>
        <div>Test</div>
      </GlassCard>
    )

    container.firstChild?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(handleClick).toHaveBeenCalled()
  })
})
