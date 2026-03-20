import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, FileText, Building2 } from "lucide-react"
import Link from "next/link"

export default function BillingPage() {
	return (
		<div className="container max-w-4xl mx-auto py-6 px-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Billing & Subscription</h1>
				<p className="text-muted-foreground">
					Manage your subscription, payment methods, and invoices.
				</p>
			</div>

			<div className="grid gap-6">
				{/* Current Plan */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CreditCard className="h-5 w-5" />
							Current Plan
						</CardTitle>
						<CardDescription>
							Your current subscription and billing cycle.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Free Plan</p>
								<p className="text-sm text-muted-foreground">
									Basic features with limited access
								</p>
							</div>
							<Button>Upgrade to Pro</Button>
						</div>
					</CardContent>
				</Card>

				{/* Payment Methods */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="h-5 w-5" />
							Payment Methods
						</CardTitle>
						<CardDescription>
							Manage your saved payment methods.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							No payment methods saved. Add a payment method when you upgrade to a paid plan.
						</p>
					</CardContent>
				</Card>

				{/* Invoices */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Invoices
						</CardTitle>
						<CardDescription>
							View and download your past invoices.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							No invoices available. Invoices will appear here after your first payment.
						</p>
					</CardContent>
				</Card>

				{/* Billing Contact */}
				<Card>
					<CardHeader>
						<CardTitle>Billing Contact</CardTitle>
						<CardDescription>
							Update your billing contact information.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							Billing contact features coming soon.
						</p>
					</CardContent>
				</Card>

				<div className="flex justify-center pt-4">
					<Button variant="outline" asChild>
						<Link href="/settings">Back to Settings</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
