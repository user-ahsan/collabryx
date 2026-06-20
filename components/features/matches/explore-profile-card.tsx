"use client"

import { GlassCard } from "@/components/shared/glass-card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, UserPlus, Sparkles } from "lucide-react"
import { formatInitials } from "@/lib/utils/format-initials"

interface ExploreProfile {
  id: string
  name: string
  headline: string
  avatar_url: string
  bio: string
  location: string
  collaboration_readiness: string
  is_verified: boolean
  profile_completion: number
  skills: Array<{ name: string; proficiency: string | null; is_primary: boolean | null }>
}

interface ExploreProfileCardProps {
  profile: ExploreProfile
}

export function ExploreProfileCard({ profile }: ExploreProfileCardProps) {
  const initials = formatInitials(profile.name)
  const topSkills = profile.skills.slice(0, 3)

  return (
    <GlassCard className="p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-200">
      {/* Avatar + header */}
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0 border-2 border-primary/10">
          <AvatarImage src={profile.avatar_url} alt={profile.name} />
          <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground truncate text-sm">{profile.name}</h3>
            {profile.is_verified && (
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
          </div>
          {profile.headline && (
            <p className="text-xs text-muted-foreground line-clamp-1">{profile.headline}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{profile.bio}</p>
      )}

      {/* Skills */}
      {topSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {topSkills.map((skill) => (
            <Badge key={skill.name} variant="secondary" className="text-[10px] px-1.5 py-0">
              {skill.name}
            </Badge>
          ))}
          {profile.skills.length > 3 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{profile.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Location + readiness */}
      <div className="flex items-center justify-between mt-auto">
        {profile.location ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{profile.location}</span>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-1">
          <div className={`h-2 w-2 rounded-full ${
            profile.collaboration_readiness === 'available' ? 'bg-green-500' :
            profile.collaboration_readiness === 'looking' ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
          <span className="text-[10px] text-muted-foreground capitalize">{profile.collaboration_readiness}</span>
        </div>
      </div>

      {/* Connect button */}
      <Button variant="outline" size="sm" className="w-full mt-1 text-xs h-8">
        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
        Connect
      </Button>
    </GlassCard>
  )
}
