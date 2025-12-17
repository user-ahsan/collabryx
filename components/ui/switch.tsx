"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
    HTMLInputElement,
    React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                className="sr-only peer"
                ref={ref}
                {...props}
            />
            <div
                className={cn(
                    "w-9 h-5 bg-input rounded-full peer peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring/50 peer-focus:ring-offset-2 peer-checked:bg-primary transition-colors",
                    "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white",
                    className
                )}
            ></div>
        </label>
    )
})
Switch.displayName = "Switch"

export { Switch }
