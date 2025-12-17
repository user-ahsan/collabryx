"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, ZoomIn, ZoomOut } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface MediaViewerProps {
    isOpen: boolean
    onClose: () => void
    url: string
    type: 'image' | 'video'
}

export function MediaViewer({ isOpen, onClose, url, type }: MediaViewerProps) {
    const [zoom, setZoom] = useState(1)

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3))
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1))

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="max-w-[95vw] h-[95vh] p-0 border-none bg-black/95 text-white overflow-hidden flex flex-col items-center justify-center outline-none">
                <DialogTitle className="sr-only">Media Viewer</DialogTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                >
                    <X className="h-6 w-6" />
                </Button>

                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    {type === 'image' ? (
                        <img
                            src={url}
                            alt="Full screen"
                            className={cn(
                                "max-w-full max-h-full object-contain transition-transform duration-200 cursor-move"
                            )}
                            style={{ transform: `scale(${zoom})` }}
                            draggable={false}
                        />
                    ) : (
                        <video
                            src={url}
                            controls
                            className="max-w-full max-h-full"
                            autoPlay
                        />
                    )}
                </div>

                {type === 'image' && (
                    <div className="absolute bottom-8 flex gap-4 z-50 bg-black/50 p-2 rounded-full backdrop-blur-sm border border-white/10">
                        <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 1} className="text-white hover:bg-white/20 rounded-full">
                            <ZoomOut className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 3} className="text-white hover:bg-white/20 rounded-full">
                            <ZoomIn className="h-5 w-5" />
                        </Button>
                        <div className="w-px bg-white/20 h-6 my-auto" />
                        <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/20 rounded-full">
                            <a href={url} download target="_blank">
                                <Download className="h-5 w-5" />
                            </a>
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
