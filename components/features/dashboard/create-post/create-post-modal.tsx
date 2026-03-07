"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Image as ImageIcon, Smile, X, Calendar, FileText, Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { IntentPrompt } from "../intent-prompt"

const EMOJIS = [
    { char: "😀", label: "Smile" }, { char: "😂", label: "Laugh" }, { char: "❤️", label: "Love" },
    { char: "👍", label: "Thumbs Up" }, { char: "🔥", label: "Fire" }, { char: "✨", label: "Sparkles" },
    { char: "🎉", label: "Party" }, { char: "🚀", label: "Rocket" }, { char: "🤔", label: "Thinking" },
    { char: "👏", label: "Clap" }, { char: "👀", label: "Eyes" }, { char: "💯", label: "100" }
]

const postSchema = z.object({
    content: z.string().min(1, "Post content cannot be empty.").max(2000, "Post is too long."),
    intent: z.string().optional(),
})

type PostFormValues = z.infer<typeof postSchema>

interface MediaFile {
    file: File
    preview: string
    type: 'image' | 'video'
}

// Temporary mock mutation since Supabase fetching is isolated to feed right now
const createPostMock = async (data: Record<string, unknown>) => {
    return new Promise((resolve) => setTimeout(() => resolve(data), 1200))
}

export function CreatePostModal() {
    const [open, setOpen] = useState(false)
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: { content: "", intent: "" }
    })

    const contentValue = watch("content")

    const { mutate, isPending } = useMutation({
        mutationFn: createPostMock,
        onSuccess: () => {
            // Optimistically update the feed cache if implemented, or invalidate
            reset()
            setMediaFiles([])
            setOpen(false)
        }
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                preview: URL.createObjectURL(file),
                type: (file.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video'
            }))
            setMediaFiles(prev => [...prev, ...newFiles])
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleRemoveMedia = (index: number) => {
        setMediaFiles(prev => {
            const newFiles = [...prev]
            URL.revokeObjectURL(newFiles[index].preview)
            newFiles.splice(index, 1)
            return newFiles
        })
    }

    const onSubmit = (data: PostFormValues) => {
        mutate({
            ...data,
            mediaFiles,
            id: Date.now(),
            author: "Maria Rodriguez",
            role: "Startup Founder",
            time: "Just now",
            avatar: "/avatars/05.png",
            initials: "MR",
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-blue-950/[0.05] backdrop-blur-2xl border border-blue-400/10 shadow-[0_4px_32px_0_rgba(59,130,246,0.06),0_1px_0_0_rgba(255,255,255,0.06)_inset] hover:shadow-[0_8px_40px_0_rgba(59,130,246,0.12),0_1px_0_0_rgba(255,255,255,0.08)_inset] transition-all duration-500 cursor-text p-4 md:p-5">
                    {/* Top highlight streak */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent pointer-events-none" />
                    <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-blue-300/20 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-indigo-500/[0.03] pointer-events-none" />
                    <div className="relative z-10 flex gap-3 md:gap-4 items-center">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-background shadow-sm shrink-0">
                            <AvatarImage src="/avatars/05.png" />
                            <AvatarFallback>MR</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] hover:border-blue-500/20 transition-all rounded-full px-4 py-2.5 md:py-3 cursor-text">
                            <span className="text-muted-foreground text-sm md:text-base font-medium">What are you trying to build?</span>
                        </div>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-2xl border border-blue-500/20 shadow-[0_8px_40px_0_rgba(0,0,0,0.5),0_0_60px_-20px_rgba(59,130,246,0.1)]">
                <DialogHeader className="px-5 py-4 border-b border-blue-500/10 bg-blue-500/[0.02]">
                    <DialogTitle className="text-lg font-bold">Create Post</DialogTitle>
                    <DialogDescription className="sr-only">
                        Share your updates, projects, or look for teammates with the community.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                    <div className="p-5 max-h-[60vh] overflow-y-auto no-scrollbar">
                        <div className="flex gap-4 items-start mb-4">
                            <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm shrink-0 mt-1">
                                <AvatarImage src="/avatars/05.png" />
                                <AvatarFallback>MR</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <span className="font-semibold text-sm">Maria Rodriguez</span>
                                <IntentPrompt
                                    className="mb-2 mt-1"
                                    onSelectIntent={(id) => setValue("intent", id)}
                                />
                            </div>
                        </div>

                        <Textarea
                            placeholder="What are you trying to build?"
                            className="w-full resize-none border-none bg-transparent focus-visible:ring-0 min-h-[120px] text-lg lg:text-xl p-0 pl-4 placeholder:text-muted-foreground leading-relaxed"
                            {...register("content")}
                        />
                        {errors.content && (
                            <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
                        )}

                        {mediaFiles.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-3 mt-2">
                                {mediaFiles.map((media, index) => (
                                    <div key={index} className="relative flex-shrink-0 group">
                                        {media.type === 'image' ? (
                                            <img src={media.preview} alt="preview" className="h-32 w-32 object-cover rounded-xl border border-white/10 shadow-sm" />
                                        ) : (
                                            <video src={media.preview} className="h-32 w-32 object-cover rounded-xl border border-white/10 shadow-sm" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMedia(index)}
                                            className="absolute top-2 right-2 bg-black/50 hover:bg-destructive text-white rounded-full p-1.5 backdrop-blur-md transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-blue-500/10 bg-blue-500/[0.02]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-muted-foreground pl-1">Add to your post</span>
                            <div className="flex items-center gap-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleFileChange}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-full"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="h-5 w-5" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 rounded-full">
                                    <Calendar className="h-5 w-5" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full">
                                    <FileText className="h-5 w-5" />
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full">
                                            <Smile className="h-5 w-5" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2" align="end" side="top">
                                        <div className="grid grid-cols-5 gap-2">
                                            {EMOJIS.map((emoji) => (
                                                <button
                                                    key={emoji.char}
                                                    type="button"
                                                    className="text-2xl hover:bg-muted p-1 rounded transition-colors flex items-center justify-center"
                                                    onClick={() => setValue("content", contentValue + emoji.char)}
                                                >
                                                    <span aria-label={emoji.label}>{emoji.char}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full rounded-xl font-bold py-6 bg-primary hover:bg-primary/90 shadow-[0_4px_20px_0_rgba(59,130,246,0.3)] hover:shadow-[0_6px_28px_0_rgba(59,130,246,0.4)] transition-all"
                            disabled={isPending || (!contentValue?.trim() && mediaFiles.length === 0)}
                        >
                            {isPending ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Posting...</>
                            ) : (
                                "Post"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
