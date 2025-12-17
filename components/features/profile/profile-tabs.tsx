"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ProfileTabs() {
    return (
        <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Bio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                            I'm a passionate Full Stack Developer with 5 years of experience building scalable web applications.
                            My expertise lies in the React ecosystem (Next.js), Node.js, and cloud architecture.
                            <br /><br />
                            Currently, I'm exploring the intersection of Web3 and AI, looking for opportunities to collaborate on innovative projects.
                            I love solving complex problems and mentoring junior developers.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Looking For</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>Technical Co-founder for a SaaS project</li>
                            <li>Open source contributions</li>
                            <li>Mentorship opportunities</li>
                        </ul>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="experience" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Work Experience</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="border-l-2 border-muted pl-6 pb-6 relative">
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary" />
                            <h3 className="font-bold">Senior Developer</h3>
                            <p className="text-sm text-muted-foreground">TechStart Inc. • 2022 - Present</p>
                            <p className="mt-2 text-muted-foreground">Leading the frontend team, migrating legacy codebase to Next.js, and improving performance by 40%.</p>
                        </div>
                        <div className="border-l-2 border-muted pl-6 relative">
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-muted-foreground" />
                            <h3 className="font-bold">Software Engineer</h3>
                            <p className="text-sm text-muted-foreground">Creative Solutions • 2019 - 2022</p>
                            <p className="mt-2 text-muted-foreground">Developed full-stack features for e-commerce clients using MERN stack.</p>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">No public projects yet.</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
