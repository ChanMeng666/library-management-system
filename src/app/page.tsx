import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Clock, Search } from 'lucide-react'

export default function Home() {
    const features = [
        {
            icon: <BookOpen className="h-10 w-10" />,
            title: "Extensive Collection",
            description: "Access thousands of books across various genres and topics"
        },
        {
            icon: <Users className="h-10 w-10" />,
            title: "Easy Management",
            description: "Simple borrowing and return process with online tracking"
        },
        {
            icon: <Clock className="h-10 w-10" />,
            title: "24/7 Access",
            description: "Browse and manage your books anytime, anywhere"
        },
        {
            icon: <Search className="h-10 w-10" />,
            title: "Smart Search",
            description: "Find your next read with our advanced search system"
        }
    ]

    return (
        <div className="flex flex-col items-center">
            {/* Hero Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <Image
                            src="/library-management-system-logo.svg"
                            alt="Library Management System"
                            width={120}
                            height={120}
                            className="rounded-2xl mb-4"
                            priority
                        />
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                            Welcome to Your Digital Library
                        </h1>
                        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                            Discover, borrow, and manage your reading journey with our modern library system.
                        </p>
                        <div className="space-x-4">
                            <Button asChild size="lg">
                                <Link href="/books">Browse Books</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/register">Join Now</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">
                        Why Choose Our Library
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
                            >
                                <div className="h-20 w-20 flex items-center justify-center rounded-full bg-primary/10 mb-4 text-primary">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
