/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { formatInitials } from '../lib/utils/format-initials'

describe('formatInitials', () => {
  it('should format single name', () => {
    expect(formatInitials('John')).toBe('J')
  })

  it('should format two names', () => {
    expect(formatInitials('John Doe')).toBe('JD')
  })

  it('should format multiple names', () => {
    expect(formatInitials('John Ronald Reuel Tolkien')).toBe('JT')
  })

  it('should handle empty string', () => {
    expect(formatInitials('')).toBe('')
  })

  it('should handle trim whitespace', () => {
    expect(formatInitials('  John   Doe  ')).toBe('JD')
  })
})
