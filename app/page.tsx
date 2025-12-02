import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShinyText } from "@/components/ui/shiny-text";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { GridBackground } from "@/components/ui/grid-background";
import {
  Menu,
  Zap,
  Users,
  Brain,
  ArrowRight,
  CheckCircle2,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <GridBackground />

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Collabryx</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="#features" className="transition-colors hover:text-primary">
              Features
            </Link>
            <Link href="#how-it-works" className="transition-colors hover:text-primary">
              How It Works
            </Link>
            <Link href="#testimonials" className="transition-colors hover:text-primary">
              Testimonials
            </Link>
            <Link href="#faq" className="transition-colors hover:text-primary">
              FAQ
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Link href="#features" className="text-lg font-medium">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-lg font-medium">
                  How It Works
                </Link>
                <Link href="#testimonials" className="text-lg font-medium">
                  Testimonials
                </Link>
                <Link href="#faq" className="text-lg font-medium">
                  FAQ
                </Link>
                <div className="flex flex-col gap-2 mt-4">
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  🚀 Launching Phase 1
                </Badge>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl xl:text-7xl">
                  Connect with <br />
                  <ShinyText text="Purpose" className="text-primary" speed={4} />
                </h1>
                <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl leading-relaxed">
                  The AI-powered platform for students, founders, and professionals to find their perfect match based on skills, goals, and compatibility.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                    Start Matching Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                    Learn More
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                      <Avatar className="h-full w-full">
                        <AvatarFallback className="text-[10px]">U{i}</AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                </div>
                <p>Trusted by 1,000+ early adopters</p>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none">
              <div className="relative aspect-square w-full animate-float">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl -z-10" />
                <Image
                  src="/hero-illustration.png"
                  alt="Collabryx Hero Illustration"
                  width={800}
                  height={800}
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-y bg-muted/30 py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-wider">
              Students from top universities are already here
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              {["MIT", "Stanford", "Harvard", "Berkeley", "Oxford"].map((uni) => (
                <span key={uni} className="text-xl md:text-2xl font-bold text-foreground/80">
                  {uni}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-24">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Why Choose Collabryx?
            </h2>
            <p className="text-lg text-muted-foreground">
              We use advanced AI to go beyond simple keyword matching, understanding the semantic context of your profile to find truly compatible connections.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <ScrollReveal delay={100}>
              <Card className="h-full border-none shadow-lg bg-card/50 backdrop-blur-sm hover:bg-card transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <Brain className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">AI Semantic Matching</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our AI analyzes your bio, skills, and goals to find people who truly complement your journey, not just those with matching tags.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <Card className="h-full border-none shadow-lg bg-card/50 backdrop-blur-sm hover:bg-card transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Meaningful Networking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Skip the small talk. Connect with purpose-driven individuals who are ready to collaborate, mentor, or build something great together.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <Card className="h-full border-none shadow-lg bg-card/50 backdrop-blur-sm hover:bg-card transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <Zap className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Smart Mentorship</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Find mentors who have walked the path you're on, or become a mentor to guide the next generation of innovators.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Three simple steps to start building your dream network.
              </p>
            </div>

            <div className="grid gap-12 md:grid-cols-3 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-border -z-10" />

              {[
                {
                  step: "01",
                  title: "Create Profile",
                  desc: "Sign up and tell us about your skills, goals, and what you're looking for.",
                },
                {
                  step: "02",
                  title: "Get Matched",
                  desc: "Our AI engine analyzes your profile and suggests highly compatible connections.",
                },
                {
                  step: "03",
                  title: "Start Collaborating",
                  desc: "Connect, chat, and start building the future with your new network.",
                },
              ].map((item, index) => (
                <ScrollReveal key={index} delay={index * 200}>
                  <div className="flex flex-col items-center text-center space-y-4 bg-background p-6 rounded-xl shadow-sm border relative">
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-background">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="container mx-auto px-4 py-24">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-center mb-16">
            What People Are Saying
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Sarah Chen",
                role: "CS Student @ Stanford",
                content: "Collabryx helped me find a co-founder for my AI startup in less than a week. The matching quality is insane!",
              },
              {
                name: "James Wilson",
                role: "Product Manager @ TechCorp",
                content: "I've been looking for a way to mentor students effectively. This platform connects me with exactly the right mentees.",
              },
              {
                name: "Elena Rodriguez",
                role: "UX Designer",
                content: "Finally, a networking platform that feels authentic. No spam, just genuine connections with people who share my interests.",
              },
            ].map((testimonial, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <Card className="h-full bg-muted/20">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                    <p className="italic text-muted-foreground">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Avatar>
                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container mx-auto px-4 py-24 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-center mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is Collabryx free to use?</AccordionTrigger>
              <AccordionContent>
                Yes, Collabryx is currently free for all students and early-stage founders during our beta phase.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How does the AI matching work?</AccordionTrigger>
              <AccordionContent>
                We use OpenAI's embedding models to analyze the semantic meaning of your profile (bio, skills, goals) and match you with users who have complementary attributes, not just identical keywords.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I use this for finding a job?</AccordionTrigger>
              <AccordionContent>
                While Collabryx is focused on networking, mentorship, and co-founder matching, many users find that these connections naturally lead to career opportunities.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-24">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-20 text-center md:px-12 lg:px-20">
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-shine opacity-30" />
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl mb-8">
              Ready to find your perfect match?
            </h2>
            <p className="mx-auto max-w-xl text-lg text-primary-foreground/80 mb-10">
              Join thousands of students and founders who are building the future together.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">Collabryx</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting the world's brightest minds with purpose.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#how-it-works">How it Works</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/careers">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex gap-4 text-muted-foreground">
                <Link href="#" className="hover:text-primary"><Twitter className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-primary"><Github className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-primary"><Linkedin className="h-5 w-5" /></Link>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Collabryx Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
