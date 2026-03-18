"use client"

import { useState, useRef } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ImageIcon, Calendar, FileText, Smile, Loader2, Link2 } from "lucide-react"
import { IntentPrompt } from "./intent-prompt"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { useAttachmentUploadPrePost } from "@/hooks/use-post-attachments"
import { PostAttachmentUpload } from "@/components/features/posts/post-attachment-upload"

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

// Temporary mock mutation since Supabase fetching is isolated to feed right now
const createPostMock = async (data: Record<string, unknown>) => {
    return new Promise((resolve) => setTimeout(() => resolve(data), 1200))
}

export function CreatePostModal() {
    const [open, setOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        control,
        formState: { errors }
    } = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: { content: "", intent: "" }
    })

    const contentValue = useWatch({ name: "content", control })
    
    // Use the new attachment upload hook
    const {
        files: mediaFiles,
        previews: mediaPreviews,
        handleFileSelect,
        removeFile,
        clearFiles
    } = useAttachmentUploadPrePost()

    const { mutate, isPending } = useMutation({
        mutationFn: createPostMock,
        onSuccess: () => {
            // Optimistically update the feed cache if implemented, or invalidate
            reset()
            clearFiles()
            setOpen(false)
        }
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            handleFileSelect(files)
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleRemoveMedia = (index: number) => {
        removeFile(index)
    }

    const onSubmit = (data: PostFormValues) => {
        mutate({
            ...data,
            mediaFiles: mediaFiles.map((file, index) => ({
                file,
                preview: mediaPreviews[index],
                type: file.type.startsWith('video') ? 'video' as const : 'image' as const
            })),
            // eslint-disable-next-line react-hooks/purity
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
                <div className={cn(
                    "relative rounded-xl md:rounded-2xl overflow-hidden transition-all duration-500 cursor-text p-3 md:p-5",
                    glass("card"),
                    glass("hoverable")
                )}>
                    <div className="relative z-10 flex gap-3 md:gap-4 items-center">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-border shadow-sm shrink-0">
                            <AvatarImage src="/avatars/05.png" />
                            <AvatarFallback>MR</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "flex-1 border transition-all rounded-full px-4 py-2.5 md:py-3 cursor-text",
                            glass("subtle"),
                            "hover:border-blue-500/20"
                        )}>
                            <span className="text-muted-foreground text-sm md:text-base font-medium">What are you trying to build?</span>
                        </div>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent 
                className={cn(
                    "sm:max-w-[600px] p-0 gap-0 overflow-hidden sm:rounded-2xl",
                    "bg-blue-950/[0.05] backdrop-blur-2xl"
                )}
                showDecorations={true}
            >
                <DialogHeader className={cn("px-5 py-4", glass("divider"))}>
                    <DialogTitle className="text-lg font-bold">Create Post</DialogTitle>
                    <DialogDescription className="sr-only">
                        Share your updates, projects, or look for teammates with the community.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col relative z-10">
                    <div className="p-5 max-h-[60vh] overflow-y-auto no-scrollbar">
                        <div className="flex gap-4 items-start mb-4">
                            <Avatar className="h-10 w-10 ring-2 ring-border shadow-sm shrink-0 mt-1">
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
                            className={cn(
                                "w-full resize-none border-none bg-transparent focus-visible:ring-0 min-h-[120px] text-lg lg:text-xl p-0 pl-4 placeholder:text-muted-foreground leading-relaxed",
                                glass("input")
                            )}
                            {...register("content")}
                        />
                        {errors.content && (
                            <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
                        )}

                        {/* Use the new attachment upload component */}
                        <div className="mt-4">
                            <PostAttachmentUpload
                                onFilesChange={handleFileSelect}
                                maxFiles={10}
                            />
                        </div>
                    </div>

                    <div className={cn("p-4", glass("divider"))}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-muted-foreground pl-1">Add to your post</span>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "rounded-full text-blue-400 hover:text-blue-300",
                                        glass("buttonGhost")
                                    )}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={mediaFiles.length >= 10}
                                    title="Add images or videos"
                                >
                                    <ImageIcon className="h-5 w-5" />
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className={cn(
                                        "rounded-full text-purple-400 hover:text-purple-300",
                                        glass("buttonGhost")
                                    )}
                                    title="Schedule post (coming soon)"
                                >
                                    <Calendar className="h-5 w-5" />
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className={cn(
                                        "rounded-full text-orange-400 hover:text-orange-300",
                                        glass("buttonGhost")
                                    )}
                                    title="Add document (coming soon)"
                                >
                                    <FileText className="h-5 w-5" />
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className={cn(
                                        "rounded-full text-green-400 hover:text-green-300",
                                        glass("buttonGhost")
                                    )}
                                    title="Add link (coming soon)"
                                >
                                    <Link2 className="h-5 w-5" />
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className={cn("rounded-full text-yellow-400 hover:text-yellow-300", glass("buttonGhost"))}>
                                            <Smile className="h-5 w-5" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className={cn("w-64 p-2", glass("dropdown"))} align="end" side="top">
                                        <div className="grid grid-cols-5 gap-2">
                                            {EMOJIS.map((emoji) => (
                                                <button
                                                    key={emoji.char}
                                                    type="button"
                                                    className="text-2xl hover:bg-white/10 p-1 rounded transition-colors flex items-center justify-center"
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
                            className={cn(
                                "w-full rounded-xl font-bold py-6",
                                glass("buttonPrimary"),
                                glass("buttonPrimaryGlow")
                            )}
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
