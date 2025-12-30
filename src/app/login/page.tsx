'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, BookOpen, Mail, Lock } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const { signIn } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            await signIn(email, password)
            router.push('/dashboard')
        } catch (error) {
            console.error('Login error:', error);
            setError('Invalid credentials. Please check your email and password.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex">
            {/* Form Side */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md">
                    <Card variant="glass" className="border-0 shadow-2xl">
                        <CardHeader className="space-y-4 text-center pb-2">
                            {/* Logo Icon */}
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#02FF73] to-[#09ADAA] flex items-center justify-center shadow-lg shadow-[#02FF73]/20">
                                <BookOpen className="h-8 w-8 text-black" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-display font-bold">
                                    Welcome back
                                </CardTitle>
                                <CardDescription className="mt-2">
                                    Sign in to continue to your library
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <Alert variant="destructive" className="animate-fade-in">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        Email
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value)
                                                setError(null)
                                            }}
                                            disabled={isLoading}
                                            required
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-sm font-medium">
                                            Password
                                        </Label>
                                        <Link
                                            href="#"
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value)
                                                setError(null)
                                            }}
                                            disabled={isLoading}
                                            required
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="gradient"
                                    className="w-full"
                                    size="lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 pt-2">
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">
                                        New to Library?
                                    </span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/register">
                                    Create an account
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* Visual Side */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#02FF73] to-[#09ADAA] items-center justify-center p-12 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0001_1px,transparent_1px),linear-gradient(to_bottom,#0001_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* Decorative Circles */}
                <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-48 h-48 bg-black/10 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-md text-black">
                    <div className="mb-8">
                        <Image
                            src="/library-management-system-logo.svg"
                            alt="Library"
                            width={64}
                            height={64}
                            className="rounded-xl shadow-lg"
                        />
                    </div>
                    <h2 className="text-4xl font-display font-bold mb-4">
                        Manage Your Library Effortlessly
                    </h2>
                    <p className="text-lg opacity-80 mb-8">
                        Join thousands of organizations using our platform to organize, track, and share their book collections.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full bg-black/20 border-2 border-[#02FF73] flex items-center justify-center text-xs font-bold"
                                >
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm font-medium opacity-80">
                            500+ organizations trust us
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
