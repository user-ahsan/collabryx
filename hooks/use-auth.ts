"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

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

    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            const {
                data: { session: currentSession },
            } = await supabase.auth.getSession()
            setSession(currentSession)
            setUser(currentSession?.user ?? null)
            setIsLoading(false)
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
        await supabase.auth.signOut()
        router.push("/login")
        router.refresh()
    }, [supabase.auth, router])

    return { user, session, isLoading, signOut }
}
