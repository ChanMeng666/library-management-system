'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Building2,
    ArrowLeft,
    Loader2,
    Save,
    CreditCard,
    AlertTriangle,
    BookOpen,
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { Loading } from '@/components/ui/loading'

export default function OrganizationSettingsPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const {
        currentOrganization,
        isLoadingOrgs,
        isAdmin,
        isOwner,
        orgStats,
        refreshOrganizations
    } = useOrganization()

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [contactEmail, setContactEmail] = useState('')
    const [contactPhone, setContactPhone] = useState('')
    const [loanDurationDays, setLoanDurationDays] = useState(14)
    const [maxLoansPerUser, setMaxLoansPerUser] = useState(5)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (!isLoadingOrgs && !currentOrganization) {
            router.push('/org/select')
        }
    }, [isLoadingOrgs, currentOrganization, router])

    useEffect(() => {
        if (!isLoadingOrgs && currentOrganization && !isAdmin) {
            router.push('/dashboard')
        }
    }, [isLoadingOrgs, currentOrganization, isAdmin, router])

    // Load organization data
    useEffect(() => {
        if (currentOrganization) {
            setName(currentOrganization.name || '')
            setDescription(currentOrganization.description || '')
            setContactEmail(currentOrganization.contact_email || '')
            setContactPhone(currentOrganization.contact_phone || '')
            setLoanDurationDays(currentOrganization.loan_duration_days || 14)
            setMaxLoansPerUser(currentOrganization.max_loans_per_user || 5)
        }
    }, [currentOrganization])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (!name.trim()) {
            setError('Organization name is required')
            return
        }

        setIsSubmitting(true)

        try {
            const { error: updateError } = await supabase
                .from('organizations')
                .update({
                    name: name.trim(),
                    description: description.trim() || null,
                    contact_email: contactEmail.trim() || null,
                    contact_phone: contactPhone.trim() || null,
                    loan_duration_days: loanDurationDays,
                    max_loans_per_user: maxLoansPerUser
                })
                .eq('organization_id', currentOrganization?.organization_id)

            if (updateError) {
                throw updateError
            }

            await refreshOrganizations()
            setSuccess('Organization settings updated successfully')
        } catch (err) {
            console.error('Error updating organization:', err)
            setError('Failed to update organization settings')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (authLoading || isLoadingOrgs) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    if (!user || !currentOrganization || !isAdmin) {
        return null
    }

    const getPlanBadgeVariant = (plan: string | null) => {
        switch (plan) {
            case 'enterprise':
                return 'default'
            case 'pro':
                return 'secondary'
            default:
                return 'outline'
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Organization Settings</h1>
                        <p className="text-muted-foreground">{currentOrganization.slug}</p>
                    </div>
                </div>
                <Badge variant={getPlanBadgeVariant(currentOrganization.subscription_plan)}>
                    {currentOrganization.subscription_plan || 'free'} plan
                </Badge>
            </div>

            <div className="grid gap-6">
                {/* Usage Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Current Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex items-center gap-3">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">{orgStats?.total_books || 0}</p>
                                    <p className="text-sm text-muted-foreground">
                                        of {orgStats?.books_quota || 'unlimited'} books
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Users className="h-8 w-8 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">{orgStats?.total_members || 0}</p>
                                    <p className="text-sm text-muted-foreground">
                                        of {orgStats?.users_quota || 'unlimited'} members
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-8 w-8 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">{orgStats?.active_loans || 0}</p>
                                    <p className="text-sm text-muted-foreground">active loans</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">General Settings</CardTitle>
                        <CardDescription>
                            Basic information about your organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {success && (
                                <Alert>
                                    <AlertDescription>{success}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Organization Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Organization URL</Label>
                                    <Input
                                        id="slug"
                                        value={currentOrganization.slug}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">URL cannot be changed</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <Separator />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contactEmail">Contact Email</Label>
                                    <Input
                                        id="contactEmail"
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone">Contact Phone</Label>
                                    <Input
                                        id="contactPhone"
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="loanDuration">Default Loan Duration (days)</Label>
                                    <Input
                                        id="loanDuration"
                                        type="number"
                                        min={1}
                                        max={365}
                                        value={loanDurationDays}
                                        onChange={(e) => setLoanDurationDays(parseInt(e.target.value) || 14)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxLoans">Max Loans per User</Label>
                                    <Input
                                        id="maxLoans"
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={maxLoansPerUser}
                                        onChange={(e) => setMaxLoansPerUser(parseInt(e.target.value) || 5)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Subscription */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Subscription
                        </CardTitle>
                        <CardDescription>
                            Manage your subscription plan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                                {currentOrganization.subscription_status === 'active' ||
                                 currentOrganization.subscription_status === 'trialing' ? (
                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                ) : currentOrganization.subscription_status === 'past_due' ? (
                                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                                ) : (
                                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                                )}
                                <div>
                                    <p className="font-semibold text-lg capitalize">
                                        {currentOrganization.subscription_plan || 'Free'} Plan
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                currentOrganization.subscription_status === 'active' ? 'default' :
                                                currentOrganization.subscription_status === 'trialing' ? 'secondary' :
                                                currentOrganization.subscription_status === 'past_due' ? 'destructive' :
                                                'outline'
                                            }
                                        >
                                            {currentOrganization.subscription_status === 'trialing'
                                                ? 'Trial'
                                                : currentOrganization.subscription_status || 'Free'}
                                        </Badge>
                                        {currentOrganization.cancel_at_period_end && (
                                            <Badge variant="destructive">Canceling</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button onClick={() => router.push('/org/billing')}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Manage Billing
                            </Button>
                        </div>

                        {/* Subscription Details */}
                        {currentOrganization.stripe_subscription_id && (
                            <div className="grid gap-4 md:grid-cols-2 pt-2">
                                {currentOrganization.current_period_end && (
                                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {currentOrganization.cancel_at_period_end
                                                    ? 'Access ends on'
                                                    : 'Next billing date'}
                                            </p>
                                            <p className="font-medium">
                                                {format(new Date(currentOrganization.current_period_end), 'MMMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {currentOrganization.subscription_status === 'trialing' && currentOrganization.trial_ends_at && (
                                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Trial ends on</p>
                                            <p className="font-medium">
                                                {format(new Date(currentOrganization.trial_ends_at), 'MMMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upgrade prompt for free users */}
                        {(!currentOrganization.subscription_plan || currentOrganization.subscription_plan === 'free') && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Upgrade to a paid plan to unlock more books, members, and advanced features.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                {isOwner && (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Danger Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Delete Organization</p>
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete this organization and all its data
                                    </p>
                                </div>
                                <Button variant="destructive" disabled>
                                    Delete Organization
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
