"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { NotificationPreference } from "@/types/database.types"

interface NotificationPreferencesForm {
    email_new_connections: boolean
    email_messages: boolean
    email_post_likes: boolean
    email_comments: boolean
    push_enabled: boolean
    ai_smart_match_alerts: boolean
}

export function useNotificationPreferences(userId: string | null) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    const queryKey = ["notification_preferences", userId]

    const { data: preferences, isLoading, error } = useQuery<NotificationPreference | null, Error>({
        queryKey,
        queryFn: async () => {
            if (!userId) {
                return null
            }

            if (process.env.NODE_ENV === "development") {
                await new Promise((resolve) => setTimeout(resolve, 300))
                return {
                    id: "dev-pref-id",
                    user_id: userId,
                    email_new_connections: true,
                    email_messages: true,
                    email_post_likes: true,
                    email_comments: true,
                    push_enabled: false,
                    ai_smart_match_alerts: true,
                    updated_at: new Date().toISOString(),
                }
            }

            const { data, error: fetchError } = await supabase
                .from("notification_preferences")
                .select("*")
                .eq("user_id", userId)
                .single()

            if (fetchError && fetchError.code !== "PGRST116") {
                throw fetchError
            }

            return data
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
    })

    const updateMutation = useMutation({
        mutationFn: async (updates: NotificationPreferencesForm) => {
            if (!userId) {
                throw new Error("User not authenticated")
            }

            if (process.env.NODE_ENV === "development") {
                await new Promise((resolve) => setTimeout(resolve, 500))
                return { success: true }
            }

            const { data: existingPref } = await supabase
                .from("notification_preferences")
                .select("id")
                .eq("user_id", userId)
                .single()

            if (existingPref) {
                const { error: updateError } = await supabase
                    .from("notification_preferences")
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("user_id", userId)

                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from("notification_preferences")
                    .insert({
                        user_id: userId,
                        ...updates,
                        updated_at: new Date().toISOString(),
                    })

                if (insertError) throw insertError
            }

            return { success: true }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
            toast.success("Notification preferences updated")
        },
        onError: (error: Error) => {
            console.error("Error updating notification preferences:", error)
            toast.error(`Failed to update preferences: ${error.message}`)
        },
    })

    const updatePreferences = async (updates: NotificationPreferencesForm) => {
        return updateMutation.mutateAsync(updates)
    }

    return {
        preferences,
        isLoading,
        error,
        updatePreferences,
        isUpdating: updateMutation.isPending,
    }
}
