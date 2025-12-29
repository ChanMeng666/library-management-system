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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2, User, Mail, Lock } from 'lucide-react'

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const { signUp } = useAuth()
    const router = useRouter()

    const validateForm = () => {
        if (!formData.username || !formData.email || !formData.fullName || !formData.password) {
            setError('All fields are required')
            return false
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return false
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return false
        }
        return true
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            await signUp(
                formData.email,
                formData.password,
                formData.username,
                formData.fullName
            )
            router.push('/dashboard')
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create account')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
            <Card className="w-full max-w-lg">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/library-management-system-logo.svg"
                            alt="Library Management System"
                            width={64}
                            height={64}
                            className="rounded-lg"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
                    <CardDescription className="text-center">
                        Join our library management system to start borrowing books
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        name="username"
                                        placeholder="johndoe"
                                        className="pl-9"
                                        value={formData.username}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        placeholder="John Doe"
                                        className="pl-9"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    className="pl-9"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        className="pl-9"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        className="pl-9"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-muted-foreground text-center w-full">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-primary hover:underline font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
