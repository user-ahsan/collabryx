"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MapPin, Link as LinkIcon, Eye, Users } from "lucide-react"
import Link from "next/link"

export function ProfileCard() {
    return (
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-16 sm:h-20 bg-gradient-to-r from-primary to-primary/60" />
            <CardHeader className="relative px-3 sm:px-4 md:px-6 pb-2 pt-0">
                <div className="relative -top-8 sm:-top-10 mb-[-2rem] sm:mb-[-2.5rem] w-fit">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-background shadow-sm">
                        <AvatarImage src="/avatars/01.png" alt="@sophie" />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg sm:text-xl font-bold">SC</AvatarFallback>
                    </Avatar>
                </div>
                <div className="pt-10 sm:pt-12">
                    <h3 className="font-bold text-base sm:text-lg leading-tight">Sophie Chen</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">Frontend Architect | Building the future of UI at TechFlow</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-2 px-3 sm:px-4 md:px-6">
                <div className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                        <span className="truncate">San Francisco, CA</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                        <LinkIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                        <Link href="#" className="hover:underline hover:text-primary transition-colors truncate">github.com/sophie</Link>
                    </div>
                </div>

                <Separator />

                <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm group cursor-pointer hover:bg-muted/50 p-1 -mx-1 rounded-md transition-colors">
                        <span className="text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Profile Views
                        </span>
                        <span className="font-medium text-primary">1,234</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm group cursor-pointer hover:bg-muted/50 p-1 -mx-1 rounded-md transition-colors">
                        <span className="text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Connections
                        </span>
                        <span className="font-medium text-primary">567</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
