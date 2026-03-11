"use server"

import { createClient } from "@/lib/supabase/server"
import { completeTestUserOnboarding, isDevelopmentMode } from "@/lib/services/development"

interface OnboardingData {
    fullName: string;
    displayName?: string;
    headline: string;
    location?: string;
    skills: string[];
    interests: string[];
    goals?: string[];
    experiences?: {
        title?: string;
        compunknown?: string;
        description?: string;
    }[];
    links?: {
        platform: string;
        url: string;
    }[];
}

export async function completeOnboarding(data: OnboardingData, completionPercentage: number) {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
        throw new Error("Unable to verify user authentication. Please log in again.")
    }

    const userId = userData.user.id

    // In development mode with test user, use the development service
    if (isDevelopmentMode() && userData.user.email === "test123@collabryx.com") {
        const result = await completeTestUserOnboarding()
        if (!result.success) {
            throw new Error(result.error?.message || "Failed to complete onboarding in development mode.")
        }
        // Trigger embedding generation for test user
        triggerEmbeddingGeneration(userId).catch(err => {
            console.error("Failed to trigger embedding for test user:", err)
        })
        return { success: true, userId }
    }

    // 1. Update Profile
    const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
            id: userId,
            full_name: data.fullName,
            display_name: data.displayName || null,
            headline: data.headline,
            location: data.location || null,
            website_url: data.links && data.links.length > 0 ? JSON.stringify(data.links) : null,
            looking_for: data.goals || [],
            onboarding_completed: true,
            profile_completion: completionPercentage,
            updated_at: new Date().toISOString()
        }, { onConflict: "id" })

    if (profileError) {
        throw new Error(profileError.message || profileError.details || "Failed to save profile information.")
    }

    // 2. Insert/Update Skills
    if (data.skills && data.skills.length > 0) {
        const skillsToInsert = data.skills.map((skill: string, index: number) => ({
            user_id: userId,
            skill_name: skill,
            is_primary: index < 5,
        }))

        for (const skill of skillsToInsert) {
            await supabase
                .from("user_skills")
                .upsert(skill, { onConflict: "user_id,skill_name" })
        }
    }

    // 3. Insert/Update Interests
    if (data.interests && data.interests.length > 0) {
        for (const interest of data.interests) {
            await supabase
                .from("user_interests")
                .upsert({
                    user_id: userId,
                    interest: interest
                }, { onConflict: "user_id,interest" })
        }
    }

    // 4. Insert Experience
    if (data.experiences && data.experiences.length > 0) {
        const expsToInsert = data.experiences
            .filter((exp) => exp.title || exp.compunknown)
            .map((exp) => ({
                user_id: userId,
                title: exp.title || exp.compunknown || "Untitled",
                compunknown: exp.compunknown,
                description: exp.description || null,
                start_date: new Date().toISOString(),
                is_current: true,
                order_index: 0
            }))
        if (expsToInsert.length > 0) {
            for (const exp of expsToInsert) {
                await supabase
                    .from("user_experiences")
                    .upsert(exp, { onConflict: "user_id,title" })
            }
        }
    }

    // 5. Trigger embedding generation (asynchronously)
    // This runs in the background after onboarding is complete
    triggerEmbeddingGeneration(userId).catch(err => {
        console.error("Failed to trigger embedding generation:", err)
    })

    return { success: true, userId }
}

// Trigger embedding generation after onboarding
export async function triggerEmbeddingGeneration(userId: string) {
    const supabase = await createClient()
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
        console.error("No session available for embedding generation")
        return { success: false, message: "No session available" }
    }

    try {
        // Call the Edge Function to generate embedding
        const { data, error } = await supabase.functions.invoke("generate-embedding", {
            body: { user_id: userId },
        })

        if (error) {
            console.error("Edge Function error:", error)
            return { success: false, message: error.message }
        }

        console.log("Embedding generation triggered:", data)
        return { success: true, data }
    } catch (error) {
        console.error("Error triggering embedding generation:", error)
        return { 
            success: false, 
            message: error instanceof Error ? error.message : "Unknown error" 
        }
    }
}

// Check embedding status for a user
export async function getEmbeddingStatus(userId: string) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from("profile_embeddings")
        .select("user_id, status, last_updated")
        .eq("user_id", userId)
        .single()

    if (error) {
        // If no embedding record exists yet
        if (error.code === "PGRST116") {
            return { status: "not_found", user_id: userId }
        }
        console.error("Error fetching embedding status:", error)
        return { error: error.message }
    }

    return data
}
