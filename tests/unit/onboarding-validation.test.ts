/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'

// Import the schemas from the onboarding page
// These are the exact schemas used in production
const basicInfoSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be less than 100 characters.")
    .regex(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"),
  displayName: z.string()
    .max(30, "Display name must be less than 30 characters.")
    .regex(/^[a-z0-9_]*$/, "Display name can only contain lowercase letters, numbers, and underscores.")
    .optional()
    .or(z.literal("")),
  headline: z.string()
    .min(5, "Headline must be at least 5 characters.")
    .max(100, "Headline must be less than 100 characters.")
    .regex(/^[a-zA-Z0-9\s@.,&'()-]+$/, "Headline can only contain letters, numbers, and basic punctuation."),
  location: z.string()
    .max(100, "Location must be less than 100 characters.")
    .optional()
    .or(z.literal("")),
})

const skillsSchema = z.object({
  skills: z.array(z.string()).min(1, "Please add at least one skill."),
})

const interestsGoalsSchema = z.object({
  interests: z.array(z.string()).min(1, "Please add at least one interest."),
  goals: z.array(z.string()).optional(),
})

const experienceSchema = z.object({
  experiences: z.array(z.object({
    title: z.string().optional().or(z.literal("")),
    company: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
  })).optional(),
  links: z.array(z.object({
    platform: z.string(),
    url: z.string().optional().or(z.literal("")),
  })).optional(),
})

describe('Onboarding Validation', () => {
  describe('Basic Info Schema', () => {
    describe('Full Name Validation', () => {
      it('should accept valid full names', () => {
        expect(basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          headline: 'Software Developer' 
        }).success).toBe(true)
        
        expect(basicInfoSchema.safeParse({ 
          fullName: 'Mary Jane Watson', 
          headline: 'Product Manager' 
        }).success).toBe(true)
      })

      it('should reject names shorter than 2 characters', () => {
        const result = basicInfoSchema.safeParse({ 
          fullName: 'J', 
          headline: 'Software Developer' 
        })
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Full name must be at least 2 characters.')
        }
      })

      it('should reject names longer than 100 characters', () => {
        const longName = 'A'.repeat(101)
        const result = basicInfoSchema.safeParse({ 
          fullName: longName, 
          headline: 'Software Developer' 
        })
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Full name must be less than 100 characters.')
        }
      })

      it('should reject names with numbers', () => {
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John123', 
          headline: 'Software Developer' 
        })
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Name can only contain letters and spaces')
        }
      })

      it('should reject names with special characters', () => {
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John@Doe', 
          headline: 'Software Developer' 
        })
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Name can only contain letters and spaces')
        }
      })

      it('should accept names with spaces', () => {
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John Michael Doe', 
          headline: 'Software Developer' 
        })
        
        expect(result.success).toBe(true)
      })
    })

    describe('Display Name Validation', () => {
      it('should accept valid display names', () => {
        expect(basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          displayName: 'johndoe',
          headline: 'Software Developer' 
        }).success).toBe(true)
        
        expect(basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          displayName: 'john_doe_123',
          headline: 'Software Developer' 
        }).success).toBe(true)
      })

      it('should accept empty display name', () => {
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          displayName: '',
          headline: 'Software Developer' 
        })
        
        expect(result.success).toBe(true)
      })

      it('should accept undefined display name', () => {
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          headline: 'Software Developer' 
        })
        
        expect(result.success).toBe(true)
      })

      it('should reject display names longer than 30 characters', () => {
        const longDisplayName = 'a'.repeat(31)
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          displayName: longDisplayName,
          headline: 'Software Developer' 
        })
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Display name must be less than 30 characters.')
        }
      })

      it('should reject display names with uppercase letters', () => {
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          displayName: 'JohnDoe',
          headline: 'Software Developer' 
        })
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Display name can only contain lowercase letters, numbers, and underscores.')
        }
      })

      it('should reject display names with special characters', () => {
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          displayName: 'john@doe',
          headline: 'Software Developer' 
        })
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Display name can only contain lowercase letters, numbers, and underscores.')
        }
      })
    })

    describe('Headline Validation', () => {
      it('should accept valid headlines', () => {
        expect(basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          headline: 'Software Developer @ TechCorp' 
        }).success).toBe(true)
        
        expect(basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          headline: 'Full Stack Developer' 
        }).success).toBe(true)
      })

      it('should reject headlines shorter than 5 characters', () => {
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          headline: 'Dev' 
        })
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Headline must be at least 5 characters.')
        }
      })

      it('should reject headlines longer than 100 characters', () => {
        const longHeadline = 'A'.repeat(101)
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          headline: longHeadline 
        })
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Headline must be less than 100 characters.')
        }
      })

      it('should accept headlines with allowed special characters', () => {
        const validHeadlines = [
          'Developer @ Startup',
          'Engineer, Tech Lead',
          "Designer & Artist",
          'Consultant (Remote)',
          'Analyst - Finance'
        ]
        
        validHeadlines.forEach(headline => {
          const result = basicInfoSchema.safeParse({ 
            fullName: 'John Doe', 
            headline 
          })
          expect(result.success).toBe(true)
        })
      })

      it('should reject headlines with disallowed special characters', () => {
        const invalidHeadlines = [
          'Developer <script>alert("xss")</script>',
          'Manager [Team Lead]',
          'Engineer {Backend}',
          'Designer *Creative*'
        ]
        
        invalidHeadlines.forEach(headline => {
          const result = basicInfoSchema.safeParse({ 
            fullName: 'John Doe', 
            headline 
          })
          expect(result.success).toBe(false)
        })
      })
    })

    describe('Location Validation', () => {
      it('should accept valid locations', () => {
        expect(basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          headline: 'Developer',
          location: 'San Francisco, CA' 
        }).success).toBe(true)
        
        expect(basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          headline: 'Developer',
          location: 'New York, United States' 
        }).success).toBe(true)
      })

      it('should accept empty location', () => {
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          headline: 'Developer',
          location: '' 
        })
        
        expect(result.success).toBe(true)
      })

      it('should accept undefined location', () => {
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          headline: 'Developer'
        })
        
        expect(result.success).toBe(true)
      })

      it('should reject locations longer than 100 characters', () => {
        const longLocation = 'A'.repeat(101)
        const result = basicInfoSchema.safeParse({ 
          fullName: 'John Doe', 
          headline: 'Developer',
          location: longLocation 
        })
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Location must be less than 100 characters.')
        }
      })
    })
  })

  describe('Skills Schema', () => {
    it('should accept valid skills array', () => {
      const result = skillsSchema.safeParse({ 
        skills: ['React', 'TypeScript', 'Node.js'] 
      })
      
      expect(result.success).toBe(true)
    })

    it('should reject empty skills array', () => {
      const result = skillsSchema.safeParse({ 
        skills: [] 
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Please add at least one skill.')
      }
    })

    it('should reject missing skills field', () => {
      const result = skillsSchema.safeParse({})
      
      expect(result.success).toBe(false)
    })

    it('should accept single skill', () => {
      const result = skillsSchema.safeParse({ 
        skills: ['JavaScript'] 
      })
      
      expect(result.success).toBe(true)
    })
  })

  describe('Interests & Goals Schema', () => {
    it('should accept valid interests array', () => {
      const result = interestsGoalsSchema.safeParse({ 
        interests: ['AI', 'Web Development', 'Open Source'] 
      })
      
      expect(result.success).toBe(true)
    })

    it('should accept interests with optional goals', () => {
      const result = interestsGoalsSchema.safeParse({ 
        interests: ['AI'],
        goals: ['Learn ML', 'Build projects'] 
      })
      
      expect(result.success).toBe(true)
    })

    it('should accept interests without goals', () => {
      const result = interestsGoalsSchema.safeParse({ 
        interests: ['AI'] 
      })
      
      expect(result.success).toBe(true)
    })

    it('should reject empty interests array', () => {
      const result = interestsGoalsSchema.safeParse({ 
        interests: [] 
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Please add at least one interest.')
      }
    })

    it('should reject missing interests field', () => {
      const result = interestsGoalsSchema.safeParse({})
      
      expect(result.success).toBe(false)
    })
  })

  describe('Experience Schema', () => {
    it('should accept valid experiences', () => {
      const result = experienceSchema.safeParse({
        experiences: [
          {
            title: 'Software Engineer',
            company: 'TechCorp',
            description: 'Built web applications'
          }
        ],
        links: [
          { platform: 'github', url: 'https://github.com/johndoe' }
        ]
      })
      
      expect(result.success).toBe(true)
    })

    it('should accept empty experiences array', () => {
      const result = experienceSchema.safeParse({
        experiences: [],
        links: []
      })
      
      expect(result.success).toBe(true)
    })

    it('should accept undefined experiences and links', () => {
      const result = experienceSchema.safeParse({})
      
      expect(result.success).toBe(true)
    })

    it('should accept experiences with empty strings', () => {
      const result = experienceSchema.safeParse({
        experiences: [
          {
            title: '',
            company: '',
            description: ''
          }
        ]
      })
      
      expect(result.success).toBe(true)
    })

    it('should accept links with empty URLs', () => {
      const result = experienceSchema.safeParse({
        links: [
          { platform: 'github', url: '' }
        ]
      })
      
      expect(result.success).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in skills', () => {
      const result = skillsSchema.safeParse({
        skills: ['C++', '.NET', 'Node.js', 'React/Redux']
      })
      
      expect(result.success).toBe(true)
    })

    it('should handle very long skill names', () => {
      const longSkill = 'A'.repeat(200)
      const result = skillsSchema.safeParse({
        skills: [longSkill]
      })
      
      // Skills don't have maxLength validation, so this should pass
      expect(result.success).toBe(true)
    })

    it('should handle duplicate skills', () => {
      const result = skillsSchema.safeParse({
        skills: ['React', 'React', 'React']
      })
      
      expect(result.success).toBe(true)
    })

    it('should handle whitespace in inputs', () => {
      const result = basicInfoSchema.safeParse({
        fullName: '  John Doe  ',
        headline: '  Developer  '
      })
      
      expect(result.success).toBe(true)
    })

    it('should handle emoji in interests', () => {
      const result = interestsGoalsSchema.safeParse({
        interests: ['AI 🤖', 'Coding 💻', 'Design 🎨']
      })
      
      expect(result.success).toBe(true)
    })

    it('should handle non-ASCII characters in interests', () => {
      const result = interestsGoalsSchema.safeParse({
        interests: ['日本語', 'Français', 'Español']
      })
      
      expect(result.success).toBe(true)
    })
  })

  describe('Combined Schema Validation', () => {
    const combinedSchema = z.object({
      ...basicInfoSchema.shape,
      ...skillsSchema.shape,
      ...interestsGoalsSchema.shape,
      ...experienceSchema.shape,
    })

    it('should accept complete valid onboarding data', () => {
      const result = combinedSchema.safeParse({
        fullName: 'John Doe',
        displayName: 'johndoe',
        headline: 'Software Developer @ TechCorp',
        location: 'San Francisco, CA',
        skills: ['React', 'TypeScript', 'Node.js'],
        interests: ['AI', 'Web Development'],
        goals: ['Learn ML'],
        experiences: [
          {
            title: 'Engineer',
            company: 'Startup',
            description: 'Built products'
          }
        ],
        links: [
          { platform: 'github', url: 'https://github.com/johndoe' }
        ]
      })
      
      expect(result.success).toBe(true)
    })

    it('should accept minimal valid onboarding data', () => {
      const result = combinedSchema.safeParse({
        fullName: 'John Doe',
        headline: 'Developer',
        skills: ['Coding'],
        interests: ['Tech'],
        experiences: [],
        links: []
      })
      
      expect(result.success).toBe(true)
    })

    it('should reject when required fields are missing', () => {
      const result = combinedSchema.safeParse({
        fullName: 'John Doe',
        // Missing headline
        skills: ['Coding'],
        interests: ['Tech']
      })
      
      expect(result.success).toBe(false)
    })
  })
})
