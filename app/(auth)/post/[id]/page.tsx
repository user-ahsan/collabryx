import { PostDetailView } from "@/components/features/dashboard/posts/post-detail-view"
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: postId } = await params
    const supabase = await createClient()
    
    const { data: post } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:user_id (
                full_name,
                headline,
                avatar_url
            )
        `)
        .eq('id', postId)
        .single()
    
    if (!post) {
        notFound()
    }
    
    // Guard clause for missing profile data
    if (!post.profiles) {
        notFound()
    }
    
    const formattedPost = {
        id: parseInt(post.id),
        author: post.profiles.full_name ?? 'Unknown User',
        role: post.profiles.headline ?? 'User',
        time: new Date(post.created_at).toLocaleDateString(),
        content: post.content,
        avatar: post.profiles.avatar_url ?? '',
        initials: post.profiles.full_name
            ? post.profiles.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            : 'U',
        hasMedia: !!post.media_url,
        mediaType: post.media_type as 'image' | 'video' | undefined,
        mediaUrl: post.media_url || undefined,
        hasLink: !!post.link_url,
        linkUrl: post.link_url || undefined,
        stats: {
            likes: post.reaction_count || 0,
            comments: post.comment_count || 0,
            shares: post.share_count || 0
        }
    }
    
    return (
        <div className="min-h-screen bg-background md:bg-muted/10 md:py-8">
            <PostDetailView post={formattedPost} />
        </div>
    )
}
