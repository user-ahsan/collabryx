import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { glassDecorations } from "@/lib/utils/glass-variants"

interface GlassDialogProps {
    children: React.ReactNode
    className?: string
    /** Show decorative glass elements (highlights, tints) */
    showDecorations?: boolean
    /** Custom header */
    header?: React.ReactNode
    /** Custom footer */
    footer?: React.ReactNode
}

/**
 * GlassDialog - Standardized glass dialog wrapper
 * 
 * Features:
 * - Consistent glass effect for all dialogs/modals
 * - Optional decorative elements (highlights, tints)
 * - Header and footer slots
 * - Responsive sizing
 * 
 * Usage:
 * <DialogContent className={cn("max-w-2xl", glass("overlay"))}>
 *   <GlassDialog header={<DialogHeader />}>
 *     Dialog content here
 *   </GlassDialog>
 * </DialogContent>
 */
export function GlassDialog({
    children,
    className,
    showDecorations = true,
    header,
    footer,
}: GlassDialogProps) {
    return (
        <div className={cn("relative z-10 flex flex-col h-full w-full", className)}>
            {/* Decorative glass elements */}
            {showDecorations && (
                <>
                    <div className={glassDecorations.topHighlight} />
                    <div className={glassDecorations.leftHighlight} />
                    <div className={glassDecorations.ambientTint} />
                </>
            )}

            {/* Header */}
            {header && (
                <div className={cn(
                    "px-6 py-4 border-b border-white/10 shrink-0",
                    glass("divider")
                )}>
                    {header}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden relative z-10">
                {children}
            </div>

            {/* Footer */}
            {footer && (
                <div className={cn(
                    "px-6 py-4 border-t border-white/10 shrink-0",
                    glass("divider")
                )}>
                    {footer}
                </div>
            )}
        </div>
    )
}

/**
 * GlassDialogContent - Complete dialog content wrapper with standard styling
 * 
 * Use this as a direct replacement for DialogContent when you want consistent glass styling
 * 
 * Usage:
 * <Dialog>
 *   <GlassDialogContent
 *     header={
 *       <>
 *         <DialogTitle>Settings</DialogTitle>
 *         <DialogDescription>Manage your preferences</DialogDescription>
 *       </>
 *     }
 *   >
 *     Content here
 *   </GlassDialogContent>
 * </Dialog>
 */
interface GlassDialogContentProps {
    children: React.ReactNode
    className?: string
    header?: React.ReactNode
    footer?: React.ReactNode
    /** Dialog size preset */
    size?: "sm" | "md" | "lg" | "xl" | "full"
}

export function GlassDialogContent({
    children,
    className,
    header,
    footer,
    size = "md",
}: GlassDialogContentProps) {
    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-2xl",
        lg: "max-w-4xl",
        xl: "max-w-5xl",
        full: "max-w-[95vw] md:max-w-5xl",
    }

    return (
        <div
            className={cn(
                "p-0 h-[85vh] overflow-hidden sm:rounded-2xl",
                glass("overlay"),
                glassDecorations.topHighlight,
                glassDecorations.leftHighlight,
                glassDecorations.ambientTint,
                sizeClasses[size],
                className
            )}
        >
            <GlassDialog header={header} footer={footer}>
                {children}
            </GlassDialog>
        </div>
    )
}

/**
 * GlassDialogHeader - Standardized dialog header
 */
interface GlassDialogHeaderProps {
    title: string
    description?: string
    className?: string
}

export function GlassDialogHeader({
    title,
    description,
    className,
}: GlassDialogHeaderProps) {
    return (
        <div className={cn("space-y-1", className)}>
            <h2 className={cn(
                "text-2xl font-bold",
                "text-foreground"
            )}>
                {title}
            </h2>
            {description && (
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    )
}

/**
 * GlassDialogFooter - Standardized dialog footer with action buttons
 */
interface GlassDialogFooterProps {
    children: React.ReactNode
    className?: string
    /** Show divider above footer */
    showDivider?: boolean
}

export function GlassDialogFooter({
    children,
    className,
    showDivider = true,
}: GlassDialogFooterProps) {
    return (
        <div
            className={cn(
                "flex flex-col sm:flex-row gap-2 justify-end",
                showDivider && "border-t border-white/10 pt-4 mt-4",
                className
            )}
        >
            {children}
        </div>
    )
}
