"use client"

import { Check, GraduationCap, ChartLine, Rocket, Briefcase, Star, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type OnboardingRole } from "@/lib/validations/onboarding"
import { TooltipProvider } from "@/components/ui/tooltip"

interface StepRoleSelectProps {
  selectedRoles: OnboardingRole[]
  onChange: (roles: OnboardingRole[]) => void
  error?: string
}

const ROLE_DATA: { role: OnboardingRole; icon: React.ComponentType<{ className?: string }>; color: string; gradient: string }[] = [
  { role: 'student',     icon: GraduationCap, color: 'text-blue-500',   gradient: 'from-blue-500/20 via-blue-500/5 to-transparent' },
  { role: 'founder',     icon: Rocket,        color: 'text-purple-500',  gradient: 'from-purple-500/20 via-purple-500/5 to-transparent' },
  { role: 'investor',    icon: ChartLine,     color: 'text-emerald-500', gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent' },
  { role: 'professional', icon: Briefcase,    color: 'text-amber-500',   gradient: 'from-amber-500/20 via-amber-500/5 to-transparent' },
  { role: 'mentor',      icon: Star,          color: 'text-rose-500',    gradient: 'from-rose-500/20 via-rose-500/5 to-transparent' },
]

export function StepRoleSelect({ selectedRoles, onChange, error }: StepRoleSelectProps) {
  const toggleRole = (role: OnboardingRole) => {
    if (selectedRoles.includes(role)) {
      // Don't allow deselecting the last role
      if (selectedRoles.length <= 1) return
      onChange(selectedRoles.filter(r => r !== role))
    } else {
      let updatedRoles = [...selectedRoles]
      if (role === 'student') {
        // A student cannot be a professional, mentor, or investor
        updatedRoles = updatedRoles.filter(r => r !== 'professional' && r !== 'mentor' && r !== 'investor')
      } else if (role === 'professional' || role === 'mentor' || role === 'investor') {
        // A professional, mentor, or investor cannot be a student
        updatedRoles = updatedRoles.filter(r => r !== 'student')
      }
      onChange([...updatedRoles, role])
    }
  }

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 id="step-heading" className="text-2xl font-bold text-foreground" tabIndex={-1}>
          What best describes you?
        </h2>
        <p className="text-muted-foreground">
          Select all that apply — you can always update this later
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto" role="group" aria-label="Role selection">
        {ROLE_DATA.map(({ role, icon: Icon, color, gradient }) => {
          const isSelected = selectedRoles.includes(role)
          return (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={cn(
                "relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 text-left transition-all duration-200",
                "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/60"
              )}
              aria-pressed={isSelected}
              aria-label={`${ROLE_LABELS[role]} — ${ROLE_DESCRIPTIONS[role]}`}
            >
              {/* Gradient background when selected */}
              {isSelected && (
                <div className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-40", gradient)} aria-hidden="true" />
              )}

              {/* Check mark */}
              <div
                className={cn(
                  "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                  isSelected ? "bg-primary scale-100 opacity-100" : "scale-75 opacity-0"
                )}
                aria-hidden="true"
              >
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>

              {/* Icon */}
              <div className={cn(
                "relative z-10 p-3 rounded-xl bg-background/80 border border-border/40",
                isSelected && "bg-primary/10 border-primary/30"
              )}>
                <Icon className={cn("w-6 h-6", isSelected ? "text-primary" : color)} />
              </div>

              {/* Text */}
              <div className="relative z-10">
                <div className="font-semibold text-foreground">{ROLE_LABELS[role]}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {ROLE_DESCRIPTIONS[role]}
                </div>
              </div>

              {/* Multi-role hint */}
              {isSelected && (
                <div className="relative z-10 text-[10px] text-primary/70 font-medium uppercase tracking-wider mt-1">
                  {selectedRoles.length > 1 ? `${selectedRoles.length} roles selected` : ''}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Multi-role info */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5" />
        <span>You can select multiple roles — your profile will adapt to each</span>
      </div>

      {/* Error */}
      {error && (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Role descriptions tooltip section */}
      <div className="max-w-2xl mx-auto text-center">
        <TooltipProvider>
          <div className="flex flex-wrap justify-center gap-2">
            {selectedRoles.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Showing fields for: <span className="font-medium text-foreground">
                  {selectedRoles.map(r => ROLE_LABELS[r]).join(', ')}
                </span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select at least one role to continue
              </p>
            )}
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
