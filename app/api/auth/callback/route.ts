import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { devLog, isDebugEnabled } from "@/lib/services/development"

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/dashboard"
    
    const timestamp = new Date().toISOString()
    const isDebug = isDebugEnabled()

    if (isDebug) {
        devLog("auth", "=== AUTH CALLBACK RECEIVED ===", {
            url: request.url,
            hasCode: !!code,
            nextParam: next,
            timestamp,
        })
    }

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
            // Get user info to check email verification status
            const { data: { user } } = await supabase.auth.getUser()
            
            if (isDebug) {
                devLog("auth", "✅ Auth callback successful - session exchanged", {
                    userId: user?.id,
                    email: user?.email,
                    emailConfirmedAt: user?.email_confirmed_at,
                    isEmailVerified: !!user?.email_confirmed_at,
                    redirecting_to: next,
                    timestamp,
                })
            }
            
            // Log email verification status for debugging
            if (user && isDebug) {
                const verificationStatus = user.email_confirmed_at ? "VERIFIED" : "NOT_VERIFIED"
                devLog("auth", `📧 Email verification status: ${verificationStatus}`, {
                    email: user.email,
                    confirmedAt: user.email_confirmed_at,
                    willRedirectTo: next,
                })
            }
            
            const forwardedHost = request.headers.get("x-forwarded-host")
            const isLocalEnv = process.env.NODE_ENV === "development"
            
            if (isDebug) {
                devLog("auth", "🚀 Executing redirect", {
                    isLocalEnv,
                    hasForwardedHost: !!forwardedHost,
                    destination: `${origin}${next}`,
                })
            }
            
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            // Log error with full details for debugging
            if (isDebug) {
                devLog("auth", "❌ Auth callback error - exchangeCodeForSession failed", {
                    error_message: error.message,
                    error_status: error.status,
                    error_code: error.code,
                    timestamp,
                    url: request.url,
                    next: next,
                })
            }
            
            // Send to external monitoring if configured (Sentry, etc.)
            if (process.env.SENTRY_DSN) {
                // Example Sentry integration (uncomment when Sentry is configured)
                // await import('@sentry/nextjs').then(Sentry => {
                //     Sentry.captureException(error, {
                //         tags: { type: 'auth_callback_error' },
                //         extra: { url: request.url, next }
                //     })
                // })
                if (isDebug) {
                    devLog("auth", "📊 Error would be sent to Sentry (if configured)")
                }
            }
            
            // Redirect with error message for user
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`
            )
        }
    }

    // Missing code parameter - log the issue
    if (isDebug) {
        devLog("auth", "❌ Auth callback missing code parameter", {
            url: request.url,
            searchParams: Object.fromEntries(searchParams),
            timestamp,
        })
    }
    
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
