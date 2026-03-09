"use client"

import React from "react"
import { motion } from "framer-motion"

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center gap-6"
            >
                <div className="relative flex items-center justify-center">
                    {/* The Logo */}
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 relative z-10">
                        <span className="text-primary-foreground font-bold text-3xl md:text-5xl">C</span>
                    </div>

                    {/* Animated rings around the logo */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                        animate={{ scale: [1, 1.2, 1.5], opacity: [0.8, 0.4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    />
                    <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-primary/20"
                        animate={{ scale: [1, 1.3, 1.8], opacity: [0.6, 0.2, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                    />
                </div>

                <div className="flex flex-col items-center gap-3">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-foreground/80 text-sm font-medium tracking-wide uppercase"
                    >
                        Loading
                    </motion.p>

                    {/* Minimal Progress Bar */}
                    <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
