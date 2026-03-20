"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { UserPlus, X, CheckCircle2, Clock, Sparkles, Mail } from "lucide-react"
import { GlassCard } from "@/components/shared/glass-card"
import { MatchReasonBadge } from "@/components/ui/match-reason-badge"
import { formatInitials } from "@/lib/utils/format-initials"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { useConnectionRequests } from "@/hooks/use-connection-requests"
import type { ConnectionWithUser } from "@/lib/services/connections"

interface RequestCardProps {
    connection: ConnectionWithUser;
    type: "received" | "sent";
    onAccept?: (id: string) => Promise<boolean>;
    onDecline?: (id: string) => Promise<boolean>;
    onCancel?: (id: string) => Promise<boolean>;
}

function RequestCard({ connection, type, onAccept, onDecline, onCancel }: RequestCardProps) {
    const isReceived = type === "received";
    const [isActionPending, setIsActionPending] = useState(false);

    const handleAccept = async () => {
        if (!onAccept) return;
        setIsActionPending(true);
        try {
            await onAccept(connection.id);
        } finally {
            setIsActionPending(false);
        }
    };

    const handleDecline = async () => {
        if (!onDecline) return;
        setIsActionPending(true);
        try {
            await onDecline(connection.id);
        } finally {
            setIsActionPending(false);
        }
    };

    const handleCancel = async () => {
        if (!onCancel) return;
        setIsActionPending(true);
        try {
            await onCancel(connection.id);
        } finally {
            setIsActionPending(false);
        }
    };
    
    // Extract skills from headline/role
    const skills = connection.other_user_headline 
        ? connection.other_user_headline.split(/[@|,]/).slice(0, 3).map(s => s.trim()).filter(Boolean)
        : [];

    return (
        <GlassCard hoverable className="my-2" innerClassName="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Avatar */}
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-border shrink-0">
                    <AvatarImage src={connection.other_user_avatar} />
                    <AvatarFallback>{formatInitials(connection.other_user_name)}</AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-base sm:text-lg break-words">{connection.other_user_name}</h3>
                                    {isReceived && (
                                        <Badge className={cn(
                                            "bg-primary/10 text-primary border-primary/30 shrink-0 font-semibold",
                                            glass("badge")
                                        )}>
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            Match
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground break-words mt-1">
                                    {connection.other_user_headline || "Developer"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                                    {connection.created_at_formatted}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Skills with MatchReasonBadge */}
                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {skills.map((skill, index) => (
                                <MatchReasonBadge 
                                    key={`${skill}-${index}`}
                                    type="skill" 
                                    label={skill} 
                                />
                            ))}
                        </div>
                    )}

                    {/* Message (only for received requests) */}
                    {isReceived && connection.message && (
                        <div className={cn(
                            "p-3 rounded-lg border",
                            glass("overlay"),
                            glass("subtle")
                        )}>
                            <div className="flex items-start gap-2.5">
                                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <p className="text-sm text-foreground/80 italic break-words leading-relaxed">{connection.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    <div className={cn("border-t", glass("divider"))} />

                    {/* Actions */}
                    <div className="flex flex-col xs:flex-row gap-2 pt-1">
                        {type === "received" ? (
                            <>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        disabled={isActionPending}
                                        className={cn(
                                            "flex-1 xs:flex-auto min-h-[44px] xs:min-h-[36px] font-semibold",
                                            glass("buttonPrimary"),
                                            glass("buttonPrimaryGlow")
                                        )}
                                        onClick={handleAccept}
                                    >
                                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                        {isActionPending ? "Accepting..." : "Accept"}
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        disabled={isActionPending}
                                        className={cn(
                                            "flex-1 xs:flex-auto min-h-[44px] xs:min-h-[36px]",
                                            glass("buttonGhost")
                                        )}
                                        onClick={handleDecline}
                                    >
                                        <X className="mr-1.5 h-4 w-4" />
                                        {isActionPending ? "Declining..." : "Decline"}
                                    </Button>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    disabled={isActionPending}
                                    className={cn(
                                        "w-full xs:w-auto min-h-[44px] xs:min-h-[36px]",
                                        glass("buttonGhost")
                                    )}
                                >
                                    View Profile
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    disabled
                                    className={cn(
                                        "w-full xs:w-auto min-h-[44px] xs:min-h-[36px]",
                                        glass("buttonGhost")
                                    )}
                                >
                                    <Clock className="mr-1.5 h-4 w-4" />
                                    Pending
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost"
                                    disabled={isActionPending}
                                    className={cn(
                                        "w-full xs:w-auto min-h-[44px] xs:min-h-[36px]",
                                        glass("buttonGhost")
                                    )}
                                    onClick={handleCancel}
                                >
                                    Cancel Request
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </GlassCard>
    )
}

export function RequestsClient() {
    const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
    const { 
        receivedRequests, 
        sentRequests, 
        isLoading, 
        error,
        acceptRequest,
        declineRequest,
        cancelRequest
    } = useConnectionRequests();

    if (isLoading) {
        return (
            <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Connection Requests</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Manage your incoming and outgoing connection requests</p>
                </div>
                <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Loading requests...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Connection Requests</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Manage your incoming and outgoing connection requests</p>
                </div>
                <GlassCard innerClassName={cn(
                    "flex flex-col items-center justify-center py-12 sm:py-16 px-4",
                    glass("cardInner")
                )}>
                    <div className={cn(
                        "h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mb-4 sm:mb-5",
                        glass("subtle"),
                        glass("badge")
                    )}>
                        <X className="h-8 w-8 sm:h-9 sm:w-9 text-destructive" />
                    </div>
                    <h3 className="font-semibold text-lg sm:text-xl mb-2">Error loading requests</h3>
                    <p className="text-center text-sm sm:text-base text-muted-foreground max-w-sm px-4 leading-relaxed">
                        {error}
                    </p>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Connection Requests</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Manage your incoming and outgoing connection requests</p>
            </div>

            <Tabs defaultValue="received" className="w-full" onValueChange={(value) => setActiveTab(value as "received" | "sent")}>
                <TabsList className={cn(
                    "grid w-full grid-cols-2 mb-4 sm:mb-6 min-h-[44px]",
                    glass("subtle")
                )}>
                    <TabsTrigger 
                        value="received" 
                        className={cn(
                            "relative data-[state=active]:font-semibold",
                            activeTab === "received" && glass("tabActive"),
                            activeTab !== "received" && glass("tabInactive")
                        )}
                    >
                        Received
                        <Badge className={cn(
                            "ml-2 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full text-xs font-semibold",
                            glass("badge")
                        )}>
                            {receivedRequests.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                        value="sent"
                        className={cn(
                            "relative data-[state=active]:font-semibold",
                            activeTab === "sent" && glass("tabActive"),
                            activeTab !== "sent" && glass("tabInactive")
                        )}
                    >
                        Sent
                        <Badge className={cn(
                            "ml-2 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full text-xs",
                            glass("badge")
                        )}>
                            {sentRequests.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="received" className="mt-0 space-y-3 sm:space-y-4">
                    {receivedRequests.length > 0 ? (
                        receivedRequests.map((connection) => (
                            <RequestCard 
                                key={connection.id} 
                                connection={connection} 
                                type="received"
                                onAccept={acceptRequest}
                                onDecline={declineRequest}
                            />
                        ))
                    ) : (
                        <GlassCard 
                            innerClassName={cn(
                                "flex flex-col items-center justify-center py-12 sm:py-16 px-4",
                                glass("cardInner")
                            )}
                        >
                            <div className={cn(
                                "h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mb-4 sm:mb-5",
                                glass("subtle"),
                                glass("badge")
                            )}>
                                <UserPlus className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg sm:text-xl mb-2">No pending requests</h3>
                            <p className="text-center text-sm sm:text-base text-muted-foreground max-w-sm px-4 leading-relaxed">
                                You don&apos;t have any pending connection requests at the moment.
                            </p>
                        </GlassCard>
                    )}
                </TabsContent>

                <TabsContent value="sent" className="mt-0 space-y-3 sm:space-y-4">
                    {sentRequests.length > 0 ? (
                        sentRequests.map((connection) => (
                            <RequestCard 
                                key={connection.id} 
                                connection={connection} 
                                type="sent"
                                onCancel={cancelRequest}
                            />
                        ))
                    ) : (
                        <GlassCard 
                            innerClassName={cn(
                                "flex flex-col items-center justify-center py-12 sm:py-16 px-4",
                                glass("cardInner")
                            )}
                        >
                            <div className={cn(
                                "h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mb-4 sm:mb-5",
                                glass("subtle"),
                                glass("badge")
                            )}>
                                <Clock className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg sm:text-xl mb-2">No sent requests</h3>
                            <p className="text-center text-sm sm:text-base text-muted-foreground max-w-sm px-4 leading-relaxed">
                                You haven&apos;t sent any connection requests yet.
                            </p>
                        </GlassCard>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
