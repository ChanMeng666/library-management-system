'use client'

import { useState, useEffect, useCallback } from 'react'
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Users,
    ArrowLeft,
    Loader2,
    UserPlus,
    MoreHorizontal,
    Mail,
    Shield,
    UserX,
    Clock
} from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import type { OrganizationRole } from '@/types/supabase'

interface Member {
    membership_id: string
    user_id: string
    role: OrganizationRole
    status: string
    joined_at: string | null
    user: {
        email: string
        full_name: string
        username: string
    } | null
}

interface Invitation {
    invitation_id: string
    email: string
    role: string
    status: string
    expires_at: string
    created_at: string
}

export default function OrganizationMembersPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const {
        currentOrganization,
        isLoadingOrgs,
        isAdmin,
        isOwner,
        currentRole
    } = useOrganization()

    const [members, setMembers] = useState<Member[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Invite form
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<string>('member')
    const [isInviting, setIsInviting] = useState(false)
    const [inviteError, setInviteError] = useState<string | null>(null)
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

    const fetchMembers = useCallback(async () => {
        if (!currentOrganization) return

        try {
            // Fetch members with user info
            const { data: membersData, error: membersError } = await supabase
                .from('organization_members')
                .select(`
                    membership_id,
                    user_id,
                    role,
                    status,
                    joined_at
                `)
                .eq('organization_id', currentOrganization.organization_id)
                .order('joined_at', { ascending: true })

            if (membersError) {
                console.error('Error fetching members:', membersError)
                return
            }

            // Fetch user details for each member
            if (membersData && membersData.length > 0) {
                const userIds = membersData.map(m => m.user_id)
                const { data: usersData } = await supabase
                    .from('users')
                    .select('user_id, email, full_name, username')
                    .in('user_id', userIds)

                const membersWithUsers = membersData.map(member => ({
                    ...member,
                    user: usersData?.find(u => u.user_id === member.user_id) || null
                }))

                setMembers(membersWithUsers as Member[])
            } else {
                setMembers([])
            }

            // Fetch pending invitations
            const { data: invitationsData, error: invitationsError } = await supabase
                .from('organization_invitations')
                .select('*')
                .eq('organization_id', currentOrganization.organization_id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (!invitationsError && invitationsData) {
                setInvitations(invitationsData)
            }
        } catch (error) {
            console.error('Error fetching members:', error)
        } finally {
            setIsLoading(false)
        }
    }, [currentOrganization])

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

    useEffect(() => {
        if (currentOrganization && isAdmin) {
            fetchMembers()
        }
    }, [currentOrganization, isAdmin, fetchMembers])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setInviteError(null)
        setInviteSuccess(null)

        if (!inviteEmail.trim()) {
            setInviteError('Email is required')
            return
        }

        setIsInviting(true)

        try {
            const { data, error } = await supabase.rpc('invite_to_organization', {
                p_organization_id: currentOrganization?.organization_id,
                p_email: inviteEmail.trim(),
                p_role: inviteRole
            })

            if (error) {
                throw error
            }

            const result = data as { success: boolean; error?: string; token?: string; invitation_id?: string }

            if (result.success) {
                // Send invitation email
                try {
                    await fetch('/api/email/invite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            invitationId: result.invitation_id,
                            userId: user?.id,
                        }),
                    })
                } catch (emailErr) {
                    console.error('Failed to send invitation email:', emailErr)
                }

                setInviteSuccess(`Invitation sent to ${inviteEmail}`)
                setInviteEmail('')
                setInviteRole('member')
                fetchMembers()
            } else {
                if (result.error === 'already_member') {
                    setInviteError('This user is already a member')
                } else if (result.error === 'invitation_pending') {
                    setInviteError('An invitation is already pending for this email')
                } else if (result.error === 'user_quota_exceeded') {
                    setInviteError('User quota exceeded. Upgrade your plan to add more members.')
                } else {
                    setInviteError(result.error || 'Failed to send invitation')
                }
            }
        } catch (err) {
            console.error('Error inviting user:', err)
            setInviteError('Failed to send invitation')
        } finally {
            setIsInviting(false)
        }
    }

    const handleCancelInvitation = async (invitationId: string) => {
        try {
            const { error } = await supabase
                .from('organization_invitations')
                .update({ status: 'cancelled' })
                .eq('invitation_id', invitationId)

            if (error) throw error
            fetchMembers()
        } catch (err) {
            console.error('Error cancelling invitation:', err)
        }
    }

    const handleUpdateRole = async (membershipId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('organization_members')
                .update({ role: newRole })
                .eq('membership_id', membershipId)

            if (error) throw error
            fetchMembers()
        } catch (err) {
            console.error('Error updating role:', err)
        }
    }

    const handleRemoveMember = async (membershipId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return

        try {
            const { error } = await supabase
                .from('organization_members')
                .delete()
                .eq('membership_id', membershipId)

            if (error) throw error
            fetchMembers()
        } catch (err) {
            console.error('Error removing member:', err)
        }
    }

    if (authLoading || isLoadingOrgs || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    if (!user || !currentOrganization || !isAdmin) {
        return null
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'owner':
                return 'default'
            case 'admin':
                return 'secondary'
            case 'librarian':
                return 'outline'
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

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Team Members</h1>
                    <p className="text-muted-foreground">
                        Manage who has access to {currentOrganization.name}
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Invite Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Invite Member
                        </CardTitle>
                        <CardDescription>
                            Send an invitation to add someone to your organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleInvite} className="space-y-4">
                            {inviteError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{inviteError}</AlertDescription>
                                </Alert>
                            )}
                            {inviteSuccess && (
                                <Alert>
                                    <AlertDescription>{inviteSuccess}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="email" className="sr-only">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="colleague@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        disabled={isInviting}
                                    />
                                </div>
                                <div className="w-40">
                                    <Label htmlFor="role" className="sr-only">Role</Label>
                                    <Select
                                        value={inviteRole}
                                        onValueChange={setInviteRole}
                                        disabled={isInviting}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="member">Member</SelectItem>
                                            <SelectItem value="librarian">Librarian</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={isInviting}>
                                    {isInviting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Invite
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Pending Invitations ({invitations.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead className="w-[70px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations.map((invitation) => (
                                        <TableRow key={invitation.invitation_id}>
                                            <TableCell>{invitation.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{invitation.role}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(invitation.expires_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCancelInvitation(invitation.invitation_id)}
                                                >
                                                    Cancel
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Members List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Members ({members.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.membership_id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {member.user?.full_name || 'Unknown'}
                                                    {member.user_id === user?.id && (
                                                        <span className="text-muted-foreground ml-2">(you)</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {member.user?.email || member.user_id}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getRoleBadgeVariant(member.role)}>
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {member.joined_at
                                                ? new Date(member.joined_at).toLocaleDateString()
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {member.role !== 'owner' && member.user_id !== user?.id && isOwner && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpdateRole(member.membership_id, 'admin')}
                                                            disabled={member.role === 'admin'}
                                                        >
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            Make Admin
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpdateRole(member.membership_id, 'librarian')}
                                                            disabled={member.role === 'librarian'}
                                                        >
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            Make Librarian
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpdateRole(member.membership_id, 'member')}
                                                            disabled={member.role === 'member'}
                                                        >
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            Make Member
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleRemoveMember(member.membership_id)}
                                                            className="text-destructive"
                                                        >
                                                            <UserX className="mr-2 h-4 w-4" />
                                                            Remove
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Role Descriptions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Role Permissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-3 border rounded-lg">
                                <Badge className="mb-2">Owner</Badge>
                                <p className="text-sm text-muted-foreground">
                                    Full control including billing, deletion, and ownership transfer
                                </p>
                            </div>
                            <div className="p-3 border rounded-lg">
                                <Badge variant="secondary" className="mb-2">Admin</Badge>
                                <p className="text-sm text-muted-foreground">
                                    Manage members, settings, books, and all library operations
                                </p>
                            </div>
                            <div className="p-3 border rounded-lg">
                                <Badge variant="outline" className="mb-2">Librarian</Badge>
                                <p className="text-sm text-muted-foreground">
                                    Manage books, process loans and returns, handle reservations
                                </p>
                            </div>
                            <div className="p-3 border rounded-lg">
                                <Badge variant="outline" className="mb-2">Member</Badge>
                                <p className="text-sm text-muted-foreground">
                                    Browse catalog, borrow books, make reservations, write reviews
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
