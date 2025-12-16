"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Image as ImageIcon,
    Send,
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Video,
    Calendar,
    FileText,
    Smile,
    Globe,
    X
} from "lucide-react"

const EMOJIS = ["😀", "😂", "🥰", "😍", "😭", "😊", "😎", "🔥", "✨", "🎉", "👍", "👎", "❤️", "🚀", "👀", "💯", "🤔", "👏", "🙌", "💀"]

interface MediaFile {
    file: File
    preview: string
    type: 'image' | 'video'
}

export function Feed() {
    const [content, setContent] = useState("")
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleMediaClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                preview: URL.createObjectURL(file),
                type: (file.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video'
            }))
            setMediaFiles(prev => [...prev, ...newFiles])
        }
        // Reset input value to allow selecting same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleRemoveMedia = (index: number) => {
        setMediaFiles(prev => {
            const newFiles = [...prev]
            URL.revokeObjectURL(newFiles[index].preview)
            newFiles.splice(index, 1)
            return newFiles
        })
    }

    const handleEmojiSelect = (emoji: string) => {
        setContent(prev => prev + emoji)
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Premium Create Post Widget */}
            <div className="bg-card rounded-2xl shadow-sm border p-4 md:p-6 space-y-4">
                <div className="flex gap-4 items-start">
                    <Avatar className="h-11 w-11 md:h-12 md:w-12 ring-2 ring-background shadow-sm cursor-pointer transition-transform hover:scale-105">
                        <AvatarImage src="/avatars/01.png" />
                        <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <Textarea
                            placeholder="What's on your mind, Sophie?"
                            className="w-full resize-none border-none bg-transparent focus-visible:ring-0 min-h-[60px] text-lg md:text-xl p-0 placeholder:text-muted-foreground/50 leading-relaxed"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        {/* Media Previews */}
                        {mediaFiles.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-2">
                                {mediaFiles.map((media, index) => (
                                    <div key={index} className="relative flex-shrink-0 group">
                                        {media.type === 'image' ? (
                                            <img src={media.preview} alt="preview" className="h-24 w-24 object-cover rounded-lg border" />
                                        ) : (
                                            <video src={media.preview} className="h-24 w-24 object-cover rounded-lg border" />
                                        )}
                                        <button
                                            onClick={() => handleRemoveMedia(index)}
                                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-px bg-border/50" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center -space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="ghost"
                            className="h-9 px-3 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 rounded-full transition-colors group"
                            onClick={handleMediaClick}
                        >
                            <ImageIcon className="h-5 w-5 mr-2 text-blue-500 group-hover:text-blue-600" />
                            <span className="text-sm font-medium group-hover:text-blue-600">Media</span>
                        </Button>
                        <Button variant="ghost" className="h-9 px-3 text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10 rounded-full transition-colors group">
                            <Calendar className="h-5 w-5 mr-2 text-orange-500 group-hover:text-orange-600" />
                            <span className="text-sm font-medium group-hover:text-orange-600">Event</span>
                        </Button>
                        <Button variant="ghost" className="h-9 px-3 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-full transition-colors group">
                            <FileText className="h-5 w-5 mr-2 text-red-500 group-hover:text-red-600" />
                            <span className="text-sm font-medium group-hover:text-red-600">Article</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto pl-2 md:pl-0 border-l md:border-none border-border/50 ml-auto md:ml-0">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary rounded-full">
                                    <Smile className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2" align="end">
                                <div className="grid grid-cols-5 gap-2">
                                    {EMOJIS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            className="text-2xl hover:bg-muted p-1 rounded transition-colors"
                                            onClick={() => handleEmojiSelect(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button className="rounded-full px-8 font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                            Post
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between px-2">
                <div className="h-px bg-border flex-1" />
                <span className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">Recent Activity</span>
                <div className="h-px bg-border flex-1" />
            </div>

            {/* Premium Feed Posts */}
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="group bg-card rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="p-5 md:p-7">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-4">
                                    <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-background shadow-sm">
                                        <AvatarImage src={`/avatars/0${i + 1}.png`} />
                                        <AvatarFallback>U{i}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-bold text-base text-foreground hover:text-primary cursor-pointer transition-colors">Alex Johnson</h4>
                                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                            Product Designer
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                            2h ago
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                            <Globe className="h-3 w-3" />
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground rounded-full">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="pl-[4rem] -ml-4 md:ml-0 md:pl-16">
                                <p className="text-[15px] md:text-base leading-relaxed text-foreground/90 font-normal">
                                    Just launched a new feature for our collaborative workspace! 🚀 Super excited to see how teams use the new real-time whiteboard. <span className="text-primary hover:underline cursor-pointer">#productdesign</span> <span className="text-primary hover:underline cursor-pointer">#collaboration</span> <span className="text-primary hover:underline cursor-pointer">#startup</span>
                                </p>

                                {i === 1 && (
                                    <div className="mt-4 rounded-xl overflow-hidden shadow-sm border bg-muted/30 aspect-video flex items-center justify-center group/image cursor-pointer relative">
                                        <div className="absolute inset-0 bg-black/5 group-hover/image:bg-transparent transition-colors" />
                                        <div className="text-muted-foreground font-medium flex flex-col items-center gap-2">
                                            <ImageIcon className="h-8 w-8 opacity-50" />
                                            <span>Post Media Content</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-2 pb-2">
                            <div className="flex items-center justify-between p-2 rounded-xl bg-muted/20 md:mx-4 mb-2">
                                <Button variant="ghost" className="flex-1 hover:bg-background hover:shadow-sm rounded-lg text-muted-foreground hover:text-red-500 transition-all gap-2 h-10">
                                    <Heart className="h-5 w-5" />
                                    <span className="font-medium text-sm">Like</span>
                                </Button>
                                <Button variant="ghost" className="flex-1 hover:bg-background hover:shadow-sm rounded-lg text-muted-foreground hover:text-blue-500 transition-all gap-2 h-10">
                                    <MessageCircle className="h-5 w-5" />
                                    <span className="font-medium text-sm">Comment</span>
                                </Button>
                                <Button variant="ghost" className="flex-1 hover:bg-background hover:shadow-sm rounded-lg text-muted-foreground hover:text-green-500 transition-all gap-2 h-10">
                                    <Share2 className="h-5 w-5" />
                                    <span className="font-medium text-sm">Share</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
