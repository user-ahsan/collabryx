/**
 * TC-057: Match Card and Why-Match Modal Tests
 *
 * Tests that match cards display "Why you matched" tags
 * and the WhyMatchModal shows detailed match breakdown.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchCard } from '@/components/features/matches/match-card'
import { WhyMatchModal } from '@/components/features/matches/why-match-modal'

// Mock  imports
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/shared/glass-card', () => ({
  GlassCard: ({ children, innerClassName, onClick, className }: {
    children: React.ReactNode
    innerClassName?: string
    onClick?: () => void
    className?: string
    hoverable?: boolean
  }) => (
    <div className={className} data-testid="glass-card">
      <div className={innerClassName} onClick={onClick}>
        {children}
      </div>
    </div>
  ),
}))

vi.mock('@/components/shared/match-score', () => ({
  MatchScoreCompact: ({ overall }: { overall: number }) => (
    <div data-testid="match-score">{overall}%</div>
  ),
}))

vi.mock('@/components/ui/match-reason-badge', () => ({
  MatchReasonBadge: ({ type, label, className }: { type: string; label: string; className?: string }) => (
    <span data-testid="match-reason-badge" data-type={type} className={className}>
      {label}
    </span>
  ),
}))

vi.mock('@/components/shared/glass-dropdown-menu', () => ({
  MatchCardDropdown: () => <div data-testid="match-dropdown" />,
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="avatar">{children}</div>
  ),
  AvatarImage: ({ src, alt }: { src: string; alt: string }) => <div data-testid="avatar-image" src={src} alt={alt} />,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, className, onClick }: {
    children: React.ReactNode
    variant?: string
    className?: string
    onClick?: (e: React.MouseEvent) => void
  }) => (
    <button className={className} onClick={onClick} data-variant={variant}>{children}</button>
  ),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
  DialogDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p className={className}>{children}</p>
  ),
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress" data-value={value} className={className} />
  ),
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="alert">{children}</div>
  ),
  AlertDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

const defaultMatch = {
  id: 'match-1',
  name: 'Jane Smith',
  role: 'Full Stack Developer',
  avatar: '/avatars/jane.png',
  compatibility: 92,
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
  bio: 'Passionate about building scalable web applications',
  location: 'San Francisco',
  availability: 'full-time' as const,
  insights: [
    { type: 'complementary' as const, text: 'Backend expertise complements your frontend skills' },
    { type: 'shared' as const, text: 'Shared Interest in Startups' },
    { type: 'similar' as const, text: 'Similar stage: MVP development' },
  ],
  aiConfidence: 0.93,
  aiExplanation: 'Strong skill overlap and complementary strengths',
}

describe('TC-057: MatchCard - Why You Matched Tags', () => {
  it('renders match insights as reason badges', () => {
    // Arrange & Act
    render(<MatchCard match={defaultMatch} />)

    // Assert — the first insight should render as a badge
    const badges = screen.getAllByTestId('match-reason-badge')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('displays the first insight text in a MatchReasonBadge', () => {
    // Arrange & Act
    render(<MatchCard match={defaultMatch} />)

    // Assert
    const badge = screen.getByTestId('match-reason-badge')
    expect(badge).toHaveTextContent(defaultMatch.insights[0].text)
  })

  it('shows +N indicator when more than one insight exists', () => {
    // Arrange & Act
    render(<MatchCard match={defaultMatch} />)

    // Assert — with 3 insights, should show "+2"
    const plusMore = screen.getByText('+2')
    expect(plusMore).toBeInTheDocument()
  })

  it('passes correct type to MatchReasonBadge for complementary insights', () => {
    // Arrange & Act
    render(<MatchCard match={defaultMatch} />)

    // Assert
    const badge = screen.getByTestId('match-reason-badge')
    expect(badge).toHaveAttribute('data-type', 'complementary')
  })

  it('renders skill badges for the first 2 skills', () => {
    // Arrange & Act
    render(<MatchCard match={defaultMatch} />)

    // Assert — first 2 skills should be visible
    const skillBadges = screen.getAllByTestId('badge')
    const visibleSkills = skillBadges.filter((b) =>
      ['React', 'TypeScript'].includes(b.textContent || '')
    )
    expect(visibleSkills.length).toBeGreaterThanOrEqual(2)
  })

  it('renders the match compatibility percentage', () => {
    // Arrange & Act
    render(<MatchCard match={defaultMatch} />)

    // Assert
    expect(screen.getByText('92%')).toBeInTheDocument()
  })

  it('shows AI-Powered Match badge for high-confidence matches', () => {
    // Arrange & Act
    render(<MatchCard match={defaultMatch} />)

    // Assert — aiConfidence >= 0.8 triggers the badge
    expect(screen.getByText('AI-Powered Match')).toBeInTheDocument()
  })

  it('does NOT show AI-Powered Match for low-confidence matches', () => {
    // Arrange
    const lowConfidenceMatch = {
      ...defaultMatch,
      aiConfidence: 0.65,
    }

    // Act
    render(<MatchCard match={lowConfidenceMatch} />)

    // Assert
    expect(screen.queryByText('AI-Powered Match')).not.toBeInTheDocument()
  })

  it('renders the user name and role', () => {
    // Arrange & Act
    render(<MatchCard match={defaultMatch} />)

    // Assert
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Full Stack Developer')).toBeInTheDocument()
  })

  it('renders bio text', () => {
    // Arrange & Act
    render(<MatchCard match={defaultMatch} />)

    // Assert
    expect(screen.getByText('Passionate about building scalable web applications')).toBeInTheDocument()
  })

  it('renders location and availability as subtitle', () => {
    // Arrange & Act
    render(<MatchCard match={defaultMatch} />)

    // Assert
    expect(screen.getByText('San Francisco • Full-time')).toBeInTheDocument()
  })

  it('shows a Connect button', () => {
    // Arrange & Act
    render(<MatchCard match={defaultMatch} />)

    // Assert
    expect(screen.getByText('Connect')).toBeInTheDocument()
  })
})

describe('TC-057: WhyMatchModal', () => {
  const modalMatch = {
    name: 'Alice Johnson',
    compatibility: 88,
    skills: ['Python', 'Django', 'AWS', 'Docker', 'Kubernetes'],
    role: 'Backend Engineer',
  }

  it('renders match name and compatibility in the modal', () => {
    // Arrange & Act
    render(<WhyMatchModal open={true} onOpenChange={vi.fn()} match={modalMatch} />)

    // Assert
    expect(screen.getByText('Why Alice Johnson?')).toBeInTheDocument()
    expect(screen.getByText(/88%/)).toBeInTheDocument()
  })

  it('displays skills overlap section with progress bar', () => {
    // Arrange & Act
    render(<WhyMatchModal open={true} onOpenChange={vi.fn()} match={modalMatch} />)

    // Assert
    expect(screen.getByText('Skills Overlap')).toBeInTheDocument()
    const progressBars = screen.getAllByTestId('progress')
    expect(progressBars.length).toBeGreaterThanOrEqual(3)
  })

  it('displays complementary fit section', () => {
    // Arrange & Act
    render(<WhyMatchModal open={true} onOpenChange={vi.fn()} match={modalMatch} />)

    // Assert
    expect(screen.getByText('Complementary Fit')).toBeInTheDocument()
  })

  it('displays shared interests section', () => {
    // Arrange & Act
    render(<WhyMatchModal open={true} onOpenChange={vi.fn()} match={modalMatch} />)

    // Assert
    expect(screen.getByText('Shared Interests')).toBeInTheDocument()
  })

  it('displays AI Confidence metric', () => {
    // Arrange & Act
    render(<WhyMatchModal open={true} onOpenChange={vi.fn()} match={modalMatch} />)

    // Assert
    expect(screen.getByText('AI Confidence:')).toBeInTheDocument()
  })

  it('shows skill badges for the matched user', () => {
    // Arrange & Act
    render(<WhyMatchModal open={true} onOpenChange={vi.fn()} match={modalMatch} />)

    // Assert — first 5 skills should appear as badges
    const skillBadges = screen.getAllByTestId('badge')
    const skillNames = skillBadges.map((b) => b.textContent)
    expect(skillNames).toContain('Python')
    expect(skillNames).toContain('AWS')
  })

  it('does not render when open is false', () => {
    // Arrange & Act
    render(<WhyMatchModal open={false} onOpenChange={vi.fn()} match={modalMatch} />)

    // Assert
    expect(screen.queryByText('Why Alice Johnson?')).not.toBeInTheDocument()
  })

  it('displays "Matched because" explanation text', () => {
    // Arrange & Act
    render(<WhyMatchModal open={true} onOpenChange={vi.fn()} match={modalMatch} />)

    // Assert
    expect(screen.getByText(/Matched because/)).toBeInTheDocument()
  })

  it('shows "How We Calculate Matches" section', () => {
    // Arrange & Act
    render(<WhyMatchModal open={true} onOpenChange={vi.fn()} match={modalMatch} />)

    // Assert
    expect(screen.getByText('How We Calculate Matches')).toBeInTheDocument()
  })
})
