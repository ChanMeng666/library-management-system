'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Building2,
    Loader2,
    Search,
    Users,
    BookOpen,
    CheckCircle,
    ArrowLeft
} from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface OrganizationInfo {
    organization_id: number
    name: string
    slug: string
    contact_email: string | null
    subscription_plans: {
        name: string
    } | null
}

function JoinOrganizationContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialSlug = searchParams.get('slug') || ''
    const { user, loading: authLoading } = useAuth()
    const { refreshOrganizations, switchOrganization } = useOrganization()
    const { toast } = useToast()

    const [slug, setSlug] = useState(initialSlug)
    const [organization, setOrganization] = useState<OrganizationInfo | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [isJoining, setIsJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [alreadyMember, setAlreadyMember] = useState(false)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?redirect=/org/join${initialSlug ? `?slug=${initialSlug}` : ''}`)
        }
    }, [user, authLoading, router, initialSlug])

    useEffect(() => {
        if (initialSlug && user) {
            handleSearch()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSlug, user])

    const handleSearch = async () => {
        if (!slug.trim()) {
            setError('Please enter an organization code')
            return
        }

        setIsSearching(true)
        setError(null)
        setOrganization(null)
        setAlreadyMember(false)

        try {
            // Search for organization by slug
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select(`
                    organization_id,
                    name,
                    slug,
                    contact_email,
                    subscription_plans (
                        name
                    )
                `)
                .eq('slug', slug.trim().toLowerCase())
                .single()

            if (orgError) {
                if (orgError.code === 'PGRST116') {
                    setError('No organization found with this code. Please check and try again.')
                } else {
                    throw orgError
                }
                return
            }

            if (!orgData) {
                setError('No organization found with this code.')
                return
            }

            // Check if user is already a member
            const { data: memberData } = await supabase
                .from('organization_members')
                .select('member_id')
                .eq('organization_id', orgData.organization_id)
                .eq('user_id', user?.id)
                .single()

            if (memberData) {
                setAlreadyMember(true)
                setOrganization(orgData as unknown as OrganizationInfo)
                return
            }

            setOrganization(orgData as unknown as OrganizationInfo)
        } catch (err) {
            console.error('Error searching organization:', err)
            setError('Failed to search for organization. Please try again.')
        } finally {
            setIsSearching(false)
        }
    }

    const handleJoin = async () => {
        if (!user || !organization) return

        setIsJoining(true)
        setError(null)

        try {
            // Check if organization has space for new members
            const { data: memberCount } = await supabase
                .from('organization_members')
                .select('member_id', { count: 'exact', head: true })
                .eq('organization_id', organization.organization_id)

            // Get organization's plan limits
            const { data: orgPlan } = await supabase
                .from('organizations')
                .select(`
                    subscription_plans (
                        max_users
                    )
                `)
                .eq('organization_id', organization.organization_id)
                .single()

            const maxUsers = (orgPlan?.subscription_plans as unknown as { max_users: number })?.max_users || 5
            const currentCount = memberCount || 0

            if (currentCount >= maxUsers) {
                setError('This organization has reached its maximum member limit.')
                return
            }

            // Add user as a member with 'member' role
            const { error: insertError } = await supabase
                .from('organization_members')
                .insert({
                    organization_id: organization.organization_id,
                    user_id: user.id,
                    role: 'member'
                })

            if (insertError) {
                if (insertError.code === '23505') {
                    setError('You are already a member of this organization.')
                } else {
                    throw insertError
                }
                return
            }

            setSuccess(true)
            toast({
                title: "Welcome!",
                description: `You have successfully joined ${organization.name}`,
            })

            // Refresh organizations and switch to the new one
            await refreshOrganizations()
            await switchOrganization(organization.organization_id)

            // Redirect to books page after a short delay
            setTimeout(() => {
                router.push('/books')
            }, 2000)
        } catch (err) {
            console.error('Error joining organization:', err)
            setError('Failed to join organization. Please try again.')
        } finally {
            setIsJoining(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
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

    // Success state
    if (success) {
        return (
            <div className="max-w-md mx-auto py-12">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Welcome to {organization?.name}!</h2>
                            <p className="text-muted-foreground mb-6">
                                You have successfully joined the organization.
                                Redirecting you to the library...
                            </p>
                            <div className="flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-lg mx-auto py-8">
            <Button
                variant="ghost"
                onClick={() => router.push('/org/select')}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Organizations
            </Button>

            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                        <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Join an Organization</CardTitle>
                    <CardDescription>
                        Enter an organization code to find and join a library
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="slug">Organization Code</Label>
                        <div className="flex gap-2">
                            <Input
                                id="slug"
                                placeholder="e.g., my-library"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isSearching || isJoining}
                            />
                            <Button
                                onClick={handleSearch}
                                disabled={isSearching || isJoining || !slug.trim()}
                            >
                                {isSearching ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Ask your organization administrator for the unique code
                        </p>
                    </div>

                    {organization && (
                        <div className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{organization.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        @{organization.slug}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <BookOpen className="h-4 w-4" />
                                    <span>Library Access</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>{organization.subscription_plans?.name || 'Free'} Plan</span>
                                </div>
                            </div>

                            {alreadyMember ? (
                                <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        You are already a member of this organization.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Button
                                    className="w-full"
                                    onClick={handleJoin}
                                    disabled={isJoining}
                                >
                                    {isJoining ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            <Users className="mr-2 h-4 w-4" />
                                            Join Organization
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="text-center text-sm text-muted-foreground">
                        <p>Don&apos;t have an organization code?</p>
                        <Link href="/org/create" className="text-primary hover:underline">
                            Create your own organization
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function JoinOrganizationPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        }>
            <JoinOrganizationContent />
        </Suspense>
    )
}
