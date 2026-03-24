"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { GlassCard } from "@/components/shared/glass-card"

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error("Notifications error:", error)
	}, [error])

	return (
		<div className="flex min-h-[400px] w-full items-center justify-center p-6">
			<GlassCard className="max-w-md">
				<div className="flex flex-col items-center justify-center gap-4 text-center">
					<AlertCircle className="h-12 w-12 text-destructive" />
					<div className="space-y-2">
						<h2 className="text-xl font-bold">Notifications Error</h2>
						<p className="text-muted-foreground">
							{error.message || "Something went wrong while loading your notifications"}
						</p>
					</div>
					<div className="flex gap-2">
						<Button onClick={() => reset()}>Try Again</Button>
						<Button
							variant="outline"
							onClick={() => window.history.back()}
						>
							Go Back
						</Button>
					</div>
				</div>
			</GlassCard>
		</div>
	)
}
