"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, UserX } from "lucide-react"
import { GlassBubble } from "@/components/shared/glass-bubble"
import { useConnections, useRemoveConnection } from "@/hooks/use-connections"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function ConnectionList() {
  const { data: connections, isLoading } = useConnections()
  const removeConnection = useRemoveConnection()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredConnections = connections?.filter(conn =>
    conn.other_user_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRemove = async (connectionId: string) => {
    if (confirm("Are you sure you want to remove this connection?")) {
      await removeConnection.mutateAsync(connectionId)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!connections || connections.length === 0) {
    return (
      <div className="text-center py-12">
        <UserX className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
        <p className="text-muted-foreground mb-4">
          Start connecting with people you know
        </p>
        <Link href="/matches">
          <Button>Find Matches</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search connections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-full"
        />
      </div>

      {/* Connections List */}
      <div className="space-y-3">
        {filteredConnections?.map((connection) => (
          <GlassBubble key={connection.id} className="p-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/profile/${connection.other_user_id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar className="h-12 w-12 ring-1 ring-white/10">
                  <AvatarImage src={connection.other_user_avatar} />
                  <AvatarFallback>{connection.other_user_initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {connection.other_user_name}
                  </p>
                  {connection.other_user_headline && (
                    <p className="text-xs text-muted-foreground truncate">
                      {connection.other_user_headline}
                    </p>
                  )}
                </div>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemove(connection.id)}
                className="rounded-full"
              >
                Remove
              </Button>
            </div>
          </GlassBubble>
        ))}

        {filteredConnections?.length === 0 && searchTerm && (
          <div className="text-center py-8 text-muted-foreground">
            No connections found for &quot;{searchTerm}&quot;
          </div>
        )}
      </div>
    </div>
  )
}
