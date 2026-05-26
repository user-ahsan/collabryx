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

    // Extract stable method references to avoid re-renders from object identity changes
    const getSession = supabase.auth.getSession
    const onAuthStateChange = supabase.auth.onAuthStateChange
    const authSignOut = supabase.auth.signOut

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                const {
                    data: { session: currentSession },
                } = await getSession()
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

        getInitialSession()

        // Listen for auth state changes
        const {
            data: { subscription },
        } = onAuthStateChange((_event, newSession) => {
            setSession(newSession)
            setUser(newSession?.user ?? null)
            setIsLoading(false)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [getSession, onAuthStateChange])

    const signOut = useCallback(async () => {
        try {
            await authSignOut()
            
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
    }, [authSignOut, router, queryClient])

    return { user, session, isLoading, signOut }
}
