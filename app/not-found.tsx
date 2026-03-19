import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
			<FileQuestion className="mb-4 h-16 w-16 text-muted-foreground" />
			<h2 className="mb-2 text-2xl font-bold">Not Found</h2>
			<p className="mb-8 max-w-md text-muted-foreground">
				Could not find the requested resource
			</p>
			<Button asChild>
				<Link href="/">Return Home</Link>
			</Button>
		</div>
	)
}
