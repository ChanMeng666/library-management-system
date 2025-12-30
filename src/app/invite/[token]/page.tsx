'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Loader2, CheckCircle, XCircle, LogIn, UserPlus } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface InvitationDetails {
    email: string
    role: string
    organization_name: string
    organization_id: number
    expires_at: string
    status: string
}

export default function AcceptInvitationPage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string
    const { user, loading: authLoading } = useAuth()
    const { refreshOrganizations, switchOrganization } = useOrganization()
    const { toast } = useToast()

    const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAccepting, setIsAccepting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const fetchInvitation = async () => {
            try {
                const { data, error } = await supabase
                    .from('organization_invitations')
                    .select(`
                        email,
                        role,
                        expires_at,
                        status,
                        organizations (
                            organization_id,
                            name
                        )
                    `)
                    .eq('token', token)
                    .single()

                if (error) {
                    if (error.code === 'PGRST116') {
                        setError('Invalid invitation link. The invitation may have been revoked or does not exist.')
                    } else {
                        throw error
                    }
                    return
                }

                if (!data) {
                    setError('Invalid invitation link.')
                    return
                }

                // Check invitation status
                if (data.status !== 'pending') {
                    setError('This invitation has already been used or has been revoked.')
                    return
                }

                // Check expiration
                if (new Date(data.expires_at) < new Date()) {
                    setError('This invitation has expired. Please ask for a new invitation.')
                    return
                }

                const org = data.organizations as unknown as { organization_id: number; name: string }

                setInvitation({
                    email: data.email,
                    role: data.role,
                    organization_name: org.name,
                    organization_id: org.organization_id,
                    expires_at: data.expires_at,
                    status: data.status
                })
            } catch (err) {
                console.error('Error fetching invitation:', err)
                setError('Failed to load invitation details. Please try again.')
            } finally {
                setIsLoading(false)
            }
        }

        if (token) {
            fetchInvitation()
        }
    }, [token])

    const handleAcceptInvitation = async () => {
        if (!user || !invitation) return

        // Check if user email matches invitation email
        if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
            setError(`This invitation was sent to ${invitation.email}. Please sign in with that email address to accept the invitation.`)
            return
        }

        setIsAccepting(true)
        setError(null)

        try {
            const { data, error } = await supabase.rpc('accept_invitation', {
                p_token: token,
                p_user_id: user.id
            })

            if (error) throw error

            const result = data as { success: boolean; error?: string; organization_id?: number }

            if (result.success) {
                setSuccess(true)
                toast({
                    title: "Welcome!",
                    description: `You have successfully joined ${invitation.organization_name}`,
                })

                // Refresh organizations and switch to the new one
                await refreshOrganizations()
                if (result.organization_id) {
                    await switchOrganization(result.organization_id)
                }

                // Redirect to books page after a short delay
                setTimeout(() => {
                    router.push('/books')
                }, 2000)
            } else {
                let errorMessage = 'Failed to accept invitation'
                switch (result.error) {
                    case 'invalid_token':
                        errorMessage = 'Invalid invitation token'
                        break
                    case 'invitation_expired':
                        errorMessage = 'This invitation has expired'
                        break
                    case 'invitation_not_pending':
                        errorMessage = 'This invitation has already been used'
                        break
                    case 'email_mismatch':
                        errorMessage = 'Your email does not match the invitation email'
                        break
                    case 'user_limit_reached':
                        errorMessage = 'This organization has reached its member limit'
                        break
                    case 'already_member':
                        errorMessage = 'You are already a member of this organization'
                        break
                    default:
                        errorMessage = result.error || errorMessage
                }
                setError(errorMessage)
            }
        } catch (err) {
            console.error('Error accepting invitation:', err)
            setError('An unexpected error occurred. Please try again.')
        } finally {
            setIsAccepting(false)
        }
    }

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    // Show error state
    if (error && !invitation) {
        return (
            <div className="max-w-md mx-auto py-12">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
                            <p className="text-muted-foreground mb-6">{error}</p>
                            <Button asChild>
                                <Link href="/">Go to Home</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Show success state
    if (success) {
        return (
            <div className="max-w-md mx-auto py-12">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Welcome to {invitation?.organization_name}!</h2>
                            <p className="text-muted-foreground mb-6">
                                You have successfully joined the organization as a {invitation?.role}.
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

    // User not logged in - show login prompt
    if (!user) {
        return (
            <div className="max-w-md mx-auto py-12">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>Organization Invitation</CardTitle>
                        <CardDescription>
                            You&apos;ve been invited to join {invitation?.organization_name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Organization:</span>
                                <span className="font-medium">{invitation?.organization_name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Role:</span>
                                <span className="font-medium capitalize">{invitation?.role}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Invited as:</span>
                                <span className="font-medium">{invitation?.email}</span>
                            </div>
                        </div>

                        <Alert>
                            <AlertDescription>
                                Please sign in or create an account with <strong>{invitation?.email}</strong> to accept this invitation.
                            </AlertDescription>
                        </Alert>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" asChild>
                                <Link href={`/login?redirect=/invite/${token}`}>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Sign In
                                </Link>
                            </Button>
                            <Button className="flex-1" asChild>
                                <Link href={`/register?email=${encodeURIComponent(invitation?.email || '')}&redirect=/invite/${token}`}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Register
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // User logged in - show accept invitation UI
    return (
        <div className="max-w-md mx-auto py-12">
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Accept Invitation</CardTitle>
                    <CardDescription>
                        You&apos;ve been invited to join an organization
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Organization:</span>
                            <span className="font-medium">{invitation?.organization_name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Role:</span>
                            <span className="font-medium capitalize">{invitation?.role}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Invited as:</span>
                            <span className="font-medium">{invitation?.email}</span>
                        </div>
                    </div>

                    {user.email?.toLowerCase() !== invitation?.email.toLowerCase() && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                You are signed in as <strong>{user.email}</strong>, but this invitation
                                was sent to <strong>{invitation?.email}</strong>. Please sign out and
                                sign in with the correct email address.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => router.push('/')}
                            disabled={isAccepting}
                        >
                            Decline
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleAcceptInvitation}
                            disabled={isAccepting || user.email?.toLowerCase() !== invitation?.email.toLowerCase()}
                        >
                            {isAccepting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Accept Invitation
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
