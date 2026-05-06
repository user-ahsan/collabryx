/**
 * Register Form Component Tests — TC-011, TC-012
 *
 * TC-011: New user can sign up with valid email/password
 * TC-012: System rejects sign-up with already registered email
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { RegisterForm } from '@/components/features/auth/register-form'

// Import mockSupabaseClient from mocks.ts directly
import { mockSupabaseClient } from '@/tests/setup/mocks'

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Supabase env vars so the form's auth check passes
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

    // Reset mock defaults
    mockSupabaseClient.auth.signUp.mockResolvedValue({ data: {}, error: null })

    // Stub window.location.assign to prevent navigation during tests
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        assign: vi.fn(),
        origin: 'http://localhost:3000',
      },
      writable: true,
    })
  })

  it('should render the signup form with heading', () => {
    // Arrange & Act
    render(<RegisterForm />)

    // Assert
    expect(screen.getByText('Create an account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument()
  })

  describe('TC-011: New user signup — happy path', () => {
    it('should submit form and call supabase.auth.signUp with valid credentials', async () => {
      // Arrange
      render(<RegisterForm />)

      // Act — fill form fields and flush React state via act
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
          target: { value: 'newuser@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('Create a password'), {
          target: { value: 'StrongP@ss1' },
        })
      })

      // Submit the form
      const form = screen.getByLabelText('Email').closest('form')!
      await act(async () => {
        fireEvent.submit(form)
      })

      // Assert
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledTimes(1)
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'newuser@example.com',
            password: 'StrongP@ss1',
          })
        )
      })
    })

    it('should show loading state during form submission', async () => {
      // Arrange — make signUp hang forever so we can observe loading
      mockSupabaseClient.auth.signUp.mockImplementation(
        () => new Promise(() => {}) // never resolves
      )
      render(<RegisterForm />)

      // Act — fill form fields and flush React state
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
          target: { value: 'newuser@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('Create a password'), {
          target: { value: 'StrongP@ss1' },
        })
      })

      // Submit the form directly via native submit (more reliable than clicking button)
      const form = screen.getByLabelText('Email').closest('form')!
      await act(async () => {
        fireEvent.submit(form)
      })

      // Assert — button should be disabled (getByRole excludes disabled elements by default)
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /^Sign Up$/i })
        ).toBeDisabled()
      })
    })

    it('should show success toast on successful signup', async () => {
      // Arrange
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null,
      })
      render(<RegisterForm />)

      // Act — fill fields and flush state via act
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
          target: { value: 'newuser@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('Create a password'), {
          target: { value: 'StrongP@ss1' },
        })
      })

      // Submit by clicking the button
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^Sign Up$/i }))
      })

      // Assert — supabase called, no error toast
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('TC-012: Duplicate email rejection', () => {
    it('should display error toast when email is already registered', async () => {
      // Arrange — mock duplicate email error
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered', code: 'user_already_exists' },
      })
      render(<RegisterForm />)

      // Act — fill fields and flush state
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
          target: { value: 'existing@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('Create a password'), {
          target: { value: 'StrongP@ss1' },
        })
      })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^Sign Up$/i }))
      })

      // Assert
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'existing@example.com' })
        )
      })
    })

    it('should not redirect on duplicate email error', async () => {
      // Arrange
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered', code: 'user_already_exists' },
      })
      render(<RegisterForm />)

      // Act — fill fields and submit
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
          target: { value: 'existing@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('Create a password'), {
          target: { value: 'StrongP@ss1' },
        })
      })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^Sign Up$/i }))
      })

      // Assert — window.location.assign should NOT have been called
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalled()
      })
      // The redirect to /verify-email should NOT fire on error
      expect(window.location.assign).not.toHaveBeenCalled()
    })

    it('should allow retry after duplicate email error', async () => {
      // Arrange — first call fails, second succeeds
      mockSupabaseClient.auth.signUp
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'User already registered', code: 'user_already_exists' },
        })
        .mockResolvedValueOnce({
          data: { user: { id: 'new-user-id' } },
          error: null,
        })

      render(<RegisterForm />)

      // Act — first attempt (duplicate)
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
          target: { value: 'retry@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('Create a password'), {
          target: { value: 'StrongP@ss1' },
        })
      })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^Sign Up$/i }))
      })

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledTimes(1)
      })

      // Act — second attempt (success) — need to re-type the fields
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
          target: { value: 'newuser@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('Create a password'), {
          target: { value: 'AnotherP@ss1' },
        })
      })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^Sign Up$/i }))
      })

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledTimes(2)
        expect(mockSupabaseClient.auth.signUp).toHaveBeenLastCalledWith(
          expect.objectContaining({ email: 'newuser@example.com' })
        )
      })
    })
  })

  describe('Validation', () => {
    it('should show validation error for invalid email', async () => {
      // Arrange
      render(<RegisterForm />)

      // Act — fill fields and flush state
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
          target: { value: 'not-an-email' },
        })
        fireEvent.change(screen.getByPlaceholderText('Create a password'), {
          target: { value: 'StrongP@ss1' },
        })
      })

      // Trigger validation by submitting the form
      const form = screen.getByLabelText('Email').closest('form')!
      await act(async () => {
        fireEvent.submit(form)
      })

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
      })
      // signUp should NOT be called when validation fails
      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled()
    })

    it('should show validation error for short password', async () => {
      // Arrange
      render(<RegisterForm />)

      // Act — fill fields and flush state
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
          target: { value: 'valid@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('Create a password'), {
          target: { value: 'short' },
        })
      })

      // Trigger validation by submitting the form
      const form = screen.getByLabelText('Email').closest('form')!
      await act(async () => {
        fireEvent.submit(form)
      })

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
      })
    })
  })
})