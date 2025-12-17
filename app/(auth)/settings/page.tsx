"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>

            <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-64 shrink-0">
                    <TabsList className="flex flex-col h-auto w-full items-stretch p-1 bg-muted/30 rounded-xl gap-1 sticky top-24">
                        <TabsTrigger value="profile" className="justify-start px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm font-medium">Profile</TabsTrigger>
                        <TabsTrigger value="account" className="justify-start px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm font-medium">Account</TabsTrigger>
                        <TabsTrigger value="notifications" className="justify-start px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm font-medium">Notifications</TabsTrigger>
                        <TabsTrigger value="billing" className="justify-start px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm font-medium">Billing</TabsTrigger>
                    </TabsList>
                </aside>

                <div className="flex-1">
                    <TabsContent value="profile" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your public profile details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Display Name</Label>
                                    <Input defaultValue="Sarah Chen" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Headline</Label>
                                    <Input defaultValue="Full Stack Developer @ TechStart" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bio</Label>
                                    <Textarea className="h-24" defaultValue="I'm a passionate Full Stack Developer..." />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="account" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Security</CardTitle>
                                <CardDescription>Manage your password and security settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input defaultValue="sarah@example.com" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input type="password" />
                                </div>
                                <Button>Change Password</Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-red-500">Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive">Delete Account</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email Notifications</CardTitle>
                                <CardDescription>Choose what updates you want to receive.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>New Connections</Label>
                                        <p className="text-sm text-muted-foreground">Receive emails when someone invites you.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Messages</Label>
                                        <p className="text-sm text-muted-foreground">Receive emails for new messages.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Smart Matches</Label>
                                        <p className="text-sm text-muted-foreground">Weekly digest of potential matches.</p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="billing" className="mt-0">
                        <Card>
                            <CardContent className="pt-6 text-center text-muted-foreground">
                                Billing features coming soon.
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
