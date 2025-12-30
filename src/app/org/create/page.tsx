'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, ArrowLeft, Loader2 } from 'lucide-react'
import { Loading } from '@/components/ui/loading'

export default function CreateOrganizationPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const { createOrganization, refreshOrganizations } = useOrganization()

    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    // Auto-generate slug from name
    useEffect(() => {
        const generatedSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 50)
        setSlug(generatedSlug)
    }, [name])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!name.trim()) {
            setError('Organization name is required')
            return
        }

        if (!slug.trim()) {
            setError('Organization slug is required')
            return
        }

        if (slug.length < 3) {
            setError('Slug must be at least 3 characters')
            return
        }

        if (!/^[a-z0-9-]+$/.test(slug)) {
            setError('Slug can only contain lowercase letters, numbers, and hyphens')
            return
        }

        setIsSubmitting(true)

        try {
            const result = await createOrganization(name.trim(), slug.trim(), description.trim() || undefined)

            if (result.success) {
                await refreshOrganizations()
                router.push('/dashboard')
            } else {
                if (result.error === 'slug_taken') {
                    setError('This organization URL is already taken. Please choose a different one.')
                } else {
                    setError(result.error || 'Failed to create organization')
                }
            }
        } catch (err) {
            console.error('Error creating organization:', err)
            setError('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="max-w-xl mx-auto py-8">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Create Organization</CardTitle>
                            <CardDescription>
                                Set up a new organization for your library
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name *</Label>
                            <Input
                                id="name"
                                placeholder="My Library"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                maxLength={100}
                            />
                            <p className="text-xs text-muted-foreground">
                                This is the display name for your organization
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Organization URL *</Label>
                            <div className="flex items-center">
                                <span className="text-sm text-muted-foreground mr-1">
                                    library.app/org/
                                </span>
                                <Input
                                    id="slug"
                                    placeholder="my-library"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    disabled={isSubmitting}
                                    maxLength={50}
                                    className="flex-1"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                URL-friendly identifier (lowercase letters, numbers, and hyphens only)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                placeholder="A brief description of your organization"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isSubmitting}
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground">
                                Optional: Describe what this organization is for
                            </p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium mb-2">What happens next?</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>- You will become the owner of this organization</li>
                                <li>- You can invite members and assign roles</li>
                                <li>- Start with a free plan (100 books, 5 users)</li>
                                <li>- Upgrade anytime for more features</li>
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Organization'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
