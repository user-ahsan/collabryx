/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProfileCard } from '@/components/features/dashboard/profile-card'

// Mock GlassCard
vi.mock('@/components/shared/glass-card', () => ({
  GlassCard: ({ children }: any) => (
    <div data-testid="glass-card">{children}</div>
  ),
}))

// Mock next/image Avatar
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => (
    <div data-testid="avatar" className={className}>{children}</div>
  ),
  AvatarFallback: ({ children, className }: any) => (
    <span data-testid="avatar-fallback" className={className}>{children}</span>
  ),
  AvatarImage: ({ src, alt }: any) => (
    <div data-testid="avatar-image" src={src} alt={alt} />
  ),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a data-testid="link" href={href} className={className}>{children}</a>
  ),
}))

// Mock Separator
vi.mock('@/components/ui/separator', () => ({
  Separator: ({ className }: any) => (
    <hr data-testid="separator" className={className} />
  ),
}))

// Mock lucide-react icons
// Note: profile-card imports "Link" as "LinkIcon"
vi.mock('lucide-react', () => ({
  MapPin: ({ className }: any) => <svg data-testid="icon-mappin" className={className} />,
  Link: ({ className }: any) => <svg data-testid="icon-link" className={className} />,
  Eye: ({ className }: any) => <svg data-testid="icon-eye" className={className} />,
  Users: ({ className }: any) => <svg data-testid="icon-users" className={className} />,
}))

describe('ProfileCard Component (TC-026, TC-029)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering (TC-029 - Public Profile View)', () => {
    it('should render user display name', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByText('Sophie Chen')).toBeInTheDocument()
    })

    it('should render user headline', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByText(/frontend architect/i)).toBeInTheDocument()
    })

    it('should render location', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
    })

    it('should render website link', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByText('github.com/sophie')).toBeInTheDocument()
    })

    it('should render avatar with fallback initials', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByTestId('avatar')).toBeInTheDocument()
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('SC')
    })

    it('should show profile views count', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByText('1,234')).toBeInTheDocument()
      expect(screen.getByText(/profile views/i)).toBeInTheDocument()
    })

    it('should show connections count', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByText('567')).toBeInTheDocument()
      expect(screen.getByText(/connections/i)).toBeInTheDocument()
    })
  })

  describe('Public Profile Safety (TC-029)', () => {
    it('should NOT expose email address', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.queryByText(/@/)).toBeNull()
    })

    it('should NOT expose private settings', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.queryByText(/settings/i)).toBeNull()
      expect(screen.queryByText(/account/i)).toBeNull()
    })

    it('should only show publicly viewable profile information', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      // Public fields: name, headline, location, website, avatar, profile views, connections
      expect(screen.getByText('Sophie Chen')).toBeInTheDocument()
      expect(screen.getByText(/frontend architect/i)).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()

      // Private fields should not appear
      expect(screen.queryByText(/password/i)).toBeNull()
      expect(screen.queryByText(/delete/i)).toBeNull()
    })

    it('should render a separator between profile info and stats', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByTestId('separator')).toBeInTheDocument()
    })

    it('should have clickable website link', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      const link = screen.getByTestId('link')
      expect(link).toBeInTheDocument()
    })
  })

  describe('UI Structure', () => {
    it('should render inside a GlassCard', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByTestId('glass-card')).toBeInTheDocument()
    })

    it('should render gradient banner', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      const banner = document.querySelector('.bg-gradient-to-r')
      expect(banner).toBeInTheDocument()
    })

    it('should use responsive sizing classes', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      const avatar = screen.getByTestId('avatar')
      expect(avatar).toHaveClass('h-16', 'sm:h-20')
    })
  })

  describe('Icons Rendering', () => {
    it('should render MapPin icon for location', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByTestId('icon-mappin')).toBeInTheDocument()
    })

    it('should render LinkIcon for website', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByTestId('icon-link')).toBeInTheDocument()
    })

    it('should render Eye icon for profile views', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByTestId('icon-eye')).toBeInTheDocument()
    })

    it('should render Users icon for connections', () => {
      // Arrange
      // Act
      render(<ProfileCard />)

      // Assert
      expect(screen.getByTestId('icon-users')).toBeInTheDocument()
    })
  })
})
