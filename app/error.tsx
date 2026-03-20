"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error("Global error:", error)
	}, [error])

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
			<AlertCircle className="mb-4 h-16 w-16 text-destructive" />
			<h2 className="mb-2 text-2xl font-bold">Something went wrong!</h2>
			<p className="mb-8 max-w-md text-muted-foreground">
				{error.message || "An unexpected error occurred"}
			</p>
			<div className="flex gap-2">
				<Button onClick={() => reset()}>Try Again</Button>
				<Button variant="outline" onClick={() => window.history.back()}>
					Go Back
				</Button>
			</div>
		</div>
	)
}
