import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Users, Clock, Search, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'

const features = [
    {
        icon: BookOpen,
        title: "Extensive Collection",
        description: "Access thousands of books across various genres and topics with powerful search and filtering.",
        color: "from-[#02FF73] to-[#09ADAA]",
    },
    {
        icon: Users,
        title: "Team Management",
        description: "Invite members, assign roles, and manage your organization's library access effortlessly.",
        color: "from-[#09ADAA] to-[#02FF73]",
    },
    {
        icon: Clock,
        title: "Smart Tracking",
        description: "Automated due date reminders, loan history, and overdue notifications keep everyone on track.",
        color: "from-[#02FF73] to-[#09ADAA]",
    },
    {
        icon: Search,
        title: "Quick Discovery",
        description: "Find your next read instantly with our advanced search by title, author, ISBN, or category.",
        color: "from-[#09ADAA] to-[#02FF73]",
    },
]

const stats = [
    { value: "10K+", label: "Books Managed" },
    { value: "500+", label: "Organizations" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
]

export default function Home() {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden w-full">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#02FF73]/5 via-transparent to-[#09ADAA]/5" />
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#02FF73]/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#09ADAA]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

                {/* Grid Pattern - Full Width */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px]" />

                <div className="container mx-auto px-4 relative z-10 py-20 md:py-32">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Announcement Badge */}
                        <div className="inline-flex items-center gap-2 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <Badge variant="gradient" className="px-4 py-1.5 text-sm">
                                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                Now with Multi-Organization Support
                            </Badge>
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Your Digital
                            <span className="block bg-gradient-to-r from-[#02FF73] to-[#09ADAA] bg-clip-text text-transparent">
                                Library Experience
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            Discover, borrow, and manage your reading journey with our modern library management system.
                            Built for teams who love books.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <Button variant="gradient" size="xl" asChild>
                                <Link href="/register" className="group">
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="xl" asChild>
                                <Link href="/books">
                                    Browse Catalog
                                </Link>
                            </Button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-[#02FF73]" />
                                <span>Secure & Private</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-[#02FF73]" />
                                <span>Lightning Fast</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-[#02FF73]" />
                                <span>Team Ready</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 border-y border-border/40 bg-muted/20 w-full">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-[#02FF73] to-[#09ADAA] bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 md:py-32 w-full">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <Badge variant="outline" className="mb-4">Features</Badge>
                        <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-4">
                            Everything you need to manage your library
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Powerful features designed to make library management effortless for organizations of any size.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <Card
                                    key={index}
                                    variant="interactive"
                                    className="group p-6 md:p-8"
                                >
                                    <CardContent className="p-0">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                                            <Icon className="h-7 w-7 text-black" />
                                        </div>
                                        <h3 className="text-xl font-display font-semibold mb-3">
                                            {feature.title}
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 md:py-32 relative overflow-hidden w-full">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#02FF73]/10 to-[#09ADAA]/10" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:24px_24px]" />

                <div className="container mx-auto px-4 relative z-10">
                    <Card variant="glass" className="max-w-4xl mx-auto p-8 md:p-12 text-center">
                        <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-4">
                            Ready to transform your library?
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                            Join hundreds of organizations already using our platform to manage their book collections efficiently.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button variant="gradient" size="lg" asChild>
                                <Link href="/register">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" asChild>
                                <Link href="/org/join">
                                    Join an Organization
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    )
}
