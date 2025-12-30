'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { OrganizationSwitcher } from '@/components/organization/OrganizationSwitcher'
import { UserCircle, Settings, BookOpen, LayoutDashboard } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

export default function Header() {
    const router = useRouter()
    const { user, signOut } = useAuth()
    const { currentOrganization, isAdmin } = useOrganization()

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

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
                        {currentOrganization && (
                            <>
                                <Link href="/books" className="nav-link flex items-center gap-1">
                                    <BookOpen className="h-4 w-4" />
                                    Books
                                </Link>
                                <Link href="/dashboard" className="nav-link flex items-center gap-1">
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>
                            </>
                        )}
                        {!currentOrganization && !user && (
                            <Link href="/books" className="nav-link">
                                Browse Books
                            </Link>
                        )}
                    </nav>
                </div>
                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="flex items-center space-x-3">
                            {/* Organization Switcher */}
                            <OrganizationSwitcher />

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <UserCircle className="h-5 w-5" />
                                        <span className="hidden md:inline max-w-[150px] truncate">
                                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <span>{user.user_metadata?.full_name || 'User'}</span>
                                            <span className="text-xs text-muted-foreground font-normal">
                                                {user.email}
                                            </span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </DropdownMenuItem>
                                    {isAdmin && currentOrganization && (
                                        <>
                                            <DropdownMenuItem onClick={() => router.push('/org/settings')}>
                                                <Settings className="mr-2 h-4 w-4" />
                                                Organization Settings
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleSignOut}>
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
