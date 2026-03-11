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

    // In development mode with test user, use the development service
    if (isDevelopmentMode() && userData.user.email === "test123@collabryx.com") {
        const result = await completeTestUserOnboarding()
        if (!result.success) {
            throw new Error(result.error?.message || "Failed to complete onboarding in development mode.")
        }
        return { success: true }
    }

    // 1. Update Profile
    const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
            id: userData.user.id,
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
            user_id: userData.user.id,
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
                    user_id: userData.user.id,
                    interest: interest
                }, { onConflict: "user_id,interest" })
        }
    }

    // 4. Insert Experience
    if (data.experiences && data.experiences.length > 0) {
        const expsToInsert = data.experiences
            .filter((exp) => exp.title || exp.compunknown)
            .map((exp) => ({
                user_id: userData.user.id,
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

    return { success: true }
}
