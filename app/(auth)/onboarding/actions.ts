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
        company?: string;
        description?: string;
    }[];
    links?: {
        platform: string;
        url?: string;
    }[];
}

export async function completeOnboarding(data: OnboardingData, completionPercentage: number) {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
        throw new Error("Unable to verify user authentication. Please log in again.")
    }

    const userId = userData.user.id

    // Check if onboarding already completed
    const { data: existingProfile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", userId)
        .single()

    if (existingProfile?.onboarding_completed === true) {
        // Already completed, just return success with flag
        return { success: true, userId, alreadyCompleted: true }
    }

    // In development mode with test user, use the development service
    if (isDevelopmentMode() && userData.user.email === "test123@collabryx.com") {
        const result = await completeTestUserOnboarding()
        if (!result.success) {
            throw new Error(result.error?.message || "Failed to complete onboarding in development mode.")
        }
        // Server action handles embedding generation
        return { success: true, userId, embeddingQueued: true }
    }

    // 1. Update Profile
    const userEmail = userData.user.email
    if (!userEmail) {
        throw new Error("Your account doesn't have an email address. Please contact support.")
    }
    
    let profileError = null
    try {
        const validLinks = data.links?.filter(l => l.url && l.url.trim()) || []
        const result = await supabase
            .from("profiles")
            .upsert({
                id: userId,
                email: userEmail,
                full_name: data.fullName,
                display_name: data.displayName || null,
                headline: data.headline,
                location: data.location || null,
                website_url: validLinks.length > 0 ? JSON.stringify(validLinks) : null,
                looking_for: data.goals || [],
                onboarding_completed: true,
                profile_completion: completionPercentage,
                updated_at: new Date().toISOString()
            }, { onConflict: "id" })
        profileError = result.error
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown database error"
        // Check if it's a trigger/constraint error
        if (errorMessage.includes("profile_embeddings") || errorMessage.includes("does not exist")) {
            console.error("Missing database table. Please run migration for profile_embeddings table.", err)
            throw new Error("Database setup incomplete. Please contact support or try again later. (Error: Missing table)")
        }
        throw new Error(`Database error: ${errorMessage}`)
    }

    if (profileError) {
        console.error("Profile upsert error:", profileError)
        throw new Error(`Failed to save profile: ${profileError.message || profileError.details || "Unknown error"}. Please try again or contact support if the problem persists.`)
    }

    // 2. Insert/Update Skills
    if (data.skills && data.skills.length > 0) {
        const skillsToInsert = data.skills.map((skill: string, index: number) => ({
            user_id: userId,
            skill_name: skill,
            is_primary: index < 5,
        }))

        for (const skill of skillsToInsert) {
            const { error: skillError } = await supabase
                .from("user_skills")
                .upsert(skill, { onConflict: "user_id,skill_name" })
            if (skillError) {
                console.error("Skills insert error:", skillError)
                // Continue despite skill errors - not critical
            }
        }
    }

    // 3. Insert/Update Interests
    if (data.interests && data.interests.length > 0) {
        for (const interest of data.interests) {
            const { error: interestError } = await supabase
                .from("user_interests")
                .upsert({
                    user_id: userId,
                    interest: interest
                }, { onConflict: "user_id,interest" })
            if (interestError) {
                console.error("Interests insert error:", interestError)
                // Continue despite interest errors - not critical
            }
        }
    }

    // 4. Insert Experience
    if (data.experiences && data.experiences.length > 0) {
        const expsToInsert = data.experiences
            .filter((exp) => exp.title || exp.company)
            .map((exp) => ({
                user_id: userId,
                title: exp.title || exp.company || "Untitled",
                company: exp.company || null,
                description: exp.description || null,
                start_date: exp.title || exp.company ? new Date().toISOString().split('T')[0] : null,
                is_current: true,
                order_index: 0
            }))
        if (expsToInsert.length > 0) {
            for (const exp of expsToInsert) {
                const { error: expError } = await supabase
                    .from("user_experiences")
                    .upsert(exp, { onConflict: "user_id,title" })
                if (expError) {
                    console.error("Experience insert error:", expError)
                }
            }
        }
    }

    // RELIABLE: Queue embedding request in database FIRST (source of truth)
    try {
        const { data: queueData, error: queueError } = await supabase
            .rpc('queue_embedding_request', {
                p_user_id: userId,
                p_trigger_source: 'onboarding'
            });
        
        if (queueError) {
            console.error('Failed to queue embedding:', queueError);
            // Don't fail onboarding, but log for monitoring
            // Background processor will handle it from the queue
        } else {
            console.log('Embedding queued successfully in DB:', queueData);
        }
    } catch (error) {
        console.error('Embedding queue exception:', error);
        // Continue - DB queue is reliable, API trigger is best-effort
    }
    
    // THEN trigger API (best effort only - don't fail onboarding if this fails)
    let embeddingTriggered = false
    let embeddingError = null
    
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        await fetch(`${appUrl}/api/embeddings/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Embedding API trigger successful');
        embeddingTriggered = true
    } catch (error) {
        // Already queued in DB, background processor will handle
        embeddingError = error instanceof Error ? error.message : 'Unknown error';
        console.error('Embedding API trigger failed (DB queue will handle):', embeddingError);
    }

    return { 
        success: true, 
        userId, 
        embeddingQueued: embeddingTriggered,
        embeddingError: embeddingError // Return error for monitoring
    }
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
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        
        // Call the Next.js API route to generate embedding
        const response = await fetch(`${appUrl}/api/embeddings/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Pass auth token via standard Authorization header
                "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ user_id: userId }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("API route error:", errorText)
            return { success: false, message: errorText }
        }

        const data = await response.json()
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
