'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, BookOpen, Mail, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react'

export default function MagicLinkLogin() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const redirectUrl = `${window.location.origin}/dashboard`

            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: redirectUrl,
                }
            })

            if (error) {
                throw error
            }

            setIsSuccess(true)
        } catch (error) {
            console.error('Magic link error:', error)
            if (error instanceof Error) {
                setError(error.message)
            } else {
                setError('Failed to send magic link. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

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
                                Check your email
                            </CardTitle>
                            <CardDescription className="mt-2">
                                We&apos;ve sent a magic link to <strong>{email}</strong>
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground mb-6">
                            Click the link in the email to sign in instantly.
                            No password needed! If you don&apos;t see it, check your spam folder.
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
            <Card variant="glass" className="w-full max-w-md border-0 shadow-2xl">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#02FF73] to-[#09ADAA] flex items-center justify-center shadow-lg shadow-[#02FF73]/20">
                        <Sparkles className="h-8 w-8 text-black" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-display font-bold">
                            Sign in with Magic Link
                        </CardTitle>
                        <CardDescription className="mt-2">
                            No password needed - we&apos;ll email you a secure link
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
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Send Magic Link
                                </>
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
                                Or continue with
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/login">
                            Sign in with password
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
