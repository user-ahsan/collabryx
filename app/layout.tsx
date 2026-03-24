import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { VercelAnalytics } from "@/components/providers/vercel-analytics";
import { validateEnv } from "@/lib/validate-env";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Collabryx - Innovate. Collaborate. Create.",
    template: "%s | Collabryx",
  },
  description: "The ultimate collaboration platform for modern teams. Connect, create, and innovate together with AI-powered matching and real-time collaboration tools.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://collabryx.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Collabryx - Innovate. Collaborate. Create.",
    description: "The ultimate collaboration platform for modern teams.",
    siteName: "Collabryx",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Collabryx",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Collabryx - Innovate. Collaborate. Create.",
    description: "The ultimate collaboration platform for modern teams.",
    images: ["/og-image.png"],
    creator: "@collabryx",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Validate environment in development and production
  if (process.env.NODE_ENV === 'development') {
    validateEnv()
  }
  
  // In production, validate critical env vars at runtime
  if (process.env.NODE_ENV === 'production') {
    try {
      validateEnv()
    } catch {
      console.error('❌ Production environment validation failed:', error)
      // Don't throw in production - let app continue with degraded functionality
    }
  }
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        <PostHogProvider>
          <SmoothScrollProvider>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange={false}
              >
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:rounded-md focus:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Skip to main content
                </a>
                {children}
                <Toaster richColors position="top-right" />
                <VercelAnalytics />
              </ThemeProvider>
            </QueryProvider>
          </SmoothScrollProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
