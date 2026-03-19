import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { FileText, Users, Shield, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
	return (
		<div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
			<div className="mb-8">
				<h1 className="text-3xl md:text-4xl font-bold mb-3">Terms of Service</h1>
				<p className="text-muted-foreground">
					Last updated: March 20, 2026
				</p>
			</div>

			<div className="space-y-6">
				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<FileText className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold text-xl mb-2">Acceptance of Terms</h2>
							<p className="text-muted-foreground">
								By accessing and using Collabryx, you accept and agree to be bound by the terms 
								and provision of this agreement. If you do not agree to these terms, please do 
								not use the platform.
							</p>
						</div>
					</div>
				</GlassCard>

				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<Users className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold text-xl mb-2">User Conduct</h2>
							<p className="text-muted-foreground">
								You agree to use Collabryx only for lawful purposes and in a way that does not 
								infringe the rights of, restrict or inhibit anyone else's use of the platform. 
								Professional and respectful communication is required.
							</p>
						</div>
					</div>
				</GlassCard>

				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<Shield className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold text-xl mb-2">Intellectual Property</h2>
							<p className="text-muted-foreground">
								You retain ownership of content you post. By posting, you grant Collabryx a 
								license to use, display, and distribute that content on the platform. We respect 
								others' intellectual property rights and expect you to do the same.
							</p>
						</div>
					</div>
				</GlassCard>

				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<AlertCircle className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold text-xl mb-2">Disclaimer & Limitations</h2>
							<p className="text-muted-foreground">
								Collabryx is provided "as is" without warranties of any kind. We do not guarantee 
								that the platform will be uninterrupted, secure, or error-free. Our liability is 
								limited to the maximum extent permitted by law.
							</p>
						</div>
					</div>
				</GlassCard>

				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<ArrowRight className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold text-xl mb-2">Changes to Terms</h2>
							<p className="text-muted-foreground">
								We may modify these terms at any time. We'll notify you of significant changes, 
								but it's your responsibility to review these terms periodically. Continued use 
								after changes constitutes acceptance of the new terms.
							</p>
						</div>
					</div>
				</GlassCard>
			</div>

			<div className="mt-8 text-center">
				<p className="text-muted-foreground mb-4">
					By using Collabryx, you agree to these terms and our privacy policy.
				</p>
				<div className="flex gap-3 justify-center">
					<Button variant="outline" asChild>
						<Link href="/dashboard">Back to Dashboard</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link href="/privacy">Privacy Policy</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
