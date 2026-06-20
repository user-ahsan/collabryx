"use server"

import { createClient } from "@/lib/supabase/server"
import { completeTestUserOnboarding, isDevelopmentMode } from "@/lib/services/development"
import { cookies } from "next/headers"

type OnboardingRole = 'student' | 'investor' | 'founder' | 'professional' | 'mentor';

interface OnboardingData {
    fullName: string;
    displayName?: string;
    headline: string;
    location?: string;
    university?: string;
    avatarUrl?: string;
    bio?: string;
    collaborationReadiness?: "available" | "open" | "not-available";
    roles: OnboardingRole[];
    skills: Array<{
        id: string;
        label: string;
        proficiency: "beginner" | "intermediate" | "advanced" | "expert";
    }>;
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
    // Role-specific fields
    major?: string;
    graduation_year?: number | null;
    looking_for_team?: boolean;
    project_interests?: string[];
    check_size_min?: number | null;
    check_size_max?: number | null;
    stage_focus?: string[];
    sectors?: string[];
    portfolio_url?: string;
    investment_history_count?: number | null;
    accredited_investor?: boolean;
    company_name?: string;
    company_stage?: string | null;
    company_role?: string;
    team_size?: number | null;
    fundraising_stage?: string | null;
    hiring_needs?: string[];
    open_to_mentoring?: boolean;
    mentoring_areas?: string[];
    mentoring_format?: string | null;
    mentoring_availability_hours?: number | null;
}

