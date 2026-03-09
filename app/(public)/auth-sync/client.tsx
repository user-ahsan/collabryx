"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function AuthSyncClient({ destination }: { destination: string }) {
    const router = useRouter()
    const [status, setStatus] = useState<"loading" | "redirecting">("loading")

    useEffect(() => {
        let isMounted = true

        const syncAuth = async () => {
            // Minimum artificial delay for the premium feel
            await new Promise(resolve => setTimeout(resolve, 1500))

            if (isMounted) {
                setStatus("redirecting")
                // Small delay to let the exit animation complete (or start)
                setTimeout(() => {
                    router.push(destination)
                }, 400)
            }
        }

        syncAuth()

        return () => {
            isMounted = false
        }
    }, [router, destination])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
            {/* Soft background glow */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
            </div>

            <AnimatePresence mode="wait">
                {status === "loading" && (
                    <motion.div
                        key="loading-state"
                        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="relative z-10 flex flex-col items-center gap-8"
                    >
                        <div className="relative flex items-center justify-center w-24 h-24">
                            {/* Outer spinning ring */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary/40"
                            />
                            {/* Inner reverse spinning ring */}
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-2 rounded-full border-b-2 border-l-2 border-primary/20"
                            />
                            {/* Center Logo marker (or simple icon) */}
                            <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 backdrop-blur-sm shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-4 h-4 rounded-full bg-primary"
                                />
                            </div>
                        </div>

                        <div className="text-center space-y-3">
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="text-2xl font-semibold tracking-tight"
                            >
                                Setting things up
                            </motion.h2>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="flex items-center justify-center gap-2 text-muted-foreground"
                            >
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">Preparing your workspace...</span>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
