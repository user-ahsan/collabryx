import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/dashboard"

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
            // Log successful authentication
            console.log('✅ Auth callback successful:', {
                redirecting_to: next,
                timestamp: new Date().toISOString(),
                is_production: process.env.NODE_ENV === 'production',
            })
            
            const forwardedHost = request.headers.get("x-forwarded-host")
            const isLocalEnv = process.env.NODE_ENV === "development"
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            // Log error with full details for debugging
            console.error('❌ Auth callback error:', {
                error_message: error.message,
                error_status: error.status,
                error_code: error.code,
                timestamp: new Date().toISOString(),
                url: request.url,
                next: next,
            })
            
            // Send to external monitoring if configured (Sentry, etc.)
            if (process.env.SENTRY_DSN) {
                // Example Sentry integration (uncomment when Sentry is configured)
                // await import('@sentry/nextjs').then(Sentry => {
                //     Sentry.captureException(error, {
                //         tags: { type: 'auth_callback_error' },
                //         extra: { url: request.url, next }
                //     })
                // })
                console.log('📊 Error would be sent to Sentry (if configured)')
            }
            
            // Redirect with error message for user
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`
            )
        }
    }

    // Missing code parameter - log the issue
    console.error('❌ Auth callback missing code parameter:', {
        url: request.url,
        searchParams: Object.fromEntries(searchParams),
        timestamp: new Date().toISOString(),
    })
    
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
