// ─── Consolidated Mock Data & Types for Dashboard ────────────────────────────
// All hardcoded fallback data lives here. Components import from this file
// instead of defining their own DEFAULT_* / DUMMY_* arrays.

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Post {
    id: string
    authorId?: string
    author: string
    role: string
    time: string
    content: string
    avatar: string
    initials: string
    postType?: "project-launch" | "teammate-request" | "announcement" | "general"
    hasMedia?: boolean
    mediaType?: "image" | "video"
    mediaUrls?: string[]
    hasLink?: boolean
    linkUrl?: string
    myReaction?: string | null
}

export interface MatchReason {
    type: "skill" | "interest" | "availability"
    label: string
}

export interface MatchSuggestion {
    id: string
    name: string
    role: string
    avatar: string
    initials: string
    matchPercentage: number
    reasons: MatchReason[]
}

export interface MatchActivity {
    id: string
    type: "profile_view" | "building_match" | "skill_match"
    userName: string
    userAvatar: string
    userInitials: string
    matchPercentage: number
    activity: string
}

export interface Comment {
    id: string
    author: {
        name: string
        avatar: string
        initials: string
    }
    content: string
    timestamp: string
    likes: number
    liked?: boolean
}

// ─── Mock Posts ───────────────────────────────────────────────────────────────

export const MOCK_POSTS: Post[] = [
    {
        id: "post-4",
        authorId: "user-mr-4",
        author: "Maria Rodriguez",
        role: "Startup Founder",
        time: "1h ago",
        content: "🚀 Just launched our beta! We're building an AI-powered study planner for students. Looking for a frontend developer and a marketing lead to join our core team. DM me if interested! #startup #teambuilding #edtech",
        avatar: "/avatars/05.png",
        initials: "MR",
        postType: "project-launch",
        hasMedia: false,
        myReaction: null,
    },
    {
        id: "post-5",
        authorId: "user-jp-5",
        author: "James Patterson",
        role: "Backend Developer",
        time: "90min ago",
        content: "👋 Seeking a UI/UX designer for a fintech project I'm working on. Must have experience with Figma and designing for mobile apps. Part-time commitment for the next 8 weeks. Let's build something amazing together!",
        avatar: "/avatars/06.png",
        initials: "JP",
        postType: "teammate-request",
        hasMedia: false,
        myReaction: null,
    },
    {
        id: "post-1",
        authorId: "user-aj-1",
        author: "Alex Johnson",
        role: "Product Designer",
        time: "2h ago",
        content: "Just launched a new feature for our collaborative workspace! 🚀 Super excited to see how teams use the new real-time whiteboard. #productdesign #collaboration #startup",
        avatar: "/avatars/02.png",
        initials: "AJ",
        postType: "general",
        hasMedia: true,
        mediaType: "image",
        mediaUrls: [
            "https://images.unsplash.com/photo-1531403009284-440f8804f1e9?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1000"
        ],
        hasLink: false,
        myReaction: null,
    },
    {
        id: "post-2",
        authorId: "user-sm-2",
        author: "Sarah Miller",
        role: "Growth Lead",
        time: "4h ago",
        content: "Check out this interesting article about the future of remote work. @davidchen what do you think?",
        avatar: "/avatars/03.png",
        initials: "SM",
        postType: "general",
        hasMedia: false,
        hasLink: true,
        linkUrl: "https://example.com/remote-work-future",
        myReaction: null,
    },
    {
        id: "post-3",
        authorId: "user-dc-3",
        author: "David Chen",
        role: "Full Stack Dev",
        time: "6h ago",
        content: "Refactoring the entire caching layer today. Coffee is my best friend right now. ☕️ #coding #devlife",
        avatar: "/avatars/04.png",
        initials: "DC",
        postType: "general",
        hasMedia: false,
        myReaction: null,
    },
]

// ─── Mock Matches ────────────────────────────────────────────────────────────

export const MOCK_MATCHES: MatchSuggestion[] = [
    {
        id: "1",
        name: "Sarah Miller",
        role: "Marketing Lead",
        matchPercentage: 91,
        avatar: "/avatars/02.png",
        initials: "SM",
        reasons: [
            { type: "skill", label: "Complementary Skills" },
            { type: "interest", label: "Shared Interest: Startups" },
        ],
    },
    {
        id: "2",
        name: "David Chen",
        role: "Full Stack Developer",
        matchPercentage: 87,
        avatar: "/avatars/03.png",
        initials: "DC",
        reasons: [
            { type: "interest", label: "Shared Interest: Fintech" },
            { type: "availability", label: "Similar Availability" },
        ],
    },
    {
        id: "3",
        name: "Emily Zhang",
        role: "UX Researcher",
        matchPercentage: 84,
        avatar: "/avatars/04.png",
        initials: "EZ",
        reasons: [
            { type: "skill", label: "Needs Tech Co-Founder" },
            { type: "interest", label: "Building MVP" },
        ],
    },
]

// ─── Mock Match Activity ─────────────────────────────────────────────────────

export const MOCK_MATCH_ACTIVITY: MatchActivity[] = [
    {
        id: "1",
        type: "profile_view",
        userName: "Emily Zhang",
        userAvatar: "/avatars/04.png",
        userInitials: "EZ",
        matchPercentage: 84,
        activity: "viewed your profile",
    },
    {
        id: "2",
        type: "building_match",
        userName: "David Chen",
        userAvatar: "/avatars/03.png",
        userInitials: "DC",
        matchPercentage: 87,
        activity: "is building an MVP you may fit",
    },
]

// ─── Mock Comments ───────────────────────────────────────────────────────────

export const MOCK_COMMENTS: Comment[] = [
    {
        id: "c1",
        author: {
            name: "Sarah Miller",
            avatar: "/avatars/02.png",
            initials: "SM",
        },
        content: "This looks amazing! Can't wait to try it out.",
        timestamp: "1h ago",
        likes: 4,
        liked: true,
    },
    {
        id: "c2",
        author: {
            name: "David Chen",
            avatar: "/avatars/03.png",
            initials: "DC",
        },
        content: "Great work team! 🚀 The UI is silky smooth.",
        timestamp: "45m ago",
        likes: 2,
    },
]

// ─── Mock AI Contexts ────────────────────────────────────────────────────────

export const MOCK_AI_CONTEXTS: string[] = [
    "Fintech interest",
    "Python backend skills",
    "MVP-stage availability",
]

// ─── Post Type Badge Utility ─────────────────────────────────────────────────

import { Rocket, UserPlus, Megaphone } from "lucide-react"

export const POST_TYPE_BADGES: Record<
    string,
    { label: string; icon: typeof Rocket; color: string }
> = {
    "project-launch": {
        label: "Project Launch",
        icon: Rocket,
        color: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    },
    "teammate-request": {
        label: "Looking for Teammates",
        icon: UserPlus,
        color: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    },
    announcement: {
        label: "Announcement",
        icon: Megaphone,
        color: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    },
}

export function getPostTypeBadge(postType?: string) {
    if (!postType || !POST_TYPE_BADGES[postType]) return null
    return POST_TYPE_BADGES[postType]
}

// ─── Sort utility ────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = {
    "project-launch": 0,
    "teammate-request": 1,
    announcement: 2,
    general: 3,
}

export function sortPostsByPriority(posts: Post[]): Post[] {
    return [...posts].sort((a, b) => {
        const aPriority = PRIORITY_ORDER[a.postType || "general"] ?? 3
        const bPriority = PRIORITY_ORDER[b.postType || "general"] ?? 3
        return aPriority - bPriority
    })
}
