'use client'

import { motion, type Transition } from 'framer-motion'
import { glass } from '@/lib/utils/glass-variants'
import { cn } from '@/lib/utils'
import React from 'react'

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface ProficiencyRingProps {
  proficiency: ProficiencyLevel
  size?: number
  animated?: boolean
  className?: string
  ariaLabel?: string
}

export const proficiencyColors: Record<ProficiencyLevel, string> = {
  beginner: 'text-blue-500',
  intermediate: 'text-green-500',
  advanced: 'text-yellow-500',
  expert: 'text-orange-500',
}

const proficiencyValues: Record<ProficiencyLevel, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
}

const proficiencyLabels: Record<ProficiencyLevel, string> = {
  beginner: 'BEG',
  intermediate: 'INT',
  advanced: 'ADV',
  expert: 'EXP',
}

const ringColors: Record<ProficiencyLevel, string> = {
  beginner: '#3b82f6',
  intermediate: '#22c55e',
  advanced: '#eab308',
  expert: '#f97316',
}

export const ProficiencyRing: React.FC<ProficiencyRingProps> = ({
  proficiency,
  size = 60,
  animated = true,
  className,
  ariaLabel,
}) => {
  const value = proficiencyValues[proficiency]
  const label = proficiencyLabels[proficiency]
  const color = ringColors[proficiency]
  const strokeWidth = 4
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const center = size / 2

  const defaultAriaLabel = ariaLabel || `${proficiency} proficiency level`

  const motionProps = animated
    ? {
        initial: { strokeDashoffset: circumference },
        animate: { strokeDashoffset: offset },
        transition: {
          duration: 0.4,
          ease: 'easeOut' as const,
        },
      }
    : {
        strokeDashoffset: offset,
      }

  return (
    <div
      className={cn(glass('proficiencyRing'), 'relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={defaultAriaLabel}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Progress ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          {...motionProps}
        />
      </svg>
      <span
        className={cn('absolute text-xs font-semibold', proficiencyColors[proficiency])}
        style={{ fontSize: size * 0.15 }}
      >
        {label}
      </span>
    </div>
  )
}

export default ProficiencyRing
