"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react"
import { useState, useEffect } from "react"

export interface ValidationMessageProps {
  message?: string | null
  variant?: "error" | "success" | "warning" | "info"
  className?: string
  icon?: React.ReactNode
  dismissible?: boolean
  autoDismiss?: boolean
  duration?: number
  onDismiss?: () => void
}

const variants = {
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-200",
    icon: "text-red-500",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.2)]",
    gradient: "from-red-500/5 to-red-500/2",
  },
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-200",
    icon: "text-emerald-500",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    gradient: "from-emerald-500/5 to-emerald-500/2",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-200",
    icon: "text-amber-500",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    gradient: "from-amber-500/5 to-amber-500/2",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-200",
    icon: "text-blue-500",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    gradient: "from-blue-500/5 to-blue-500/2",
  },
}

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
}

export function ValidationMessage({
  message,
  variant = "error",
  className,
  icon: customIcon,
  dismissible = false,
  autoDismiss = false,
  duration = 5000,
  onDismiss,
}: ValidationMessageProps) {
  const [isVisible, setIsVisible] = useState(true)
  const variantStyle = variants[variant]
  const IconComponent = customIcon ? null : icons[variant]

  useEffect(() => {
    if (autoDismiss && message) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, duration, message, onDismiss])

  // Set visible on mount if message exists
  if (message && !isVisible) {
    setIsVisible(true)
  }

  if (!message) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "relative overflow-hidden rounded-xl border backdrop-blur-sm",
            variantStyle.bg,
            variantStyle.border,
            variantStyle.text,
            variantStyle.glow,
            "transition-all duration-300",
            className
          )}
        >
          {/* Gradient overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-50",
            variantStyle.gradient
          )} />

          {/* Shimmer effect for success */}
          {variant === "success" && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
          )}

          {/* Pulse effect for warning */}
          {variant === "warning" && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-amber-500/5"
            />
          )}

          {/* Content */}
          <div className="relative flex items-start gap-3 p-4">
            {customIcon || (IconComponent && <IconComponent className={cn("h-5 w-5 shrink-0 mt-0.5", variantStyle.icon)} />)}

            <p className="text-sm font-medium leading-relaxed flex-1">{message}</p>

            {dismissible && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsVisible(false)
                  onDismiss?.()
                }}
                className={cn(
                  "shrink-0 rounded-lg p-1 transition-colors",
                  "hover:bg-white/10",
                  variantStyle.icon
                )}
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </div>

          {/* Progress bar for auto-dismiss */}
          {autoDismiss && (
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className={cn(
                "absolute bottom-0 left-0 h-0.5",
                variant === "error" && "bg-red-500/30",
                variant === "success" && "bg-emerald-500/30",
                variant === "warning" && "bg-amber-500/30",
                variant === "info" && "bg-blue-500/30"
              )}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Convenience components for common use cases
export function ErrorMessage({ message, className }: { message?: string | null; className?: string }) {
  return (
    <ValidationMessage
      message={message}
      variant="error"
      className={cn("text-sm", className)}
      autoDismiss={false}
    />
  )
}

export function SuccessMessage({ message, className, autoDismiss = true }: { message?: string | null; className?: string; autoDismiss?: boolean }) {
  return (
    <ValidationMessage
      message={message}
      variant="success"
      className={cn("text-sm", className)}
      autoDismiss={autoDismiss}
      duration={3000}
    />
  )
}

export function WarningMessage({ message, className }: { message?: string | null; className?: string }) {
  return (
    <ValidationMessage
      message={message}
      variant="warning"
      className={cn("text-sm", className)}
    />
  )
}

export function InfoMessage({ message, className }: { message?: string | null; className?: string }) {
  return (
    <ValidationMessage
      message={message}
      variant="info"
      className={cn("text-sm", className)}
    />
  )
}