export async function completeOnboarding(data: OnboardingData, completionPercentage: number) {
    const cookieStore = await cookies()
    const supabase = await createClient()
    let userId: string | null = null
    
    console.log('🎯 Starting onboarding completion flow...');
    
    // Debug: Check incoming cookies
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(c => c.name.includes('auth') || c.name.includes('token'))
    console.log('🍪 Auth cookies found:', authCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0
    })));
    
    // STEP 1: Get session FIRST (before any refresh attempts)
    console.log('📋 Checking initial session...');
    let { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    // Log session details for debugging
    console.log('🔍 Initial session check:', {
        hasSession: !!sessionData?.session,
        hasUser: !!sessionData?.session?.user,
        userId: sessionData?.session?.user?.id,
        email: sessionData?.session?.user?.email,
        expiresAt: sessionData?.session?.expires_at 
            ? new Date(sessionData.session.expires_at * 1000).toISOString()
            : 'N/A',
        sessionError: sessionError?.message
    });
    
    // STEP 2: If no session or expired, try to refresh
    if (!sessionData?.session || !sessionData.session.user) {
        console.log('⚠️ No valid session found, attempting refresh...');
        try {
            const refreshResult = await supabase.auth.refreshSession()
            console.log('🔄 Refresh result:', {
                success: !refreshResult.error,
                error: refreshResult.error?.message
            });
            
            // CRITICAL: Get session AGAIN after refresh
            if (!refreshResult.error) {
                const freshResult = await supabase.auth.getSession()
                sessionData = freshResult.data
                sessionError = freshResult.error
                
                console.log('🔍 Post-refresh session check:', {
                    hasSession: !!sessionData?.session,
                    hasUser: !!sessionData?.session?.user,
                    userId: sessionData?.session?.user?.id,
                    sessionError: sessionError?.message
                });
            }
        } catch (refreshError) {
            console.log('❌ Refresh failed:', 
                refreshError instanceof Error ? refreshError.message : 'Unknown error');
        }
    }
    
    // STEP 3: Use session if we have it
    if (sessionData?.session?.user) {
        userId = sessionData.session.user.id
        console.log('✅ Session-based auth successful:', userId);
    } else {
        // STEP 4: Last resort - getUser() (usually fails without session)
        console.log('⚠️ No session after refresh, trying getUser() as last resort...');
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        if (userData?.user) {
            userId = userData.user.id
            console.log('✅ getUser() succeeded:', userId);
        } else {
            // STEP 5: Handle specific error cases
            const errorMessage = userError?.message || sessionError?.message || 'Unknown authentication error'
            console.error('❌ All auth methods failed:', {
                sessionError: sessionError?.message,
                userError: userError?.message,
                fullError: errorMessage
            });
            
            // Check if it's an email confirmation issue
            if (errorMessage.includes("Email not confirmed") || errorMessage.includes("not confirmed")) {
                console.log('📧 Email not verified - this should have been handled by getSession()');
            }
            
            // Provide actionable error
            throw new Error(
                "Your session has expired or was not found. This can happen if:\n" +
                "- You've been inactive for too long\n" +
                "- You're using incognito mode with strict cookie settings\n" +
                "- Your browser blocked authentication cookies\n" +
                "- The session expired during onboarding\n\n" +
                "Please try logging in again, or use a regular browser window.\n" +
                "If the problem persists, clear your browser cookies and try again."
            )
        }
    }
    
    // Safety check
    if (!userId) {
        throw new Error("Unable to verify user authentication. Please log in again.")
    }
    
    // Get email from session
    const userEmail = sessionData?.session?.user?.email
    if (!userEmail) {
        throw new Error("Your account doesn't have an email address. Please contact support.")
    }
    
    console.log('✅ User authenticated for onboarding:', userId);

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
    if (isDevelopmentMode() && userEmail === "test123@collabryx.com") {
        const result = await completeTestUserOnboarding()
        if (!result.success) {
            throw new Error(result.error?.message || "Failed to complete onboarding in development mode.")
        }
        // Server action handles embedding generation
        return { success: true, userId, embeddingQueued: true }
    }

    // 1. Check display_name uniqueness (L4 fix)
    if (data.displayName) {
        const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("display_name", data.displayName)
            .neq("id", userId)
        
        if (count && count > 0) {
            return { 
                success: false, 
                error: "display_name: This display name is already taken. Please choose another one." 
            }
        }
    }
    
    // 2. Extract social links from links array
    const links = data.links || []
    const githubLink = links.find(l => l.platform === "github")
    const linkedinLink = links.find(l => l.platform === "linkedin")
    const twitterLink = links.find(l => l.platform === "twitter" || l.platform === "instagram")
    const portfolioLink = links.find(l => l.platform === "portfolio")

    // Validate role compatibility
    if (data.roles?.includes('student')) {
        const hasIncompatible = data.roles.some(r => r === 'professional' || r === 'mentor' || r === 'investor')
        if (hasIncompatible) {
            return {
                success: false,
                error: "roles: A student cannot also be a professional, mentor, or investor"
            }
        }
    }

    // Validate check sizes for investors
    if (data.roles?.includes('investor')) {
        const checkMin = data.check_size_min
        const checkMax = data.check_size_max
        if (checkMin !== undefined && checkMin !== null && checkMax !== undefined && checkMax !== null) {
            if (checkMax <= checkMin) {
                return {
                    success: false,
                    error: "check_size_max: Maximum check size must be higher than the minimum check size"
                }
            }
        }
    }

    // 2. Update Profile
    let profileError = null
    try {
        const roles = data.roles || []
        const result = await supabase
            .from("profiles")
            .upsert({
                id: userId,
                email: userEmail,
                full_name: data.fullName,
                display_name: data.displayName || null,
                headline: data.headline,
                bio: data.bio || null,
                location: data.location || null,
                university: data.university || null,
                avatar_url: data.avatarUrl || null,
                collaboration_readiness: data.collaborationReadiness || 'available',
                github_url: githubLink?.url || null,
                linkedin_url: linkedinLink?.url || null,
                twitter_url: twitterLink?.url || null,
                portfolio_url: portfolioLink?.url || null,
                website_url: portfolioLink?.url || null,
                looking_for: data.goals || [],
                profile_completion: completionPercentage,
                updated_at: new Date().toISOString(),
                // --- New role fields ---
                roles: roles,
                // Student fields
                major: data.major || null,
                graduation_year: data.graduation_year || null,
                looking_for_team: data.looking_for_team || false,
                project_interests: data.project_interests || [],
                // Investor fields
                check_size_min: data.check_size_min || null,
                check_size_max: data.check_size_max || null,
                stage_focus: data.stage_focus || [],
                sectors: data.sectors || [],
                investment_history_count: data.investment_history_count || 0,
                accredited_investor: data.accredited_investor || false,
                // Founder / Professional fields
                company_name: data.company_name || null,
                company_stage: data.company_stage || null,
                company_role: data.company_role || null,
                team_size: data.team_size || null,
                fundraising_stage: data.fundraising_stage || null,
                hiring_needs: data.hiring_needs || [],
                open_to_mentoring: data.open_to_mentoring || false,
                // Mentor fields
                mentoring_areas: data.mentoring_areas || [],
                mentoring_format: data.mentoring_format || null,
                mentoring_availability_hours: data.mentoring_availability_hours || null,
            }, { onConflict: "id" })
        profileError = result.error
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown database error"
        // Check if it's a trigger/constraint error
        if (errorMessage.includes("profile_embeddings") || errorMessage.includes("does not exist")) {
            console.error("Missing database table. Please run migration for profile_embeddings table.", error)
            throw new Error("Database setup incomplete. Please contact support or try again later. (Error: Missing table)")
        }
        throw new Error(`Database error: ${errorMessage}`)
    }

    if (profileError) {
        console.error("Profile upsert error:", profileError)
        throw new Error(`Failed to save profile: ${profileError.message || profileError.details || "Unknown error"}. Please try again or contact support if the problem persists.`)
    }

    // 3. Insert/Update Skills
    if (data.skills && data.skills.length > 0) {
        const skillsToInsert = data.skills.map((skill, index: number) => ({
            user_id: userId,
            skill_name: skill.label,
            proficiency: skill.proficiency,
            is_primary: index < 5,
        }))

        const { error: skillError } = await supabase
            .from("user_skills")
            .upsert(skillsToInsert, { onConflict: "user_id,skill_name" })
        if (skillError) {
            console.error("Skills insert error:", skillError)
            // Continue despite skill errors - not critical
        }
    }

    // 4. Insert/Update Interests
    if (data.interests && data.interests.length > 0) {
        const interestsToInsert = data.interests.map((interest) => ({
            user_id: userId,
            interest: interest
        }))

        const { error: interestError } = await supabase
            .from("user_interests")
            .upsert(interestsToInsert, { onConflict: "user_id,interest" })
        if (interestError) {
            console.error("Interests insert error:", interestError)
            // Continue despite interest errors - not critical
        }
    }

    // 5. Insert Experience
    if (data.experiences && data.experiences.length > 0) {
        const expsToInsert = data.experiences
            .filter((exp) => exp.title || exp.company)
            .map((exp) => ({
                user_id: userId,
                title: exp.title || exp.company || "Untitled",
                company: exp.company || null,
                description: exp.description || null,
                start_date: null,
                is_current: true,
                order_index: 0
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

    // 6. Mark onboarding as completed (deferred after all inserts succeed)
    const { error: flagError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq("id", userId)

    if (flagError) {
        console.error("Onboarding flag update error:", flagError)
        // Non-critical: profile was created, but flag wasn't set
    }

    // RELIABLE: Queue embedding request in database FIRST (source of truth)
    let embeddingQueuedInDb = false;
    try {
        console.log('📝 Queueing embedding request for user:', userId);
        const { data: queueData, error: queueError } = await supabase
            .rpc('queue_embedding_request', {
                p_user_id: userId,
                p_trigger_source: 'onboarding'
            });
        
        if (queueError) {
            // Check if it's a duplicate error (already queued)
            if (queueError.code === '23505' || queueError.message?.includes('already pending')) {
                console.log('⚠️ Embedding already queued for user:', userId);
                embeddingQueuedInDb = true; // Still considered queued
            } else {
                console.error('❌ Failed to queue embedding in DB:', queueError);
                // Don't fail onboarding, but log for monitoring
                // Background processor will handle it from the queue
            }
        } else {
            console.log('✅ Embedding queued successfully in DB:', queueData);
            embeddingQueuedInDb = true;
        }
    } catch (error) {
        console.error('❌ Embedding queue exception:', error);
        // Continue - DB queue is reliable, API trigger is best-effort
    }
    
    // THEN trigger API (best effort only - don't fail onboarding if this fails)
    let embeddingTriggered = false
    let embeddingError = null
    
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        console.log('🚀 Triggering embedding API for user:', userId);
        const response = await fetch(`${appUrl}/api/embeddings/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log('✅ Embedding API trigger successful');
            embeddingTriggered = true;
        } else {
            const errorText = await response.text();
            console.warn('⚠️ Embedding API returned non-OK status:', response.status, errorText);
            embeddingError = `API returned ${response.status}: ${errorText}`;
            // Don't fail - DB queue will handle it
        }
    } catch (error) {
        // Already queued in DB, background processor will handle
        embeddingError = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Embedding API trigger failed (DB queue will handle):', embeddingError);
    }

    return { 
        success: true, 
        userId, 
        embeddingQueued: embeddingTriggered,
        embeddingQueuedInDb: embeddingQueuedInDb, // DB queue is the reliable source
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
