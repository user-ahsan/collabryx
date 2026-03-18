"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { PrivacySetting } from "@/types/database.types"

export interface PrivacySettingsForm {
    profile_visibility: 'public' | 'friends-only' | 'private'
    show_email: boolean
    show_connections_list: boolean
    activity_status_visible: boolean
    allow_data_download: boolean
}

export function usePrivacySettings(userId: string | null) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    const queryKey = ["privacy_settings", userId]

    const { data: settings, isLoading, error } = useQuery<PrivacySetting | null, Error>({
        queryKey,
        queryFn: async () => {
            if (!userId) {
                return null
            }

            if (process.env.NODE_ENV === "development") {
                await new Promise((resolve) => setTimeout(resolve, 300))
                return {
                    id: "dev-privacy-id",
                    user_id: userId,
                    profile_visibility: "public",
                    show_email: false,
                    show_connections_list: true,
                    activity_status_visible: true,
                    allow_data_download: true,
                    updated_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                }
            }

            const { data, error: fetchError } = await supabase
                .from("privacy_settings")
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
        mutationFn: async (updates: PrivacySettingsForm) => {
            if (!userId) {
                throw new Error("User not authenticated")
            }

            if (process.env.NODE_ENV === "development") {
                await new Promise((resolve) => setTimeout(resolve, 500))
                return { success: true }
            }

            const { data: existingSettings } = await supabase
                .from("privacy_settings")
                .select("id")
                .eq("user_id", userId)
                .single()

            if (existingSettings) {
                const { error: updateError } = await supabase
                    .from("privacy_settings")
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("user_id", userId)

                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from("privacy_settings")
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
            toast.success("Privacy settings updated")
        },
        onError: (error: Error) => {
            console.error("Error updating privacy settings:", error)
            toast.error(`Failed to update privacy settings: ${error.message}`)
        },
    })

    const updateSettings = async (updates: PrivacySettingsForm) => {
        return updateMutation.mutateAsync(updates)
    }

    return {
        settings,
        isLoading,
        error,
        updateSettings,
        isUpdating: updateMutation.isPending,
    }
}
