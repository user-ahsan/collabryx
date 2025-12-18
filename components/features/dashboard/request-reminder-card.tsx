"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Handshake, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface RequestReminderCardProps {
    pendingCount?: number
    className?: string
}

export function RequestReminderCard({
    pendingCount = 2,
    className
}: RequestReminderCardProps) {
    if (pendingCount === 0) return null

    return (
        <Card className={cn("border-l-4 border-l-green-500 bg-card shadow-sm", className)}>
            <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                            <Handshake className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-foreground">
                                    Pending Collaboration Requests
                                </h3>
                                <Badge variant="secondary" className="h-5 px-2 text-xs font-bold bg-green-600 dark:bg-green-500 text-white">
                                    {pendingCount}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                You have {pendingCount} new {pendingCount === 1 ? 'request' : 'requests'} awaiting response
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        className="h-8 px-4 rounded-lg font-medium shadow-sm"
                    >
                        Review Requests
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
