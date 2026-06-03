import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { checkBot, shouldBlockBot } from "@/lib/bot-detection"
import { setCSRFToken } from "@/lib/csrf"

/**
 * Normalize DEVELOPMENT_MODE to handle different config formats.
 * Accepts: "true", "testing", "development" (case-insensitive).
 * Mirrors lib/services/development.ts normalizeDevMode for proxy.ts use
 * (can't import client-side module in middleware).
 */
function isDevMode(): boolean {
    const value = process.env.DEVELOPMENT_MODE
    if (!value) return false
    const normalized = value.toLowerCase().trim()
    return normalized === "true" || normalized === "testing" || normalized === "development"
}

export async function proxy(request: NextRequest) {
    // Skip if Supabase is not configured (during build or missing .env.local)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return NextResponse.next()
    }

    // Bot detection for suspicious paths
    const botResult = checkBot(request)
    if (shouldBlockBot(botResult)) {
        return NextResponse.json(
            { error: 'Access denied' },
            { status: 403, headers: { 'X-Bot-Score': botResult.score.toString() } }
        )
    }

    // Limit request body size for API routes (max 10MB)
    if (request.nextUrl.pathname.startsWith('/api')) {
        const contentLength = request.headers.get('content-length')
        
        if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Request body too large (max 10MB)' },
                { status: 413 }
            )
        }
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
            auth: {
                storageKey: 'supabase.auth.token',
            },
        }
    )

    // ===========================================
    // AUTH CHECK — two-tier for maximum performance
    // ===========================================
    // Tier 1: getClaims() validates JWT locally (~0ms, no network).
    // Use this for simple "is authenticated?" guarding.
    const { data: jwtData } = await supabase.auth.getClaims()
    const isAuthenticated = !!jwtData?.claims?.sub

    // Protected routes: redirect to login if not authenticated
    const protectedRoutes = [
        "/dashboard", "/assistant", "/matches", "/messages",
        "/my-profile", "/notifications", "/post", "/profile",
        "/requests", "/settings"
    ]

    let isAuthRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    // Onboarding requires auth in production; skippable in dev mode
    if (request.nextUrl.pathname.startsWith("/onboarding")) {
        if (!isDevMode()) {
            isAuthRoute = true
        }
    }

    if (!isAuthenticated && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
    }

    // ===========================================
    // EMAIL VERIFICATION + ONBOARDING GATES
    // Tier 2: getUser() makes a network call — only call when we
    // need actual user data (email, profile checks). Avoid at all
    // costs for simple auth guards.
    //
    // NOTE: `user` is hoisted to function scope (let) so it's available
    // for the public-auth-route redirect below (/login, /register).
    // Those routes aren't in protectedRoutes, so isAuthRoute=false for them
    // and the getUser() call here wouldn't fire without this guard.
    // ===========================================
    let user: import("@supabase/supabase-js").User | null = null

    if (isAuthenticated) {
        const { data: { user: userData } } = await supabase.auth.getUser()
        user = userData

        if (isAuthRoute) {
            // Email verification gate
            const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === "true"
            const emailNotConfirmed = user && !user.email_confirmed_at

            if (!skipEmailVerification && emailNotConfirmed) {
                if (!request.nextUrl.pathname.startsWith("/verify-email") && !request.nextUrl.pathname.startsWith("/auth-sync")) {
                    const url = request.nextUrl.clone()
                    url.pathname = "/verify-email"
                    const redirectResponse = NextResponse.redirect(url)
                    supabaseResponse.cookies.getAll().forEach(cookie => {
                        redirectResponse.cookies.set(cookie.name, cookie.value)
                    })
                    return redirectResponse
                }
            }

            // Onboarding check (dev mode only — auth-sync handles production)
            if (user && !request.nextUrl.pathname.startsWith("/onboarding") && !request.nextUrl.pathname.startsWith("/auth-sync") && isDevMode()) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("onboarding_completed")
                    .eq("id", user.id)
                    .single()

                if (!profile || profile.onboarding_completed !== true) {
                    const url = request.nextUrl.clone()
                    url.pathname = "/onboarding"
                    const redirectResponse = NextResponse.redirect(url)
                    supabaseResponse.cookies.getAll().forEach(cookie => {
                        redirectResponse.cookies.set(cookie.name, cookie.value)
                    })
                    return redirectResponse
                }
            }
        }
    }

    // Redirect authenticated users away from login/register to auth-sync
    // auth-sync is the single entry point that handles routing to:
    //   - onboarding (if profile not completed)
    //   - verify-email (if email not confirmed and SKIP_EMAIL_VERIFICATION is false)
    //   - dashboard (if everything is complete)
    const isPublicAuthRoute =
        request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/register"

    if (user && isPublicAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth-sync"
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
    }

    // Set CSRF token cookie for double-submit pattern (httpOnly: false so client JS can read it)
    const csrfToken = await setCSRFToken()
    supabaseResponse.cookies.set("csrf_token", csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
    })

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
