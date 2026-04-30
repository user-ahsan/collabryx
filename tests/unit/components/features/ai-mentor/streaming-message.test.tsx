import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StreamingMessage } from '@/components/features/ai-mentor/streaming-message'

describe('StreamingMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with content', () => {
    render(<StreamingMessage content="Hello, world!" />)
    expect(screen.getByText('Hello, world!')).toBeInTheDocument()
  })

  it('shows cursor when streaming', () => {
    const { container } = render(<StreamingMessage content="Loading..." isStreaming={true} />)
    const cursor = container.querySelector('.animate-pulse')
    expect(cursor).toBeInTheDocument()
  })

  it('hides cursor when done streaming', () => {
    const { container } = render(<StreamingMessage content="Done!" isStreaming={false} />)
    const cursors = container.querySelectorAll('.animate-pulse')
    expect(cursors.length).toBe(0)
  })

  it('displays AI sender with bot icon', () => {
    const { container } = render(<StreamingMessage content="I am an AI" sender="ai" />)
    const botIcon = container.querySelector('svg')
    expect(botIcon).toBeInTheDocument()
  })

  it('displays timestamp when provided', () => {
    const timestamp = new Date('2024-01-15T10:30:00')
    render(<StreamingMessage content="Test" timestamp={timestamp} />)
    expect(screen.getByText('10:30:00 AM')).toBeInTheDocument()
  })

  it('applies user styling when sender is user', () => {
    const { container } = render(<StreamingMessage content="User message" sender="user" />)
    const userMessage = container.querySelector('.bg-primary')
    expect(userMessage).toBeInTheDocument()
  })

  it('applies AI styling when sender is ai', () => {
    const { container } = render(<StreamingMessage content="AI message" sender="ai" />)
    const aiMessage = container.querySelector('.bg-muted')
    expect(aiMessage).toBeInTheDocument()
  })
})