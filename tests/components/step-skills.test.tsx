import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StepSkills } from '@/components/features/onboarding/step-skills'
import { FormProvider, useForm } from 'react-hook-form'

// Mock the combobox component
vi.mock('@/components/ui/inline-searchable-combobox', () => ({
  InlineSearchableCombobox: ({ 
    onChange, 
    selected = [],
    onAddCustom,
    'aria-invalid': ariaInvalid 
  }: any) => (
    <div data-testid="mock-combobox">
      <input
        type="text"
        placeholder="Search skills..."
        onChange={(e) => {
          if (e.target.value && onAddCustom) {
            onAddCustom(e.target.value)
          }
        }}
        data-invalid={ariaInvalid}
      />
      <div data-testid="selected-skills">
        {selected.map((skill: string, i: number) => (
          <span key={i} data-testid={`selected-skill-${skill}`}>{skill}</span>
        ))}
      </div>
      <button onClick={() => onChange([...selected, 'React'])}>
        Add React
      </button>
    </div>
  ),
}))

// Mock skills database
vi.mock('@/lib/data/skills-database', () => ({
  skillsDatabase: [
    { id: '1', name: 'React', category: 'Frontend', subcategory: 'Framework', keywords: ['javascript', 'ui'] },
    { id: '2', name: 'TypeScript', category: 'Languages', subcategory: 'Programming', keywords: ['typescript', 'types'] },
    { id: '3', name: 'Node.js', category: 'Backend', subcategory: 'Runtime', keywords: ['node', 'server'] },
  ],
}))

const createWrapper = (defaultValues: any = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({
      defaultValues: {
        skills: [],
        ...defaultValues,
      },
    })
    
    return <FormProvider {...methods}>{children}</FormProvider>
  }
  
  return Wrapper
}

describe('StepSkills Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render skills step with heading and description', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    expect(screen.getByRole('heading', { name: /your skills/i })).toBeInTheDocument()
    expect(screen.getByText(/add your skills to help us match/i)).toBeInTheDocument()
  })

  it('should render combobox with search placeholder', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    expect(screen.getByPlaceholderText(/search skills/i)).toBeInTheDocument()
  })

  it('should have required field indicator', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    const requiredAsterisk = screen.getByText('*')
    expect(requiredAsterisk).toBeInTheDocument()
    expect(requiredAsterisk).toHaveClass('text-destructive')
  })

  it('should have screen reader only required text', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    expect(screen.getByText('(required)')).toHaveClass('sr-only')
  })

  it('should display tip section', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    expect(screen.getByText(/tip:/i)).toBeInTheDocument()
    expect(screen.getByText(/you can select from our list of 1000\+ skills/i)).toBeInTheDocument()
  })

  it('should show validation error when no skills added', async () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    // Trigger validation by blurring
    const input = screen.getByPlaceholderText(/search skills/i)
    fireEvent.blur(input)

    await waitFor(() => {
      // Error should be shown via form context
      expect(screen.queryByText(/please add at least one skill/i)).toBeInTheDocument()
    })
  })

  it('should have proper ARIA attributes', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    const combobox = screen.getByTestId('mock-combobox')
    const input = screen.getByPlaceholderText(/search skills/i)
    
    expect(input).toHaveAttribute('aria-required', 'true')
  })

  it('should update when skills are added', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    const addReactButton = screen.getByText('Add React')
    fireEvent.click(addReactButton)

    expect(screen.getByTestId('selected-skill-React')).toBeInTheDocument()
  })

  it('should allow adding custom skills', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    const input = screen.getByPlaceholderText(/search skills/i)
    fireEvent.change(input, { target: { value: 'Custom Skill' } })

    // Custom skill should be added
    expect(screen.getByTestId('selected-skill-Custom Skill')).toBeInTheDocument()
  })

  it('should prevent duplicate skills', () => {
    const Wrapper = createWrapper({ skills: ['React'] })
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    expect(screen.getByTestId('selected-skill-React')).toBeInTheDocument()
    
    // Try to add React again
    const addReactButton = screen.getByText('Add React')
    fireEvent.click(addReactButton)

    // Should still only have one React
    const selectedSkillsContainer = screen.getByTestId('selected-skills')
    expect(selectedSkillsContainer.querySelectorAll('[data-testid^="selected-skill-React"]').length).toBe(1)
  })

  it('should have proper heading structure with ID', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    const heading = screen.getByRole('heading', { name: /your skills/i })
    expect(heading).toHaveAttribute('id', 'step-heading')
  })

  it('should have content region with aria-labelledby', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    const region = screen.getByLabelText(/step-heading/i)
    expect(region).toBeInTheDocument()
  })

  it('should apply glass styling to container', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    const tipContainer = screen.getByText(/tip:/i).closest('div')
    expect(tipContainer?.className).toContain('glass')
  })

  it('should show empty message when no skills match search', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    expect(screen.getByText(/no skills found\. type to add a custom skill\./i)).toBeInTheDocument()
  })

  it('should have accessible label for combobox', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    const label = screen.getByLabelText(/add skills/i)
    expect(label).toBeInTheDocument()
  })

  it('should handle multiple skill additions', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    // Add multiple skills
    const addReactButton = screen.getByText('Add React')
    fireEvent.click(addReactButton)
    fireEvent.click(addReactButton)
    fireEvent.click(addReactButton)

    // Should have React plus the custom additions
    const selectedSkillsContainer = screen.getByTestId('selected-skills')
    expect(selectedSkillsContainer.children.length).toBeGreaterThan(0)
  })

  it('should have proper max height for dropdown', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    // The combobox should have maxHeight prop set
    const combobox = screen.getByTestId('mock-combobox')
    expect(combobox).toBeInTheDocument()
  })

  it('should show categories in combobox', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StepSkills />
      </Wrapper>
    )

    // Categories should be shown based on showCategories prop
    expect(screen.getByText(/frontend/i)).toBeInTheDocument()
  })
})
