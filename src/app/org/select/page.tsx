'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Users, BookOpen, ArrowRight, UserPlus } from 'lucide-react'
import { Loading } from '@/components/ui/loading'

export default function SelectOrganizationPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const {
        organizations,
        isLoadingOrgs,
        switchOrganization,
        currentOrganization
    } = useOrganization()

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    // If user has a current organization, redirect to dashboard
    useEffect(() => {
        if (!isLoadingOrgs && currentOrganization) {
            router.push('/dashboard')
        }
    }, [isLoadingOrgs, currentOrganization, router])

    const handleSelectOrg = async (orgId: string) => {
        await switchOrganization(orgId)
        router.push('/dashboard')
    }

    if (authLoading || isLoadingOrgs) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'owner':
                return 'default'
            case 'admin':
                return 'secondary'
            default:
                return 'outline'
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Select Your Organization</h1>
                <p className="text-muted-foreground">
                    Choose an organization to continue, or create a new one
                </p>
            </div>

            {organizations.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 mb-8">
                    {organizations.map((org) => (
                        <Card
                            key={org.organization_id}
                            className="cursor-pointer hover:border-primary transition-colors"
                            onClick={() => handleSelectOrg(org.organization_id)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Building2 className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{org.name}</CardTitle>
                                            <CardDescription>/{org.slug}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={getRoleBadgeVariant(org.role)}>
                                        {org.role}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="h-4 w-4" />
                                            {org.subscription_plan}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        Select <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="mb-8">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Organizations Yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            You are not a member of any organization. Join an existing organization or create a new one.
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col items-center gap-4">
                <div className="relative w-full max-w-xs">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => router.push('/org/join')}
                        className="gap-2"
                    >
                        <UserPlus className="h-5 w-5" />
                        Join Organization
                    </Button>
                    <Button
                        size="lg"
                        onClick={() => router.push('/org/create')}
                        className="gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Create New Organization
                    </Button>
                </div>
            </div>
        </div>
    )
}
