'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { UserCircle } from 'lucide-react'

export default function Header() {
    const { user, signOut } = useAuth()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
            <div className="container h-14 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image
                            src="/library-management-system-logo.svg"
                            alt="Library Management System"
                            width={32}
                            height={32}
                            className="rounded"
                        />
                    </Link>
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link href="/books" className="nav-link">
                            Browse Books
                        </Link>
                        {user && (
                            <Link href="/dashboard" className="nav-link">
                                Dashboard
                            </Link>
                        )}
                    </nav>
                </div>
                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center space-x-2">
                                <UserCircle className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {user.email}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => signOut()}
                                size="sm"
                            >
                                Sign Out
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
