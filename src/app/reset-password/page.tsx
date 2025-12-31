'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, BookOpen, Lock, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
    const router = useRouter()

    useEffect(() => {
        // Check if we have a valid recovery session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            // The session will exist if the user clicked the reset link
            // Supabase automatically exchanges the token for a session
            if (session) {
                setIsValidSession(true)
            } else {
                // Listen for auth state change in case token is being processed
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'PASSWORD_RECOVERY') {
                        setIsValidSession(true)
                    } else if (session) {
                        setIsValidSession(true)
                    }
                })

                // Give it a moment for the token to be processed
                setTimeout(() => {
                    if (isValidSession === null) {
                        setIsValidSession(false)
                    }
                }, 2000)

                return () => subscription.unsubscribe()
            }
        }

        checkSession()
    }, [isValidSession])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) {
                throw error
            }

            setIsSuccess(true)

            // Sign out after password reset for security
            await supabase.auth.signOut()

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (error) {
            console.error('Password update error:', error)
            if (error instanceof Error) {
                setError(error.message)
            } else {
                setError('Failed to update password. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Loading state while checking session
    if (isValidSession === null) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <Card variant="glass" className="w-full max-w-md border-0 shadow-2xl">
                    <CardContent className="pt-12 pb-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#02FF73]" />
                        <p className="mt-4 text-muted-foreground">Verifying reset link...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Invalid or expired session
    if (isValidSession === false) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <Card variant="glass" className="w-full max-w-md border-0 shadow-2xl">
                    <CardHeader className="space-y-4 text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-display font-bold">
                                Invalid or expired link
                            </CardTitle>
                            <CardDescription className="mt-2">
                                This password reset link is invalid or has expired.
                                Please request a new one.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 text-center">
                        <Button variant="gradient" className="w-full" asChild>
                            <Link href="/forgot-password">
                                Request new reset link
                            </Link>
                        </Button>
                        <Link
                            href="/login"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center mt-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to login
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <Card variant="glass" className="w-full max-w-md border-0 shadow-2xl">
                    <CardHeader className="space-y-4 text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#02FF73] to-[#09ADAA] flex items-center justify-center shadow-lg shadow-[#02FF73]/20">
                            <CheckCircle2 className="h-8 w-8 text-black" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-display font-bold">
                                Password updated!
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Your password has been successfully reset.
                                Redirecting to login...
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#02FF73]" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Reset password form
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
            <Card variant="glass" className="w-full max-w-md border-0 shadow-2xl">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#02FF73] to-[#09ADAA] flex items-center justify-center shadow-lg shadow-[#02FF73]/20">
                        <BookOpen className="h-8 w-8 text-black" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-display font-bold">
                            Set new password
                        </CardTitle>
                        <CardDescription className="mt-2">
                            Enter your new password below
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
                            <Label htmlFor="password" className="text-sm font-medium">
                                New Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setError(null)
                                    }}
                                    disabled={isLoading}
                                    required
                                    minLength={6}
                                    className="pl-10"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Must be at least 6 characters
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                Confirm New Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value)
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
                                    Updating...
                                </>
                            ) : (
                                'Reset password'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
