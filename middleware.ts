import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    // Skip if Supabase is not configured (during build or missing .env.local)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return NextResponse.next()
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
        }
    )

    // IMPORTANT: Do NOT use getSession() here.
    // getUser() sends a request to the Supabase Auth server every time
    // to revalidate the Auth token — getSession() reads from cookies
    // which could be tampered with.
    let {
        data: { user },
    } = await supabase.auth.getUser()

    // Auto-login for development mode
    if (!user && process.env.DEVELOPMENT_MODE === "true") {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: "test@collabryx.com",
            password: "test123",
        })

        if (!error && authData.user) {
            user = authData.user
        }
    }

    // Protected routes: redirect to login if not authenticated
    const protectedRoutes = [
        "/dashboard", "/assistant", "/matches", "/messages",
        "/my-profile", "/notifications", "/post", "/profile",
        "/requests", "/settings"
    ]

    let isAuthRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    // Onboarding requires auth unless DEVELOPMENT_MODE is true
    if (request.nextUrl.pathname.startsWith("/onboarding")) {
        if (process.env.DEVELOPMENT_MODE !== "true") {
            isAuthRoute = true
        }
    }

    if (!user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
    }

    // Check onboarding status for authenticated users trying to access protected routes
    if (user && isAuthRoute && !request.nextUrl.pathname.startsWith("/onboarding")) {
        // Skip check if in DEVELOPMENT_MODE
        if (process.env.DEVELOPMENT_MODE !== "true") {
            const { data: profile } = await supabase
                .from("profiles")
                .select("onboarding_completed")
                .eq("id", user.id)
                .single()

            if (profile && profile.onboarding_completed === false) {
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

    // Redirect authenticated users away from login/register
    const isPublicAuthRoute =
        request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/register"

    if (user && isPublicAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
    }

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
