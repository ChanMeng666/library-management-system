'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { OrganizationSwitcher } from '@/components/organization/OrganizationSwitcher'
import { UserCircle, Settings, BookOpen, LayoutDashboard, Menu, X, LogOut } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const { user, signOut } = useAuth()
    const { currentOrganization, isAdmin } = useOrganization()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    const navItems = currentOrganization ? [
        { href: '/books', label: 'Books', icon: BookOpen },
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ] : []

    const isActivePath = (path: string) => pathname === path

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container h-16 flex items-center justify-between">
                {/* Logo & Navigation */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative overflow-hidden">
                            <Image
                                src="/libraryos-logo.svg"
                                alt="LibraryOS"
                                width={36}
                                height={36}
                                className="transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#02FF73] to-[#09ADAA] opacity-0 group-hover:opacity-20 transition-opacity" />
                        </div>
                        <span className="font-display font-bold text-lg hidden sm:inline bg-gradient-to-r from-[#02FF73] to-[#09ADAA] bg-clip-text text-transparent">
                            LibraryOS
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = isActivePath(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "relative px-4 py-2 text-sm font-medium transition-colors rounded-lg group",
                                        isActive
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </span>
                                    {/* Active indicator */}
                                    <span
                                        className={cn(
                                            "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-[#02FF73] to-[#09ADAA] transition-all duration-300 rounded-full",
                                            isActive ? "w-3/4" : "w-0 group-hover:w-1/2"
                                        )}
                                    />
                                </Link>
                            )
                        })}
                        {!currentOrganization && !user && (
                            <Link
                                href="/books"
                                className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg group"
                            >
                                Browse Books
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#02FF73] to-[#09ADAA] group-hover:w-1/2 transition-all duration-300 rounded-full" />
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            {/* Organization Switcher */}
                            <OrganizationSwitcher />

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2 hover:bg-accent/50"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#02FF73] to-[#09ADAA] flex items-center justify-center">
                                            <UserCircle className="h-5 w-5 text-black" />
                                        </div>
                                        <span className="hidden md:inline max-w-[120px] truncate font-medium">
                                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">
                                                {user.user_metadata?.full_name || 'User'}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-normal truncate">
                                                {user.email}
                                            </span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => router.push('/dashboard')}
                                        className="cursor-pointer"
                                    >
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => router.push('/account/settings')}
                                        className="cursor-pointer"
                                    >
                                        <UserCircle className="mr-2 h-4 w-4" />
                                        Account Settings
                                    </DropdownMenuItem>
                                    {isAdmin && currentOrganization && (
                                        <DropdownMenuItem
                                            onClick={() => router.push('/org/settings')}
                                            className="cursor-pointer"
                                        >
                                            <Settings className="mr-2 h-4 w-4" />
                                            Organization Settings
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button variant="gradient" size="sm">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
                    <nav className="container py-4 flex flex-col gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = isActivePath(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-accent text-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            )
                        })}
                        {!currentOrganization && !user && (
                            <Link
                                href="/books"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            >
                                <BookOpen className="h-5 w-5" />
                                Browse Books
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    )
}
