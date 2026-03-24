import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Eye, Database } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
	return (
		<div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
			<div className="mb-8">
				<h1 className="text-3xl md:text-4xl font-bold mb-3">Privacy Policy</h1>
				<p className="text-muted-foreground">
					Last updated: March 20, 2026
				</p>
			</div>

			<div className="space-y-6">
				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<Shield className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold text-xl mb-2">Data Collection</h2>
							<p className="text-muted-foreground">
								We collect information you provide directly to us, including your name, email address, 
								profile information, skills, and project experience. This helps us connect you with 
								other developers and opportunities.
							</p>
						</div>
					</div>
				</GlassCard>

				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<Lock className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold text-xl mb-2">Data Security</h2>
							<p className="text-muted-foreground">
								We implement industry-standard security measures to protect your personal information. 
								Your data is encrypted in transit and at rest, and we regularly audit our systems for 
								vulnerabilities.
							</p>
						</div>
					</div>
				</GlassCard>

				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<Eye className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold text-xl mb-2">Your Privacy Choices</h2>
							<p className="text-muted-foreground">
								You control your privacy settings. Choose what information is visible on your profile, 
								who can contact you, and what notifications you receive. You can download or delete your 
								data at any time.
							</p>
						</div>
					</div>
				</GlassCard>

				<GlassCard>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<Database className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold text-xl mb-2">Third-Party Services</h2>
							<p className="text-muted-foreground">
								We use trusted third-party services to operate Collabryx. These services have access 
								to your data only to perform specific tasks on our behalf and are obligated to protect 
								your information.
							</p>
						</div>
					</div>
				</GlassCard>
			</div>

			<div className="mt-8 text-center">
				<p className="text-muted-foreground mb-4">
					Have questions about privacy? Contact us at privacy@collabryx.com
				</p>
				<div className="flex gap-3 justify-center">
					<Button variant="outline" asChild>
						<Link href="/dashboard">Back to Dashboard</Link>
					</Button>
					<Button asChild>
						<Link href="/settings/privacy">Privacy Settings</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
