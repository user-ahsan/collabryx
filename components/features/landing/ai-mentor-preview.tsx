"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/use-media-query"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { BadgeCheck } from "@/public/icons/BadgeCheck"
import { Bolt } from "@/public/icons/Bolt"

interface Message {
    role: "user" | "assistant"
    content: string
}

const sampleConversation: Message[] = [
    {
        role: "user",
        content: "I have an idea for a delivery app, but I don't know where to start."
    },
    {
        role: "assistant",
        content: "That sounds promising! Based on your skills in Python, your first step should be defining your MVP features. Would you like a checklist?"
    }
]

export function AIMentorPreview() {
    const isMobile = useIsMobile()
    const prefersReducedMotion = usePrefersReducedMotion()

    // Use typewriter effect only on desktop with no motion preference
    const useTypewriter = !isMobile && !prefersReducedMotion

    return (
        <section className="relative py-24 sm:py-32 overflow-hidden">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
                {/* Section Header */}
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 flex justify-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            <Bolt className="h-4 w-4 animate-pulse" />
                            <span>AI-Powered Guidance</span>
                        </div>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
                    >
                        Your 24/7 Startup Co-Pilot
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg text-muted-foreground"
                    >
                        Get personalized guidance from our AI mentor that understands your profile, skills, and goals.
                    </motion.p>
                </div>

                {/* Chat Interface Mockup */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="relative mx-auto max-w-3xl"
                >
                    {/* Chat Window */}
                    <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                        {/* Chat Header */}
                        <div className="border-b border-border bg-muted/30 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Bolt className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-foreground">Collabryx AI Mentor</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        <span>Online • Context-Aware</span>
                                    </div>
                                </div>
                                <BadgeCheck className="h-5 w-5 text-primary" />
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <ScrollArea className="h-[400px] p-6">
                            <div className="space-y-6">
                                {useTypewriter ? (
                                    <TypewriterMessages messages={sampleConversation} />
                                ) : (
                                    <InstantMessages messages={sampleConversation} />
                                )}
                            </div>
                        </ScrollArea>

                        {/* Chat Input (Disabled/Visual Only) */}
                        <div className="border-t border-border bg-muted/20 px-6 py-4">
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-background/50 text-muted-foreground text-sm">
                                <span className="flex-1">Try the AI mentor in your dashboard...</span>
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Context Awareness Indicator */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground"
                    >
                        <BadgeCheck className="h-4 w-4 text-primary" />
                        <span>
                            The AI has context of your <span className="text-primary font-medium">Python skills</span> from your profile
                        </span>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

/**
 * Instant messages for mobile/reduced motion
 */
function InstantMessages({ messages }: { messages: Message[] }) {
    return (
        <>
            {messages.map((message, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.2 }}
                >
                    <MessageBubble message={message} />
                </motion.div>
            ))}
        </>
    )
}

/**
 * Typewriter effect messages for desktop
 */
function TypewriterMessages({ messages }: { messages: Message[] }) {
    const [displayedMessages, setDisplayedMessages] = React.useState<Message[]>([])
    const [isInView, setIsInView] = React.useState(false)

    React.useEffect(() => {
        if (!isInView) return

        let currentIndex = 0
        const showNextMessage = () => {
            if (currentIndex < messages.length) {
                setDisplayedMessages((prev) => [...prev, messages[currentIndex]])
                currentIndex++
                setTimeout(showNextMessage, 1500) // Delay between messages
            }
        }

        // Start showing messages
        const timer = setTimeout(showNextMessage, 500)
        return () => clearTimeout(timer)
    }, [isInView, messages])

    return (
        <motion.div
            onViewportEnter={() => setIsInView(true)}
            viewport={{ once: true }}
        >
            <AnimatePresence>
                {displayedMessages.map((message, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6"
                    >
                        <MessageBubble
                            message={message}
                            useTypewriter={message.role === "assistant"}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    )
}

/**
 * Message Bubble Component
 */
function MessageBubble({
    message,
    useTypewriter = false
}: {
    message: Message
    useTypewriter?: boolean
}) {
    const isUser = message.role === "user"

    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            {!isUser && (
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bolt className="h-4 w-4 text-primary" />
                </div>
            )}
            {isUser && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    You
                </div>
            )}

            {/* Message Content */}
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                    }`}
            >
                {useTypewriter ? (
                    <TypewriterText text={message.content} />
                ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                )}
            </div>
        </div>
    )
}

/**
 * Typewriter Text Effect
 */
function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
    const [displayedText, setDisplayedText] = React.useState("")
    const [currentIndex, setCurrentIndex] = React.useState(0)

    React.useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayedText((prev) => prev + text[currentIndex])
                setCurrentIndex((prev) => prev + 1)
            }, speed)
            return () => clearTimeout(timer)
        }
    }, [currentIndex, text, speed])

    return (
        <p className="text-sm leading-relaxed">
            {displayedText}
            {currentIndex < text.length && (
                <span className="inline-block w-1 h-4 bg-current ml-0.5 animate-pulse" />
            )}
        </p>
    )
}
