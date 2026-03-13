import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Label for the input */
    label?: string
    /** Error message */
    error?: string
    /** Helper text */
    helperText?: string
    /** Left icon */
    leftIcon?: React.ReactNode
    /** Right icon */
    rightIcon?: React.ReactNode
}

/**
 * GlassInput - Standardized glass input component
 * 
 * Features:
 * - Consistent glass effect
 * - Label, error, and helper text support
 * - Left and right icon slots
 * - Focus states
 * 
 * Usage:
 * <GlassInput
 *   label="Email"
 *   placeholder="Enter your email"
 *   type="email"
 *   error="Invalid email format"
 * />
 */
export function GlassInput({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className,
    ...props
}: GlassInputProps) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-semibold text-foreground">
                    {label}
                </label>
            )}

            <div className="relative">
                {/* Left icon */}
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        {leftIcon}
                    </div>
                )}

                {/* Input field */}
                <input
                    className={cn(
                        "w-full px-4 py-2.5 text-sm",
                        "rounded-lg",
                        glass("input"),
                        leftIcon && "pl-10",
                        rightIcon && "pr-10",
                        error && "border-red-500/50 focus:border-red-500",
                        className
                    )}
                    {...props}
                />

                {/* Right icon */}
                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        {rightIcon}
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <p className="text-xs text-red-500 font-medium">
                    {error}
                </p>
            )}

            {/* Helper text */}
            {!error && helperText && (
                <p className="text-xs text-muted-foreground">
                    {helperText}
                </p>
            )}
        </div>
    )
}

/**
 * GlassTextarea - Standardized glass textarea component
 */
interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    helperText?: string
}

export function GlassTextarea({
    label,
    error,
    helperText,
    className,
    ...props
}: GlassTextareaProps) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-semibold text-foreground">
                    {label}
                </label>
            )}

            <textarea
                className={cn(
                    "w-full px-4 py-2.5 text-sm",
                    "rounded-lg resize-y min-h-[100px]",
                    glass("input"),
                    error && "border-red-500/50 focus:border-red-500",
                    className
                )}
                {...props}
            />

            {error && (
                <p className="text-xs text-red-500 font-medium">
                    {error}
                </p>
            )}

            {!error && helperText && (
                <p className="text-xs text-muted-foreground">
                    {helperText}
                </p>
            )}
        </div>
    )
}

/**
 * GlassSelect - Standardized glass select component
 */
interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    helperText?: string
    options: { value: string; label: string }[]
}

export function GlassSelect({
    label,
    error,
    helperText,
    options,
    className,
    ...props
}: GlassSelectProps) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-semibold text-foreground">
                    {label}
                </label>
            )}

            <div className="relative">
                <select
                    className={cn(
                        "w-full px-4 py-2.5 text-sm",
                        "rounded-lg appearance-none",
                        glass("input"),
                        error && "border-red-500/50 focus:border-red-500",
                        className
                    )}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {/* Chevron icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                        className="h-4 w-4 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-500 font-medium">
                    {error}
                </p>
            )}

            {!error && helperText && (
                <p className="text-xs text-muted-foreground">
                    {helperText}
                </p>
            )}
        </div>
    )
}
