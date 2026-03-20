export default function Loading() {
	return (
		<div className="container max-w-4xl mx-auto py-6 px-6 animate-pulse">
			<div className="space-y-6">
				{/* Header skeleton */}
				<div className="h-8 w-48 bg-muted rounded" />

				{/* Tabs skeleton */}
				<div className="flex gap-2 border-b">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-10 w-24 bg-muted rounded-t" />
					))}
				</div>

				{/* Content skeleton */}
				<div className="space-y-4">
					<div className="h-4 w-full bg-muted rounded" />
					<div className="h-4 w-3/4 bg-muted rounded" />
					<div className="h-20 w-full bg-muted rounded" />
					<div className="h-10 w-32 bg-muted rounded" />
				</div>
			</div>
		</div>
	)
}
