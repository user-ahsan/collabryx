"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MapPin, Link as LinkIcon, Eye, Users } from "lucide-react"
import Link from "next/link"

export function ProfileCard() {
    return (
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-20 bg-gradient-to-r from-primary to-primary/60" />
            <CardHeader className="relative px-6 pb-2 pt-0">
                <div className="relative -top-10 mb-[-2.5rem] w-fit">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
                        <AvatarImage src="/avatars/01.png" alt="@sophie" />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">SC</AvatarFallback>
                    </Avatar>
                </div>
                <div className="pt-12">
                    <h3 className="font-bold text-lg leading-tight">Sophie Chen</h3>
                    <p className="text-sm text-muted-foreground mt-1">Frontend Architect | Building the future of UI at TechFlow</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>San Francisco, CA</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <LinkIcon className="h-3.5 w-3.5" />
                        <Link href="#" className="hover:underline hover:text-primary transition-colors">github.com/sophie</Link>
                    </div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div className="flex justify-between text-sm group cursor-pointer hover:bg-muted/50 p-1 -mx-1 rounded-md transition-colors">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Eye className="h-3.5 w-3.5" /> Profile Views
                        </span>
                        <span className="font-medium text-primary">1,234</span>
                    </div>
                    <div className="flex justify-between text-sm group cursor-pointer hover:bg-muted/50 p-1 -mx-1 rounded-md transition-colors">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Users className="h-3.5 w-3.5" /> Connections
                        </span>
                        <span className="font-medium text-primary">567</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
