import { Feed } from "@/components/features/dashboard/feed"
import { SuggestionsSidebar } from "@/components/features/dashboard/suggestions-sidebar"
import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/lib/mock-data/dashboard"

export default async function DashboardPage() {
    let initialPosts: Post[] = []

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data, error } = await supabase
                .from("posts")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20)

            if (!error && data && data.length > 0) {
                initialPosts = data.map((r: Record<string, unknown>) => ({
                    id: String(r.id),
                    authorId: r.author_id ? String(r.author_id) : undefined,
                    author: String(r.author_name ?? "Unknown"),
                    role: String(r.author_role ?? ""),
                    time: String(r.time_ago ?? ""),
                    content: String(r.content ?? ""),
                    avatar: String(r.author_avatar ?? ""),
                    initials: String(r.author_name ?? "U").slice(0, 2).toUpperCase(),
                    postType: (r.post_type as Post["postType"]) || "general",
                    hasMedia: Boolean(r.media_url || r.media_urls),
                    mediaType: (r.media_type as Post["mediaType"]) || undefined,
                    mediaUrls: r.media_urls ? (r.media_urls as string[]) : (r.media_url ? [String(r.media_url)] : undefined),
                    hasLink: Boolean(r.link_url),
                    linkUrl: r.link_url ? String(r.link_url) : undefined,
                    myReaction: null,
                }))
            }
        }
    } catch (err) {
        console.error("Failed to fetch posts server-side:", err)
    }

    return (
        <div className="container max-w-7xl mx-auto py-2 md:py-6 px-2 md:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-8 max-w-2xl mx-auto lg:mx-0 lg:max-w-none w-full">
                    <Feed initialPosts={initialPosts} />
                </div>
                <div className="hidden lg:block lg:col-span-4 sticky top-6">
                    <SuggestionsSidebar />
                </div>
            </div>
        </div>
    )
}
