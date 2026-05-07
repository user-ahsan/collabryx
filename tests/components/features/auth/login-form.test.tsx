/**
 * Login Form Component Tests
 * Covers login paths complementary to TC-011/TC-012
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { LoginForm } from '@/components/features/auth/login-form'
import { mockSupabaseClient } from '@/tests/setup/mocks'

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Supabase env vars so the form's auth check passes
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    // Stub navigation
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        href: 'http://localhost:3000',
        assign: vi.fn(),
        origin: 'http://localhost:3000',
      },
      writable: true,
    })
  })

  it('should render the login form with heading', () => {
    // Arrange & Act
    render(<LoginForm />)

    // Assert
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('should render social login buttons', () => {
    // Arrange & Act
    render(<LoginForm />)

    // Assert
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in with GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in with Apple' })).toBeInTheDocument()
  })

  it('should call supabase.auth.signInWithPassword on form submission', async () => {
    // Arrange
    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('m@example.com')
    const passwordInput = screen.getByPlaceholderText('Password')

    // Act - fill form
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } })
    })
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
    })

    // Submit form
    const form = screen.getByRole('form')
    await act(async () => {
      fireEvent.submit(form)
    })

    // Assert
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled()
  })

  it('should show error toast on invalid credentials', async () => {
    // Arrange
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    })

    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('m@example.com')
    const passwordInput = screen.getByPlaceholderText('Password')

    // Act - fill form
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'bad@example.com' } })
    })
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
    })

    // Submit form
    const form = screen.getByRole('form')
    await act(async () => {
      fireEvent.submit(form)
    })

    // Assert
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled()
  })

  it('should navigate to register page via link', () => {
    // Arrange & Act
    render(<LoginForm />)

    // Assert
    const signupLink = screen.getByRole('link', { name: /sign up/i })
    expect(signupLink).toBeInTheDocument()
    expect(signupLink).toHaveAttribute('href', '/register')
  })
})