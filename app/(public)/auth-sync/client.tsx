"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/shared/glass-card"
import { Loader2, CheckCircle2, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface AuthSyncClientProps {
    destination: string
    needsEmbeddingWait?: boolean
}

export function AuthSyncClient({ destination, needsEmbeddingWait = false }: AuthSyncClientProps) {
    const router = useRouter()
    const [embeddingStatus, setEmbeddingStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | 'not_found'>('not_found')
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        // Always redirect after a delay, but show embedding status if needed
        const redirectTimer = setTimeout(() => {
            router.push(destination)
        }, needsEmbeddingWait ? 8000 : 3000)

        // If we need to wait for embedding, poll the status
        if (needsEmbeddingWait) {
            const checkEmbeddingStatus = async () => {
                try {
                    const supabase = createClient()
                    const { data: { user } } = await supabase.auth.getUser()
                    
                    if (!user) {
                        setIsChecking(false)
                        return
                    }

                    const { data: embedding } = await supabase
                        .from("profile_embeddings")
                        .select("status")
                        .eq("user_id", user.id)
                        .single()

                    setEmbeddingStatus(embedding?.status || 'not_found')
                    setIsChecking(false)

                    // If embedding is completed, redirect immediately
                    if (embedding?.status === 'completed') {
                        clearTimeout(redirectTimer)
                        router.push(destination)
                    }
                } catch (error) {
                    console.error('Error checking embedding status:', error)
                    setIsChecking(false)
                }
            }

            checkEmbeddingStatus()

            // Poll every 2 seconds if still processing
            const pollInterval = setInterval(() => {
                if (embeddingStatus === 'pending' || embeddingStatus === 'processing') {
                    checkEmbeddingStatus()
                }
            }, 2000)

            return () => {
                clearTimeout(redirectTimer)
                clearInterval(pollInterval)
            }
        } else {
            return () => clearTimeout(redirectTimer)
        }
    }, [router, destination, needsEmbeddingWait, embeddingStatus])

    // If not waiting for embedding, show simple loading
    if (!needsEmbeddingWait) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground animate-pulse">
                        Setting things up
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                        Preparing your workspace...
                    </p>
                </div>
            </div>
        )
    }

    // If waiting for embedding, show detailed status
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <GlassCard hoverable className="p-8 bg-black/40 border border-white/10">
                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Icon based on status */}
                        {isChecking ? (
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        ) : embeddingStatus === 'completed' ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center"
                            >
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </motion.div>
                        ) : (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center"
                            >
                                <Sparkles className="w-8 h-8 text-primary" />
                            </motion.div>
                        )}

                        {/* Status message */}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">
                                {isChecking ? 'Checking status...' : 
                                 embeddingStatus === 'completed' ? 'Ready to go!' :
                                 embeddingStatus === 'processing' ? 'Analyzing your profile...' :
                                 embeddingStatus === 'pending' ? 'Queueing your analysis...' :
                                 'Getting things ready'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {isChecking ? 'Please wait...' : 
                                 embeddingStatus === 'completed' ? 'Your personalized feed is ready. Redirecting...' :
                                 embeddingStatus === 'processing' ? 'We\'re generating your personalized recommendations. This takes about 30 seconds.' :
                                 embeddingStatus === 'pending' ? 'Your profile is in queue. You\'ll see random posts until personalization is ready.' :
                                 'You\'ll see random posts while we prepare your personalized feed.'}
                            </p>
                        </div>

                        {/* Progress indicator */}
                        {embeddingStatus !== 'completed' && embeddingStatus !== 'failed' && (
                            <div className="w-full space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Progress</span>
                                    <span>{embeddingStatus === 'processing' ? '75%' : '25%'}</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: '25%' }}
                                        animate={{ width: embeddingStatus === 'processing' ? '75%' : '25%' }}
                                        className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Info box */}
                        <div className="w-full p-4 bg-muted/50 rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground">
                                💡 <strong>Pro tip:</strong> You can start exploring right away! Your feed will automatically update with personalized recommendations once the analysis is complete.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    )
}
