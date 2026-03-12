"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { revalidateByTag, CACHE_TAGS } from "@/lib/cache-tags"
import { validateOnboardingData, completionPercentageSchema } from "@/lib/validations/onboarding"

export async function completeOnboarding(rawData: unknown, rawPercentage: unknown) {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
        return { 
            success: false, 
            error: "Unable to verify user authentication. Please log in again."
        }
    }

    const userId = userData.user.id

    // Validate input data with Zod
    const validationResult = validateOnboardingData(rawData)
    if (!validationResult.success) {
        return {
            success: false,
            error: "Validation failed",
            details: validationResult.errors
        }
    }
    const data = validationResult.data

    // Validate completion percentage
    const percentageResult = completionPercentageSchema.safeParse(rawPercentage)
    if (!percentageResult.success) {
        return {
            success: false,
            error: "Invalid completion percentage"
        }
    }
    const completionPercentage = percentageResult.data

    // 1. Update Profile
    const userEmail = userData.user.email
    if (!userEmail) {
        return {
            success: false,
            error: "Your account doesn't have an email address. Please contact support."
        }
    }
    
    const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
            id: userId,
            email: userEmail,
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
        console.error("Profile upsert error:", profileError)
        return {
            success: false,
            error: `Failed to save profile: ${profileError.message || "Unknown error"}`
        }
    }

    // 2. Insert/Update Skills (batch insert)
    if (data.skills && data.skills.length > 0) {
        const skillsToInsert = data.skills.map((skill: string, index: number) => ({
            user_id: userId,
            skill_name: skill,
            is_primary: index < 5,
        }))

        const { error: skillError } = await supabase
            .from("user_skills")
            .upsert(skillsToInsert, { onConflict: "user_id,skill_name" })
        if (skillError) {
            console.error("Skills insert error:", skillError)
        }
    }

    // 3. Insert/Update Interests (batch insert)
    if (data.interests && data.interests.length > 0) {
        const interestsToInsert = data.interests.map((interest: string) => ({
            user_id: userId,
            interest: interest
        }))

        const { error: interestError } = await supabase
            .from("user_interests")
            .upsert(interestsToInsert, { onConflict: "user_id,interest" })
        if (interestError) {
            console.error("Interests insert error:", interestError)
        }
    }

    // 4. Insert Experience (batch insert)
    if (data.experiences && data.experiences.length > 0) {
        const expsToInsert = data.experiences
            .filter((exp: { title?: string; company?: string }) => exp.title || exp.company)
            .map((exp: { title?: string; company?: string; description?: string }, index: number) => ({
                user_id: userId,
                title: exp.title || exp.company || "Untitled",
                company: exp.company || null,
                description: exp.description || null,
                start_date: exp.title || exp.company ? new Date().toISOString().split('T')[0] : null,
                is_current: true,
                order_index: index
            }))
        
        if (expsToInsert.length > 0) {
            const { error: expError } = await supabase
                .from("user_experiences")
                .upsert(expsToInsert, { onConflict: "user_id,title" })
            if (expError) {
                console.error("Experience insert error:", expError)
            }
        }
    }

    // Revalidate cached data
    try {
        revalidatePath("/dashboard")
        revalidatePath("/matches")
        revalidateByTag(CACHE_TAGS.PROFILES)
        revalidateByTag(CACHE_TAGS.USER_SKILLS)
        revalidateByTag(CACHE_TAGS.USER_INTERESTS)
    } catch (error) {
        console.error("Failed to revalidate:", error)
    }

    return { success: true, userId }
}

// Trigger embedding generation using server-side Supabase client (no token exposure)
export async function triggerEmbeddingGeneration(userId: string) {
    const supabase = await createClient()
    
    // Verify auth
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
        return { 
            success: false, 
            error: "Unable to verify user authentication"
        }
    }

    // Verify user owns this profile
    if (userData.user.id !== userId) {
        return {
            success: false,
            error: "Unauthorized to trigger embedding for this user"
        }
    }

    try {
        const { error: updateError } = await supabase
            .from("profile_embeddings")
            .upsert({
                user_id: userId,
                status: "pending",
                last_updated: new Date().toISOString()
            }, { onConflict: "user_id" })

        if (updateError) {
            console.error("Failed to update embedding status:", updateError)
            return {
                success: false,
                error: "Failed to initialize embedding generation"
            }
        }

        return { 
            success: true, 
            message: "Embedding generation started"
        }
    } catch (error) {
        console.error("Error triggering embedding generation:", error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error" 
        }
    }
}

// Check embedding status for a user
export async function getEmbeddingStatus(userId: string) {
    const supabase = await createClient()
    
    // Verify auth
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
        return { error: "Unable to verify user authentication" }
    }

    // Verify user owns this profile
    if (userData.user.id !== userId) {
        return {
            error: "Unauthorized to view embedding status for this user"
        }
    }

    const { data, error } = await supabase
        .from("profile_embeddings")
        .select("user_id, status, last_updated")
        .eq("user_id", userId)
        .single()

    if (error) {
        if (error.code === "PGRST116") {
            return { status: "not_found", user_id: userId }
        }
        console.error("Error fetching embedding status:", error)
        return { error: "Failed to fetch embedding status" }
    }

    return data
}
