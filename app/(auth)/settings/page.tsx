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
		<div className="container max-w-6xl mx-auto py-6 px-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Settings</h1>
				<p className="text-muted-foreground">
					Manage your profile, account preferences, and notifications.
				</p>
			</div>

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
				<TabsList className={cn(
					"flex flex-wrap h-auto w-full items-stretch justify-start p-2 gap-2",
					glass("tabInactive")
				)}>
					<TabsTrigger value="profile" className={cn(
						"justify-start gap-2 px-3 py-2 transition-all text-sm font-medium rounded-lg whitespace-nowrap",
						glass("tabActive"),
						glass("tabInactive")
					)}>
						<User className="h-4 w-4 shrink-0" />
						<span>Profile</span>
					</TabsTrigger>
					<TabsTrigger value="skills" className={cn(
						"justify-start gap-2 px-3 py-2 transition-all text-sm font-medium rounded-lg whitespace-nowrap",
						glass("tabActive"),
						glass("tabInactive")
					)}>
						<Code2 className="h-4 w-4 shrink-0" />
						<span>Skills & Interests</span>
					</TabsTrigger>
					<TabsTrigger value="experience" className={cn(
						"justify-start gap-2 px-3 py-2 transition-all text-sm font-medium rounded-lg whitespace-nowrap",
						glass("tabActive"),
						glass("tabInactive")
					)}>
						<Briefcase className="h-4 w-4 shrink-0" />
						<span>Experience & Projects</span>
					</TabsTrigger>
					<TabsTrigger value="account" className={cn(
						"justify-start gap-2 px-3 py-2 transition-all text-sm font-medium rounded-lg whitespace-nowrap",
						glass("tabActive"),
						glass("tabInactive")
					)}>
						<Shield className="h-4 w-4 shrink-0" />
						<span>Account</span>
					</TabsTrigger>
					<TabsTrigger value="notifications" className={cn(
						"justify-start gap-2 px-3 py-2 transition-all text-sm font-medium rounded-lg whitespace-nowrap",
						glass("tabActive"),
						glass("tabInactive")
					)}>
						<Bell className="h-4 w-4 shrink-0" />
						<span>Notifications</span>
					</TabsTrigger>
					<TabsTrigger value="privacy" className={cn(
						"justify-start gap-2 px-3 py-2 transition-all text-sm font-medium rounded-lg whitespace-nowrap",
						glass("tabActive"),
						glass("tabInactive")
					)}>
						<Lock className="h-4 w-4 shrink-0" />
						<span>Privacy</span>
					</TabsTrigger>
					<TabsTrigger value="billing" className={cn(
						"justify-start gap-2 px-3 py-2 transition-all text-sm font-medium rounded-lg whitespace-nowrap",
						glass("tabActive"),
						glass("tabInactive")
					)}>
						<CreditCard className="h-4 w-4 shrink-0" />
						<span>Billing</span>
					</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					{isLoading ? (
						<div className="flex h-[400px] items-center justify-center text-muted-foreground">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
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
								<Card className={cn("border-none shadow-none bg-transparent")}>
									<CardHeader className="px-0 pt-0">
										<CardTitle>Account Security</CardTitle>
										<CardDescription>
											Manage your password and security settings.
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4 px-0 pb-0">
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
													"opacity-70 cursor-not-allowed",
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
													"focus:border-primary/50",
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
								<Card className={cn("border-none shadow-none bg-transparent")}>
									<CardHeader className="px-0 pt-4">
										<CardTitle className="text-red-500 font-semibold">
											Danger Zone
										</CardTitle>
									</CardHeader>
									<CardContent className="px-0 pb-0">
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
								<Card className={cn("border-none shadow-none bg-transparent")}>
									<CardContent className="pt-6 text-center text-muted-foreground px-0 pb-0">
										Billing features and invoice management coming soon.
									</CardContent>
								</Card>
							</TabsContent>
						</>
					)}
				</div>
			</Tabs>
		</div>
	)
}
