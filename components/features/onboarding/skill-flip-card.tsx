'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'
import { ProficiencyRing, type ProficiencyLevel } from '@/components/ui/proficiency-ring'
import {
  Code2,
  Smartphone,
  Cloud,
  Globe,
  Database,
  Server,
  Palette,
  Tag,
  X,
  ChevronDown,
} from 'lucide-react'

export interface SkillFlipCardProps {
  skill: {
    id: string
    label: string
    category?: string
  }
  proficiency: ProficiencyLevel
  selected?: boolean
  onToggle: () => void
  onProficiencyChange: (value: string) => void
  onRemove: () => void
}

const categoryIconMap: Record<string, React.ElementType> = {
  'Programming Languages': Code2,
  'Mobile Development': Smartphone,
  'Cloud Platforms': Cloud,
  'Web Development': Globe,
  'Databases': Database,
  'DevOps': Server,
  'Design': Palette,
}

const proficiencyOptions: { value: ProficiencyLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
]

export const SkillFlipCard: React.FC<SkillFlipCardProps> = ({
  skill,
  proficiency,
  selected = false,
  onToggle,
  onProficiencyChange,
  onRemove,
}) => {
  const [isFlipped, setIsFlipped] = useState(false)

  const IconComponent =
    skill.category && categoryIconMap[skill.category]
      ? categoryIconMap[skill.category]
      : Tag

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    onToggle()
  }

  const handleProficiencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onProficiencyChange(e.target.value)
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove()
  }

  return (
    <div className="relative w-full h-40 perspective-[1000px]" onClick={handleFlip}>
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.4,
          ease: 'easeInOut',
        }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front Face - Display Mode */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full rounded-xl',
            glass(selected ? 'skillCardActive' : 'skillCard'),
            glass('skillCardHoverable'),
            'cursor-pointer p-4 flex flex-col items-center justify-center gap-3'
          )}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <IconComponent className="h-8 w-8 text-blue-400/80" />
          <div className="flex items-center gap-3">
            <ProficiencyRing proficiency={proficiency} size={48} />
            <span className="text-sm font-medium text-foreground line-clamp-2 text-center max-w-[120px]">
              {skill.label}
            </span>
          </div>
          {skill.category && (
            <span className="text-xs text-muted-foreground truncate max-w-full">
              {skill.category}
            </span>
          )}
        </div>

        {/* Back Face - Edit Mode */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full rounded-xl',
            glass('skillCard'),
            'p-4 flex flex-col items-center justify-center gap-3'
          )}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-xs font-medium text-muted-foreground truncate flex-1">
              {skill.label}
            </span>
            <button
              onClick={handleRemoveClick}
              className={cn(
                'p-1 rounded-md hover:bg-red-500/20 transition-colors',
                'text-muted-foreground hover:text-red-400'
              )}
              aria-label="Remove skill"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {skill.category && (
            <span
              className={cn(
                'px-2 py-1 rounded-md text-xs font-medium',
                glass('badge')
              )}
            >
              {skill.category}
            </span>
          )}

          <div className="flex flex-col items-center gap-2 w-full">
            <label htmlFor={`proficiency-${skill.id}`} className="text-xs text-muted-foreground">
              Proficiency Level
            </label>
            <div className="relative w-full">
              <select
                id={`proficiency-${skill.id}`}
                value={proficiency}
                onChange={handleProficiencyChange}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm',
                  'bg-background/40 backdrop-blur-md border border-border/40',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                  'cursor-pointer appearance-none',
                  'text-foreground'
                )}
              >
                {proficiencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SkillFlipCard
