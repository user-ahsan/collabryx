"use server"

import { createClient } from "@/lib/supabase/server"

export async function completeOnboarding(data: any, completionPercentage: number) {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
        throw new Error("Unable to verify user authentication. Please log in again.")
    }

    // 1. Update Profile
    const { error: profileError } = await supabase
        .from("profiles")
        .update({
            full_name: data.fullName,
            display_name: data.displayName || null,
            headline: data.headline,
            location: data.location || null,
            website_url: data.links && data.links.length > 0 ? JSON.stringify(data.links) : null,
            looking_for: data.goals || [],
            onboarding_completed: true,
            profile_completion: completionPercentage,
            updated_at: new Date().toISOString()
        })
        .eq("id", userData.user.id)

    if (profileError) {
        throw new Error(profileError.message || profileError.details || "Failed to save profile information.")
    }

    // 2. Insert Skills
    if (data.skills && data.skills.length > 0) {
        const skillsToInsert = data.skills.map((skill: string, index: number) => ({
            user_id: userData.user.id,
            skill_name: skill,
            is_primary: index < 5,
        }))

        const { error: skillsError } = await supabase.from("user_skills").insert(skillsToInsert)
        if (skillsError) console.error("Skills insert error:", skillsError)
    }

    // 3. Insert Interests
    if (data.interests && data.interests.length > 0) {
        const interestsToInsert = data.interests.map((interest: string) => ({
            user_id: userData.user.id,
            interest: interest
        }))

        const { error: interestsError } = await supabase.from("user_interests").insert(interestsToInsert)
        if (interestsError) console.error("Interests insert error:", interestsError)
    }

    // 4. Insert Experience
    if (data.experiences && data.experiences.length > 0) {
        const expsToInsert = data.experiences
            .filter((exp: any) => exp.title || exp.company)
            .map((exp: any) => ({
                user_id: userData.user.id,
                title: exp.title,
                company: exp.company,
                description: exp.description || null,
                start_date: new Date().toISOString(),
                is_current: true
            }))
        if (expsToInsert.length > 0) {
            const { error: expError } = await supabase.from("user_experiences").insert(expsToInsert)
            if (expError) console.error("Experience insert error:", expError)
        }
    }

    return { success: true }
}
