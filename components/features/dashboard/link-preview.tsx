import { Card } from "@/components/ui/card"
import { ExternalLink, Globe } from "lucide-react"

interface LinkPreviewProps {
    url: string
    title?: string
    description?: string
    image?: string
    siteName?: string
}

export function LinkPreview({ url, title, description, image, siteName }: LinkPreviewProps) {
    if (!url) return null

    // Fallback if only url provided (in real app, would fetch metadata)
    const displayTitle = title || url
    const displayDomain = siteName || new URL(url).hostname

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-3 group">
            <Card className="overflow-hidden bg-muted/30 border-muted-foreground/20 hover:border-primary/30 transition-all flex flex-col sm:flex-row h-full">
                {image ? (
                    <div className="w-full sm:w-48 h-32 sm:h-auto bg-muted shrink-0">
                        <img src={image} alt="" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-full sm:w-32 h-24 sm:h-auto bg-muted/50 shrink-0 flex items-center justify-center text-muted-foreground">
                        <Globe className="h-8 w-8 opacity-50" />
                    </div>
                )}
                <div className="p-3 flex flex-col justify-center min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-1">
                        {displayDomain}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {displayTitle}
                    </h4>
                    {description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {description}
                        </p>
                    )}
                </div>
            </Card>
        </a>
    )
}
