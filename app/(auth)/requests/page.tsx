"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserPlus, X, CheckCircle2, Clock, Sparkles, Mail } from "lucide-react"

const RECEIVED_REQUESTS = [
    {
        id: "1",
        user: {
            name: "David Kim",
            avatar: "/avatars/04.png",
            role: "Product Designer @ Figma",
            location: "San Francisco, CA",
            skills: ["UI/UX", "Figma", "Design Systems"]
        },
        message: "Hey! I saw your profile and I think we'd make great collaborators on a design-tech project.",
        time: "2 hours ago",
        matchScore: 92,
    },
    {
        id: "2",
        user: {
            name: "Emily Zhang",
            avatar: "/avatars/02.png",
            role: "React Developer @ Stripe",
            location: "New York, NY",
            skills: ["React", "TypeScript", "GraphQL"]
        },
        message: "I love your work on open source projects! Let's connect.",
        time: "1 day ago",
        matchScore: 88,
    },
    {
        id: "3",
        user: {
            name: "Marcus Johnson",
            avatar: "/avatars/03.png",
            role: "Backend Engineer @ AWS",
            location: "Seattle, WA",
            skills: ["Node.js", "Python", "AWS"]
        },
        message: null,
        time: "3 days ago",
        matchScore: 85,
    },
]

const SENT_REQUESTS = [
    {
        id: "4",
        user: {
            name: "Lisa Chen",
            avatar: "/avatars/01.png",
            role: "Full Stack Developer",
            location: "Austin, TX",
            skills: ["Next.js", "PostgreSQL", "Docker"]
        },
        time: "5 hours ago",
        status: "pending"
    },
    {
        id: "5",
        user: {
            name: "James Wilson",
            avatar: "/avatars/05.png",
            role: "DevOps Engineer",
            location: "London, UK",
            skills: ["Kubernetes", "CI/CD", "Terraform"]
        },
        time: "2 days ago",
        status: "pending"
    },
]

function RequestCard({ request, type }: { request: any; type: "received" | "sent" }) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-all">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Avatar */}
                    <Avatar className="h-16 w-16 border-2 border-border shrink-0">
                        <AvatarImage src={request.user.avatar} />
                        <AvatarFallback>{request.user.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-lg">{request.user.name}</h3>
                                    {type === "received" && request.matchScore && (
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            {request.matchScore}% Match
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">{request.user.role}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{request.user.location}</p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{request.time}</span>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1.5">
                            {request.user.skills.map((skill: string) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                    {skill}
                                </Badge>
                            ))}
                        </div>

                        {/* Message (only for received requests) */}
                        {type === "received" && request.message && (
                            <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                                <div className="flex items-start gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <p className="text-sm text-muted-foreground italic">{request.message}</p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            {type === "received" ? (
                                <>
                                    <Button size="sm" className="flex-1 sm:flex-none">
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Accept
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                                        <X className="mr-2 h-4 w-4" />
                                        Decline
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                        View Profile
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button size="sm" variant="outline" className="flex-1 sm:flex-none" disabled>
                                        <Clock className="mr-2 h-4 w-4" />
                                        Pending
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                        Cancel Request
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function RequestsPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Connection Requests</h1>
                <p className="text-muted-foreground">Manage your incoming and outgoing connection requests</p>
            </div>

            <Tabs defaultValue="received" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="received" className="relative">
                        Received
                        <Badge className="ml-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs">
                            {RECEIVED_REQUESTS.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="sent">
                        Sent
                        <Badge variant="secondary" className="ml-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs">
                            {SENT_REQUESTS.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="received" className="mt-6 space-y-4">
                    {RECEIVED_REQUESTS.length > 0 ? (
                        RECEIVED_REQUESTS.map((request) => (
                            <RequestCard key={request.id} request={request} type="received" />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <UserPlus className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">No pending requests</h3>
                                <p className="text-center text-muted-foreground max-w-sm">
                                    You don't have any connection requests at the moment.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="sent" className="mt-6 space-y-4">
                    {SENT_REQUESTS.length > 0 ? (
                        SENT_REQUESTS.map((request) => (
                            <RequestCard key={request.id} request={request} type="sent" />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Clock className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">No sent requests</h3>
                                <p className="text-center text-muted-foreground max-w-sm">
                                    You haven't sent any connection requests yet.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
