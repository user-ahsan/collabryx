"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Shield, Bell, CreditCard, Loader2, Code2, Briefcase, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { ProfileSettingsTab } from "@/components/features/settings/profile-settings-tab"
import { SkillsInterestsSettingsTab } from "@/components/features/settings/skills-settings-tab"
import { ExperienceProjectsSettingsTab } from "@/components/features/settings/experience-projects-settings-tab"
import { NotificationPreferencesForm } from "@/components/features/settings/notification-preferences-form"
import { PrivacySettingsForm } from "@/components/features/settings/privacy-settings-form"
import { BlockedUsersList } from "@/components/features/settings/blocked-users-list"
import Link from "next/link"

type SettingsTab = "profile" | "skills" | "experience" | "account" | "notifications" | "privacy" | "billing"

export default function SettingsPage() {
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
	const [userId, setUserId] = useState<string | null>(null)
	const [email, setEmail] = useState("")

	const supabase = createClient()

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				setIsLoading(true)
				setError(null)

				const { data: { user }, error: authError } = await supabase.auth.getUser()

				if (authError) throw authError
				if (!user) throw new Error("Not authenticated")

				setUserId(user.id)
				setEmail(user.email || "")
			} catch (err: unknown) {
				console.error("Error fetching settings:", err)
				setError("Failed to load settings.")
			} finally {
				setIsLoading(false)
			}
		}

		fetchUserData()
	}, [supabase])

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="border-b border-white/10">
				<div className="container max-w-7xl mx-auto px-4 md:px-6 py-4">
					<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Settings</h1>
						<p className="text-sm text-muted-foreground mt-2">
							Manage your profile, account preferences, and notifications.
						</p>
					</div>
						<Button variant="outline" asChild>
							<Link href="/dashboard">Back to Dashboard</Link>
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="container max-w-7xl mx-auto px-4 md:px-6 py-6">
				{error && (
					<div className="bg-destructive/15 text-destructive text-sm px-4 py-3 rounded-lg mb-6 font-medium">
						{error}
					</div>
				)}

				<Tabs
					value={activeTab}
					onValueChange={(val) => setActiveTab(val as SettingsTab)}
					className="w-full"
				>
					<div className="flex flex-col md:flex-row gap-6">
						{/* Sidebar Navigation */}
						<div className="md:w-60 shrink-0">
							<TabsList className={cn(
								"flex md:flex-col h-auto w-full items-stretch justify-start p-2 gap-2",
								glass("tabInactive")
							)}>
								<TabsTrigger value="profile" className={cn(
									"justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:bg-background/50 data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-primary/50"
								)}>
									<User className="h-4 w-4 shrink-0" />
									<span>Profile</span>
								</TabsTrigger>
								<TabsTrigger value="skills" className={cn(
									"justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:bg-background/50 data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-primary/50"
								)}>
									<Code2 className="h-4 w-4 shrink-0" />
									<span>Skills & Interests</span>
								</TabsTrigger>
								<TabsTrigger value="experience" className={cn(
									"justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:bg-background/50 data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-primary/50"
								)}>
									<Briefcase className="h-4 w-4 shrink-0" />
									<span>Experience</span>
								</TabsTrigger>
								<TabsTrigger value="account" className={cn(
									"justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:bg-background/50 data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-primary/50"
								)}>
									<Shield className="h-4 w-4 shrink-0" />
									<span>Account</span>
								</TabsTrigger>
								<TabsTrigger value="notifications" className={cn(
									"justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:bg-background/50 data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-primary/50"
								)}>
									<Bell className="h-4 w-4 shrink-0" />
									<span>Notifications</span>
								</TabsTrigger>
								<TabsTrigger value="privacy" className={cn(
									"justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:bg-background/50 data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-primary/50"
								)}>
									<Lock className="h-4 w-4 shrink-0" />
									<span>Privacy</span>
								</TabsTrigger>
								<TabsTrigger value="billing" className={cn(
									"justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:bg-background/50 data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-primary/50"
								)}>
									<CreditCard className="h-4 w-4 shrink-0" />
									<span>Billing</span>
								</TabsTrigger>
							</TabsList>
						</div>

						{/* Content Area */}
						<div className="flex-1">
							{isLoading ? (
								<Card className={cn("border-none shadow-none", glass("cardInner"))}>
									<CardContent className="flex min-h-[384px] flex-col items-center justify-center gap-3">
										<Loader2 className="h-6 w-6 animate-spin text-primary" />
										<p className="text-sm text-muted-foreground" role="status">
											Loading settings...
										</p>
									</CardContent>
								</Card>
							) : (
								<>
									<TabsContent value="profile" className="mt-0 space-y-6">
										{userId ? <ProfileSettingsTab userId={userId} /> : null}
									</TabsContent>

									<TabsContent value="skills" className="mt-0 space-y-6">
										{userId ? <SkillsInterestsSettingsTab userId={userId} /> : null}
									</TabsContent>

									<TabsContent value="experience" className="mt-0 space-y-6">
										{userId ? <ExperienceProjectsSettingsTab userId={userId} /> : null}
									</TabsContent>

								<TabsContent value="account" className="mt-0 space-y-6">
									<Card className={cn("border-none shadow-none", glass("cardInner"))}>
										<CardHeader className="pt-0">
											<CardTitle className="text-base font-semibold">Account Security</CardTitle>
											<CardDescription className="text-sm">
												Manage your password and security settings.
											</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4 pb-0">
											<div className="space-y-2">
												<div className="flex justify-between items-center">
													<Label htmlFor="email">Email address</Label>
													<span className="text-xs text-muted-foreground italic">
														Unchangeable
													</span>
												</div>
												<Input
													id="email"
													value={email}
													disabled
													className={cn(
														"disabled:opacity-100 disabled:text-muted-foreground/80 cursor-not-allowed",
														glass("input")
													)}
												/>
											</div>
												<div className="space-y-2">
													<Label htmlFor="new-password">New Password</Label>
												<Input
													id="new-password"
													type="password"
													className={cn(
														"focus-visible:border-primary focus-visible:ring-primary/20",
														glass("input")
													)}
												/>
												</div>
												<Button className={cn("mt-2", glass("buttonPrimary"), glass("buttonPrimaryGlow"))}>
													Change Password
												</Button>
											</CardContent>
										</Card>
									<Separator className={glass("divider")} />
									<Card className={cn("border-none shadow-none", glass("cardInner"))}>
										<CardHeader className="pt-4">
											<CardTitle className="text-base text-red-500 font-semibold">
												Danger Zone
											</CardTitle>
										</CardHeader>
										<CardContent className="pb-0">
												<Button
													variant="destructive"
													className={glass("buttonSecondaryGlow")}
													asChild
												>
													<Link href="/settings/delete-account">
														Delete Account
													</Link>
												</Button>
											</CardContent>
										</Card>
									</TabsContent>

									<TabsContent value="notifications" className="mt-0">
										{userId ? <NotificationPreferencesForm userId={userId} /> : null}
									</TabsContent>

									<TabsContent value="privacy" className="mt-0 space-y-6">
										{userId ? <PrivacySettingsForm userId={userId} /> : null}
										{userId ? <BlockedUsersList userId={userId} /> : null}
									</TabsContent>

								<TabsContent value="billing" className="mt-0">
									<Card className={cn("border-none shadow-none", glass("cardInner"))}>
										<CardContent className="pt-6 text-center text-muted-foreground">
												<CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
												<p className="font-medium">Billing & Subscription</p>
												<p className="text-sm mt-1">
													Manage your subscription, payment methods, and invoices.
												</p>
												<Button className="mt-4" variant="outline" asChild>
													<Link href="/settings/billing">Manage Billing →</Link>
												</Button>
											</CardContent>
										</Card>
									</TabsContent>
								</>
							)}
						</div>
					</div>
				</Tabs>
			</div>
		</div>
	)
}
