"use client"

import { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Bookmark, MessageCircle, Heart, Share2, ExternalLink, Filter } from "lucide-react"
import Link from "next/link"

const MOCK_BOOKMARKS = [
	{
		id: "1",
		title: "Building Scalable React Applications",
		author: "Sarah Chen",
		avatar: "SC",
		date: "Mar 15, 2026",
		excerpt: "A comprehensive guide to architecting React applications for scale...",
		tags: ["React", "Architecture", "Performance"],
		likes: 234,
		comments: 45,
	},
	{
		id: "2",
		title: "Introduction to GraphQL Best Practices",
		author: "Alex Kumar",
		avatar: "AK",
		date: "Mar 12, 2026",
		excerpt: "Learn how to design efficient GraphQL schemas and resolvers...",
		tags: ["GraphQL", "API", "Backend"],
		likes: 189,
		comments: 32,
	},
	{
		id: "3",
		title: "TypeScript Advanced Patterns",
		author: "Jordan Lee",
		avatar: "JL",
		date: "Mar 8, 2026",
		excerpt: "Deep dive into advanced TypeScript patterns for type safety...",
		tags: ["TypeScript", "Types", "Patterns"],
		likes: 312,
		comments: 58,
	},
]

export default function BookmarksPage() {
	const [filter, setFilter] = useState<"all" | "articles" | "posts">("all")

	return (
		<div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl md:text-4xl font-bold mb-2">Bookmarks</h1>
						<p className="text-muted-foreground">
							Save and organize content you want to reference later
						</p>
					</div>
					<Button variant="outline" size="sm" className="gap-2">
						<Filter className="h-4 w-4" />
						Filter
					</Button>
				</div>
			</div>

			{MOCK_BOOKMARKS.length === 0 ? (
				<GlassCard>
					<div className="text-center py-12">
						<Bookmark className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
						<p className="text-muted-foreground mb-4">
							Save articles and posts to view them here
						</p>
						<Button asChild>
							<Link href="/dashboard">Explore Content</Link>
						</Button>
					</div>
				</GlassCard>
			) : (
				<div className="space-y-4">
					{MOCK_BOOKMARKS.map((bookmark) => (
						<GlassCard key={bookmark.id}>
							<div className="flex items-start gap-4">
								<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
									<span className="text-sm font-medium text-primary">
										{bookmark.avatar}
									</span>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-4 mb-2">
										<div>
											<h3 className="font-semibold text-lg mb-1">
												{bookmark.title}
											</h3>
											<p className="text-sm text-muted-foreground">
												by {bookmark.author} • {bookmark.date}
											</p>
										</div>
										<Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
											<Bookmark className="h-4 w-4 fill-current" />
										</Button>
									</div>
									<p className="text-muted-foreground text-sm mb-3 line-clamp-2">
										{bookmark.excerpt}
									</p>
									<div className="flex items-center gap-2 mb-3">
										{bookmark.tags.map((tag) => (
											<span
												key={tag}
												className="px-2 py-1 bg-muted/50 rounded text-xs font-medium"
											>
												{tag}
											</span>
										))}
									</div>
									<div className="flex items-center gap-4">
										<button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
											<Heart className="h-4 w-4" />
											{bookmark.likes}
										</button>
										<button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
											<MessageCircle className="h-4 w-4" />
											{bookmark.comments}
										</button>
										<button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
											<Share2 className="h-4 w-4" />
											Share
										</button>
										<Link
											href="#"
											className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto"
										>
											<ExternalLink className="h-4 w-4" />
											View
										</Link>
									</div>
								</div>
							</div>
						</GlassCard>
					))}
				</div>
			)}

			<div className="mt-8 text-center">
				<Button variant="outline" asChild>
					<Link href="/dashboard">Back to Dashboard</Link>
				</Button>
			</div>
		</div>
	)
}
