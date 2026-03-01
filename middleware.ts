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
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected routes: redirect to login if not authenticated
    const isAuthRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/assistant") ||
        request.nextUrl.pathname.startsWith("/matches") ||
        request.nextUrl.pathname.startsWith("/messages") ||
        request.nextUrl.pathname.startsWith("/my-profile") ||
        request.nextUrl.pathname.startsWith("/notifications") ||
        request.nextUrl.pathname.startsWith("/onboarding") ||
        request.nextUrl.pathname.startsWith("/post") ||
        request.nextUrl.pathname.startsWith("/profile") ||
        request.nextUrl.pathname.startsWith("/requests") ||
        request.nextUrl.pathname.startsWith("/settings")

    if (!user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from login/register
    const isPublicAuthRoute =
        request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/register"

    if (user && isPublicAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
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
