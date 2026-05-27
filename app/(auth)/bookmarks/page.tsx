import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Bookmark, MessageCircle, Heart, Share2, ExternalLink, Filter } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

interface BookmarkedPost {
  id: string
  content: string
  created_at: string
  reaction_count: number
  comment_count: number
  share_count: number
  profiles: {
    full_name: string | null
    headline: string | null
    avatar_url: string | null
  } | null
}

function getInitials(name: string | null): string {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default async function BookmarksPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Fetch posts that have been bookmarked (reactions with bookmark emoji by this user)
  const { data: bookmarkedPosts } = await supabase
    .from("post_reactions")
    .select(`
      post_id,
      posts!inner (
        id,
        content,
        created_at,
        reaction_count,
        comment_count,
        share_count,
        profiles:user_id (
          full_name,
          headline,
          avatar_url
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("emoji", "🔖")
    .order("created_at", { ascending: false })

  const bookmarks: BookmarkedPost[] = ((bookmarkedPosts ?? []) as unknown as Array<{ posts: BookmarkedPost[] }>)
    .flatMap((item) => item.posts ?? [])

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Bookmarks</h1>
            <p className="text-muted-foreground">
              Save and organize content you want to reference later
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
            <p className="text-muted-foreground mb-4">
              Save articles and posts to view them here
            </p>
            <Button asChild>
              <Link href="/dashboard">Explore Content</Link>
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <GlassCard key={bookmark.id}>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-primary">
                    {getInitials(bookmark.profiles?.full_name ?? null)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                        {bookmark.content}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {bookmark.profiles?.full_name ?? "Unknown User"} &bull;{" "}
                        {new Date(bookmark.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                      <Bookmark className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {bookmark.content}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      {bookmark.reaction_count}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      {bookmark.comment_count}
                    </span>
                    <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                    <Link
                      href={`/post/${bookmark.id}`}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View
                    </Link>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
