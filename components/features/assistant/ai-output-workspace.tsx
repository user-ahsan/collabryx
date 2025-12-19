"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Download, Copy, Check, Edit3, Save } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface AIOutputWorkspaceProps {
    content: string
    isOpen: boolean
    onClose: () => void
    onSaveToProfile?: (content: string) => void
}

export function AIOutputWorkspace({
    content,
    isOpen,
    onClose,
    onSaveToProfile
}: AIOutputWorkspaceProps) {
    const [editedContent, setEditedContent] = useState(content)
    const [isEditing, setIsEditing] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(editedContent)
        setCopied(true)
        toast.success("Copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const blob = new Blob([editedContent], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ai-output-${Date.now()}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success("Downloaded successfully")
    }

    const handleSave = () => {
        setIsEditing(false)
        toast.success("Changes saved")
    }

    const handleSaveToProfile = () => {
        onSaveToProfile?.(editedContent)
        toast.success("Saved to your profile!")
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Side Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full md:w-[600px] lg:w-[650px] bg-background border-l shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 md:p-4 border-b bg-muted/30">
                            <div className="flex-1 min-w-0 mr-2">
                                <h2 className="text-base md:text-lg font-bold truncate">AI Output Workspace</h2>
                                <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                    Edit, export, or save to your profile
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="shrink-0 h-8 w-8 md:h-9 md:w-9"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-3 md:p-4">
                            {isEditing ? (
                                <Textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="min-h-[400px] md:min-h-[500px] font-mono text-xs md:text-sm resize-none"
                                />
                            ) : (
                                <Card className="p-3 md:p-4">
                                    <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm text-foreground">
                                        {editedContent}
                                    </pre>
                                </Card>
                            )}
                        </div>

                        {/* Action Bar */}
                        <div className="border-t p-3 md:p-4 bg-muted/30 space-y-2 md:space-y-3">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                {isEditing ? (
                                    <Button
                                        onClick={handleSave}
                                        className="flex-1 text-sm"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditing(true)}
                                        className="flex-1 text-sm"
                                    >
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    onClick={handleCopy}
                                    className="flex-1 text-sm"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Copy className="h-4 w-4 mr-2" />
                                    )}
                                    {copied ? "Copied!" : "Copy"}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleDownload}
                                    className="flex-1 text-sm"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>

                            {onSaveToProfile && (
                                <Button
                                    onClick={handleSaveToProfile}
                                    className="w-full text-sm"
                                    variant="default"
                                >
                                    Save to Profile
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
