import { PostDetailView } from "@/components/features/dashboard/post-detail-view"

// Mock Data for the demo
const MOCK_POST = {
    id: 1,
    author: "Alex Johnson",
    role: "Product Designer",
    time: "2h ago",
    content: "Just launched a new feature for our collaborative workspace! 🚀\n\nSuper excited to see how teams use the new real-time whiteboard. The latency has been optimized to sub-50ms globally, which was a huge engineering challenge.\n\nBig shoutout to the infrastructure team for pulling this off! #productdesign #collaboration #startup #engineering",
    avatar: "/avatars/02.png",
    initials: "AJ",
    hasMedia: true,
    mediaType: 'image' as const,
    mediaUrl: "https://images.unsplash.com/photo-1531403009284-440f8804f1e9?auto=format&fit=crop&q=80&w=1200",
    hasLink: false,
    stats: {
        likes: 42,
        comments: 12,
        shares: 5
    }
}

export default function PostPage({ params }: { params: { id: string } }) {
    return (
        <div className="min-h-screen bg-background md:bg-muted/10 md:py-8">
            <PostDetailView post={MOCK_POST} />
        </div>
    )
}
