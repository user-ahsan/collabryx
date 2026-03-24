 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StepBasicInfo } from '@/components/features/onboarding/step-basic-info'
import { FormProvider, useForm } from 'react-hook-form'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

const createWrapper = (defaultValues: any = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({
      defaultValues: {
        fullName: '',
        displayName: '',
        headline: '',
        location: '',
        ...defaultValues,
      },
    })
    
    return <FormProvider {...methods}>{children}</FormProvider>
  }
  
  return Wrapper
}

describe('StepBasicInfo Component', () => {
  const defaultProps = {
    userName: 'TestUser',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all form fields', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo {...defaultProps} />
      </Wrapper>
    )

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/headline/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
  })

  it('should pre-fill full name with userName prop', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo userName="John Doe" />
      </Wrapper>
    )

    const fullNameInput = screen.getByLabelText(/full name/i) as HTMLInputElement
    expect(fullNameInput.value).toBe('John Doe')
  })

  it('should show required indicators for mandatory fields', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo {...defaultProps} />
      </Wrapper>
    )

    const requiredAsterisks = screen.getAllByText('*')
    expect(requiredAsterisks.length).toBeGreaterThanOrEqual(2) // Full name and headline
  })

  // Note: Validation errors depend on form context state which is tested in unit tests
  // These component tests focus on rendering and structure

  it('should have proper ARIA attributes for accessibility', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo {...defaultProps} />
      </Wrapper>
    )

    const fullNameInput = screen.getByLabelText(/full name/i)
    expect(fullNameInput).toHaveAttribute('aria-required', 'true')
  })

  it('should have hint text for display name', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo {...defaultProps} />
      </Wrapper>
    )

    // Hint should be present but visually hidden (sr-only)
    const hintElement = screen.getByText(/display name can only contain lowercase/i)
    expect(hintElement).toHaveClass('sr-only')
  })

  it('should have hint text for location format', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo {...defaultProps} />
      </Wrapper>
    )

    expect(screen.getByText('Format: City, State or City, Country')).toBeInTheDocument()
  })

  it('should have proper placeholder text', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo {...defaultProps} />
      </Wrapper>
    )

    expect(screen.getByPlaceholderText(/e\.g\. john doe/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/johndoe/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e\.g\. full stack developer/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e\.g\. san francisco/i)).toBeInTheDocument()
  })

  it('should apply glass styling to inputs', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo {...defaultProps} />
      </Wrapper>
    )

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      // Check for glass-related classes (backdrop-blur, bg-background/40, etc.)
      expect(input.className).toContain('backdrop-blur')
      expect(input.className).toContain('bg-background/40')
    })
  })

  it('should show error styling when validation fails', async () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo {...defaultProps} />
      </Wrapper>
    )

    const fullNameInput = screen.getByLabelText(/full name/i)
    fireEvent.change(fullNameInput, { target: { value: '' } })
    fireEvent.blur(fullNameInput)

    await waitFor(() => {
      expect(fullNameInput.className).toContain('border-destructive')
    })
  })

  it('should have proper heading structure', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo {...defaultProps} />
      </Wrapper>
    )

    const heading = screen.getByRole('heading', { name: /hey testuser/i })
    expect(heading).toBeInTheDocument()
  })

  it('should include user name in greeting when provided', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo userName="Alice" />
      </Wrapper>
    )

    expect(screen.getByText(/hey alice!/i)).toBeInTheDocument()
  })

  it('should show generic greeting when userName not provided', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo />
      </Wrapper>
    )

    expect(screen.getByText(/hey!/i)).toBeInTheDocument()
  })

  it('should have proper description text', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepBasicInfo {...defaultProps} />
      </Wrapper>
    )

    expect(screen.getByText(/kindly fill in the following/i)).toBeInTheDocument()
  })
})
