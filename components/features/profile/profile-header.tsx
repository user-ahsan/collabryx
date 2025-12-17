"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Link as LinkIcon, Calendar, UserPlus, MessageSquare } from "lucide-react"

export function ProfileHeader() {
    return (
        <div className="bg-card border rounded-lg overflow-hidden mb-6">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/30 w-full" />

            <div className="px-4 md:px-6 pb-6">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-end -mt-12 md:-mt-16">
                    {/* Avatar */}
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg shrink-0">
                        <AvatarImage src="/avatars/01.png" />
                        <AvatarFallback>SC</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 mt-2 md:mt-0 space-y-4 w-full">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold">Sarah Chen</h1>
                                <p className="text-muted-foreground font-medium">Full Stack Developer @ TechStart</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Message
                                </Button>
                                <Button>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Connect
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                San Francisco, CA
                            </div>
                            <div className="flex items-center gap-1">
                                <LinkIcon className="h-4 w-4" />
                                <a href="#" className="hover:underline">github.com/sarahchen</a>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Joined December 2024
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Badge variant="secondary">React</Badge>
                            <Badge variant="secondary">TypeScript</Badge>
                            <Badge variant="secondary">Node.js</Badge>
                            <Badge variant="secondary">AWS</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
