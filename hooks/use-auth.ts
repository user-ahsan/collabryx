"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

interface UseAuthReturn {
    user: User | null
    session: Session | null
    isLoading: boolean
    signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()
    const queryClient = useQueryClient()

    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            try {
                const {
                    data: { session: currentSession },
                } = await supabase.auth.getSession()
                setSession(currentSession)
                setUser(currentSession?.user ?? null)
            } catch (error) {
                console.error('Failed to get auth session:', error)
                setSession(null)
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        getSession()

        // Listen for auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession)
            setUser(newSession?.user ?? null)
            setIsLoading(false)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase.auth])

    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut()
            
            // CRITICAL: Clear React Query cache to prevent data leakage between users
            queryClient.clear()
            
            router.push("/login")
            router.refresh()
        } catch (error) {
            console.error('Failed to sign out:', error)
            // Still clear cache and redirect even if signOut fails
            queryClient.clear()
            router.push("/login")
        }
    }, [supabase.auth, router, queryClient])

    return { user, session, isLoading, signOut }
}
