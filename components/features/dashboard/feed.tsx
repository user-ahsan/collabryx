"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
    Image,
    Send,
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Video,
    Calendar,
    FileText,
    Smile
} from "lucide-react"

export function Feed() {
    return (
        <div className="space-y-6">
            {/* Create Post Widget */}
            <Card className="shadow-sm">
                <CardContent className="p-4 md:p-6">
                    <div className="flex gap-4">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 border cursor-pointer hover:opacity-90 transition-opacity">
                            <AvatarImage src="/avatars/01.png" />
                            <AvatarFallback>SC</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-4">
                            <Textarea
                                placeholder="Start a post... Share your thoughts, ideas, or projects."
                                className="resize-none border-none focus-visible:ring-0 min-h-[80px] text-base md:text-lg p-0 placeholder:text-muted-foreground/60"
                            />
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2">
                                        <Image className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                                        <span className="hidden sm:inline">Media</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2">
                                        <Video className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                                        <span className="hidden sm:inline">Video</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2">
                                        <Calendar className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                                        <span className="hidden sm:inline">Event</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2">
                                        <FileText className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                                        <span className="hidden sm:inline">Article</span>
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 self-end md:self-auto">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                                        <Smile className="h-5 w-5" />
                                    </Button>
                                    <Button size="sm" className="rounded-full px-6 font-semibold shadow-sm hover:shadow-md transition-shadow">
                                        <Send className="h-4 w-4 mr-2" />
                                        Post
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator className="my-6 opacity-50" />

            {/* Feed Posts */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-start gap-4 p-4 md:p-6 pb-2">
                            <Avatar className="cursor-pointer hover:opacity-90">
                                <AvatarImage src={`/avatars/0${i + 1}.png`} />
                                <AvatarFallback>U{i}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-sm hover:underline cursor-pointer">Alex Johnson</h4>
                                        <p className="text-xs text-muted-foreground">Product Designer • 2h • <span className="inline-block w-2 H-2 rounded-full bg-muted-foreground/30 align-middle"></span> Edited</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="mt-2 text-sm md:text-base leading-relaxed text-foreground/90">
                                    Just launched a new feature for our collaborative workspace! 🚀 Super excited to see how teams use the new real-time whiteboard. #productdesign #collaboration #startup
                                </p>
                                {/* Placeholder for post image */}
                                {i === 1 && (
                                    <div className="mt-3 rounded-lg bg-muted text-muted-foreground h-64 md:h-80 w-full flex items-center justify-center border-2 border-dashed">
                                        Post Media / Image
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardFooter className="p-2 border-t flex justify-between bg-muted/5">
                            <Button variant="ghost" size="sm" className="flex-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors gap-2">
                                <Heart className="h-4 w-4" /> <span className="hidden sm:inline">Like</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors gap-2">
                                <MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">Comment</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors gap-2">
                                <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share</span>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
