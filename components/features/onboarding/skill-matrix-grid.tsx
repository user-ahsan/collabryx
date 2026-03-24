'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useFormContext } from 'react-hook-form'
import { Code2 } from 'lucide-react'

import { SkillFlipCard } from './skill-flip-card'
import { type ProficiencyLevel } from '@/components/ui/proficiency-ring'
import { GlassCard } from '@/components/shared/glass-card'
import { cn } from '@/lib/utils'

export interface SkillMatrixGridProps {
  skills: Array<{
    id: string
    label: string
    category?: string
    proficiency?: ProficiencyLevel
  }>
  onProficiencyChange: (skillId: string, proficiency: string) => void
  onRemove: (skillId: string) => void
  onFlip?: (skillId: string, isFlipped: boolean) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: 'easeIn' as const,
    },
  },
}

export function SkillMatrixGrid({
  skills,
  onProficiencyChange,
  onRemove,
  onFlip,
}: SkillMatrixGridProps) {
  const form = useFormContext()
  const shouldReduceMotion = useReducedMotion()

  // Reduce motion variants
  const reducedContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0,
        delayChildren: 0,
      },
    },
  }

  const reducedItemVariants = {
    hidden: { opacity: 0, scale: 1 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0 },
    },
    exit: {
      opacity: 0,
      scale: 1,
      transition: { duration: 0 },
    },
  }

  const handleProficiencyChange = (skillId: string, proficiency: string) => {
    onProficiencyChange(skillId, proficiency)

    // Update form state if context is available
    if (form) {
      const currentSkills = form.getValues('skills') || []
      const updatedSkills = currentSkills.map((skill: { id: string; proficiency?: string }) =>
        skill.id === skillId ? { ...skill, proficiency } : skill
      )
      form.setValue('skills', updatedSkills, { shouldValidate: true, shouldDirty: true })
    }
  }

  const handleFlip = (skillId: string, isFlipped: boolean) => {
    onFlip?.(skillId, isFlipped)
  }

  // Empty state
  if (skills.length === 0) {
    return (
      <GlassCard className="flex w-full flex-col items-center justify-center p-12 text-center">
        <motion.div
          initial={{ scale: shouldReduceMotion ? 1 : 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: shouldReduceMotion ? 0 : 0.4, 
            ease: 'easeOut' as const 
          }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Code2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">No skills added yet</h3>
            <p className="text-sm text-muted-foreground">Use the search above to add your first skill</p>
          </div>
        </motion.div>
      </GlassCard>
    )
  }

  return (
    <motion.div
      variants={shouldReduceMotion ? reducedContainerVariants : containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn('grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3')}
    >
      <AnimatePresence mode="popLayout">
        {skills.map((skill) => (
          <motion.div 
            key={skill.id} 
            variants={shouldReduceMotion ? reducedItemVariants : itemVariants} 
            layout
          >
            <SkillFlipCard
              skill={{
                id: skill.id,
                label: skill.label,
                category: skill.category,
              }}
              proficiency={skill.proficiency ?? 'beginner'}
              onProficiencyChange={(proficiency) => handleProficiencyChange(skill.id, proficiency)}
              onRemove={() => onRemove(skill.id)}
              onToggle={() => handleFlip(skill.id, true)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
