import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, MessageCircle, Book, LifeBuoy, ArrowRight, Search } from "lucide-react"
import Link from "next/link"

export default function HelpPage() {
	return (
		<div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
			<div className="mb-8 text-center">
				<h1 className="text-3xl md:text-4xl font-bold mb-3">How can we help you?</h1>
				<p className="text-muted-foreground text-lg mb-6">
					Search our knowledge base or browse help topics
				</p>
				<div className="relative max-w-xl mx-auto">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search for help..."
						className="pl-12 h-12"
					/>
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6 mb-8">
				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<Book className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h3 className="font-semibold text-lg mb-1">Getting Started</h3>
							<p className="text-muted-foreground text-sm mb-3">
								Learn the basics of Collabryx and how to set up your profile
							</p>
							<Link href="#" className="text-primary text-sm font-medium hover:underline inline-flex items-center">
								View guide <ArrowRight className="h-4 w-4 ml-1" />
							</Link>
						</div>
					</div>
				</GlassCard>

				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<MessageCircle className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h3 className="font-semibold text-lg mb-1">Messaging</h3>
							<p className="text-muted-foreground text-sm mb-3">
								Connect with other developers and start collaborating
							</p>
							<Link href="#" className="text-primary text-sm font-medium hover:underline inline-flex items-center">
								Learn more <ArrowRight className="h-4 w-4 ml-1" />
							</Link>
						</div>
					</div>
				</GlassCard>

				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<LifeBuoy className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h3 className="font-semibold text-lg mb-1">Account Settings</h3>
							<p className="text-muted-foreground text-sm mb-3">
								Manage your profile, privacy, and notification preferences
							</p>
							<Link href="#" className="text-primary text-sm font-medium hover:underline inline-flex items-center">
								Manage settings <ArrowRight className="h-4 w-4 ml-1" />
							</Link>
						</div>
					</div>
				</GlassCard>

				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<Mail className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h3 className="font-semibold text-lg mb-1">Contact Support</h3>
							<p className="text-muted-foreground text-sm mb-3">
								Get in touch with our support team for assistance
							</p>
							<Button size="sm" className="w-full">
								Contact Us
							</Button>
						</div>
					</div>
				</GlassCard>
			</div>

			<div className="text-center">
				<p className="text-muted-foreground mb-4">
					Still need help? Our support team is here to assist you.
				</p>
				<Button variant="outline" asChild>
					<Link href="/dashboard">Back to Dashboard</Link>
				</Button>
			</div>
		</div>
	)
}
