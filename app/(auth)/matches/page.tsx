"use client"

import { MatchCard } from "@/components/features/matches/match-card"
import { MatchCardListView } from "@/components/features/matches/match-card-list-view"
import { MatchContextHeader } from "@/components/features/matches/match-context-header"
import { MatchFilters } from "@/components/features/matches/match-filters"
import { useState } from "react"
import { toast } from "sonner"

type ViewMode = "grid" | "list"

// Dummy data for visual verification
const MATCHES = [
    {
        id: "1",
        name: "Sarah Chen",
        role: "Full Stack Developer",
        avatar: "/avatars/01.png",
        compatibility: 96,
        skills: ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL"],
        bio: "Passionate about building scalable web applications and exploring AI integration. Looking for a designer to partner with on a SaaS idea.",
        insights: [
            { type: "complementary" as const, text: "Complementary Skills: Backend & Cloud" },
            { type: "shared" as const, text: "Shared Interest: AI Integration" }
        ]
    },
    {
        id: "2",
        name: "Alex Rivera",
        role: "UI/UX Designer",
        avatar: "/avatars/02.png",
        compatibility: 94,
        skills: ["Figma", "Tailwind CSS", "User Research", "Prototyping"],
        bio: "I create intuitive and beautiful user experiences. Love working with developers who care about the details.",
        insights: [
            { type: "complementary" as const, text: "Strong Design-Dev Synergy" },
            { type: "similar" as const, text: "Similar Goals: SaaS Product" }
        ]
    },
    {
        id: "3",
        name: "James Wilson",
        role: "Product Manager",
        avatar: "/avatars/03.png",
        compatibility: 89,
        skills: ["Agile", "Strategy", "User Stories", "Analytics", "Jira"],
        bio: "Experienced PM looking to join a high-growth startup or find technical co-founders. Let's build something users love.",
        insights: [
            { type: "complementary" as const, text: "Business Strategy Expert" },
            { type: "shared" as const, text: "Shared Interest: Fintech" }
        ]
    },
    {
        id: "4",
        name: "Emily Zhang",
        role: "AI Researcher",
        avatar: "/avatars/04.png",
        compatibility: 91,
        skills: ["Python", "PyTorch", "NLP", "Computer Vision"],
        bio: "PhD student specializing in large language models. Interested in applying generative AI to creative tools.",
        insights: [
            { type: "shared" as const, text: "Deep AI Knowledge" },
            { type: "similar" as const, text: "Research-Driven Approach" }
        ]
    },
    {
        id: "5",
        name: "Michael Brown",
        role: "Frontend Engineer",
        avatar: "/avatars/05.png",
        compatibility: 78,
        skills: ["React", "Vue", "JavaScript", "Animation", "Three.js"],
        bio: "Frontend wizard who loves bringing designs to life with smooth animations and interactive 3D elements.",
        insights: [
            { type: "complementary" as const, text: "Frontend Specialization" }
        ]
    },
    {
        id: "6",
        name: "Jessica Lee",
        role: "Marketing Specialist",
        avatar: "/avatars/06.png",
        compatibility: 75,
        skills: ["SEO", "Content Marketing", "Social Media", "Analysis"],
        bio: "Helping startups find their voice and reach their audience. Expert in growth hacking and community building.",
        insights: [
            { type: "complementary" as const, text: "Growth & Marketing Lead" }
        ]
    },
]


export default function MatchesPage() {
    const [preferences, setPreferences] = useState({
        role: "CTO",
        industry: "Fintech",
        type: "Startup"
    })

    const [viewMode, setViewMode] = useState<ViewMode>("grid")

    const handleUpdatePreferences = (newPrefs: { role: string; industry: string; type: string }) => {
        setPreferences(newPrefs)
        // Simulate "finding people" logic
        toast("Preferences Updated", {
            description: `Looking for ${newPrefs.role} in ${newPrefs.industry}...`,
        })
    }

    return (
        <div className="w-full min-h-screen bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1400px]">
                {/* Header Section */}
                <MatchContextHeader
                    preferences={preferences}
                    onUpdatePreferences={handleUpdatePreferences}
                />

                {/* Filter Bar */}
                <MatchFilters
                    matchCount={MATCHES.length}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {/* Grid or List Layout */}
                {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-20">
                        {MATCHES.map((match, index) => (
                            <MatchCard key={match.id} match={match} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 pb-20">
                        {MATCHES.map((match, index) => (
                            <MatchCardListView key={match.id} match={match} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
