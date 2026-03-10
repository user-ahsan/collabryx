"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Lightbulb, Code2 } from "lucide-react";
import { motion } from "framer-motion";

interface MatchProfileCardProps {
    person: "sarah" | "alex";
}

const profiles = {
    sarah: {
        name: "Sarah Chen",
        role: "The Visionary",
        initials: "SC",
        description: "Founder with business strategy expertise looking for technical co-founder",
        skills: ["Business Strategy", "Marketing", "Fundraising"],
        icon: Lightbulb,
        delay: 0.2
    },
    alex: {
        name: "Alex Kumar",
        role: "The Builder",
        initials: "AK",
        description: "CS Student passionate about building scalable web applications",
        skills: ["React", "Node.js", "Python"],
        icon: Code2,
        delay: 0.4
    }
};

export function MatchProfileCard({ person }: MatchProfileCardProps) {
    const profile = profiles[person];
    const Icon = profile.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: person === "sarah" ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: profile.delay }}
            whileHover={{ y: -4 }}
            className="flex flex-col items-center w-full lg:w-[320px] group"
        >
            {/* Role Badge */}
            <div className="mb-6 px-4 py-1.5 flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold shadow-sm">
                <Icon className="w-3.5 h-3.5" />
                {profile.role}
            </div>

            <Avatar className="h-24 w-24 mb-5 border-2 border-primary/10 bg-primary/5 flex items-center justify-center shadow-xl">
                <AvatarFallback className="text-2xl font-bold text-primary bg-transparent text-center flex items-center justify-center">
                    {profile.initials}
                </AvatarFallback>
            </Avatar>

            <h3 className="text-xl font-bold text-foreground text-center mb-2">
                {profile.name}
            </h3>

            <p className="text-[15px] text-muted-foreground text-center mb-6 line-clamp-2 min-h-[44px]">
                {profile.description}
            </p>

            <div className="flex flex-wrap gap-2 justify-center">
                {profile.skills.map((skill, idx) => (
                    <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs font-medium bg-card border border-border/50 group-hover:border-primary/30 transition-colors"
                    >
                        {skill}
                    </Badge>
                ))}
            </div>
        </motion.div>
    );
}
