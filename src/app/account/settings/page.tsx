'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    AlertCircle,
    Loader2,
    User,
    Mail,
    Lock,
    CheckCircle2,
    Phone,
    MapPin,
    Save
} from 'lucide-react'

type UserProfile = {
    user_id: string
    username: string
    email: string
    full_name: string
    phone: string | null
    address: string | null
}

export default function AccountSettings() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    // Profile state
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [profileLoading, setProfileLoading] = useState(true)
    const [profileSaving, setProfileSaving] = useState(false)
    const [profileError, setProfileError] = useState<string | null>(null)
    const [profileSuccess, setProfileSuccess] = useState(false)

    // Email change state
    const [newEmail, setNewEmail] = useState('')
    const [emailLoading, setEmailLoading] = useState(false)
    const [emailError, setEmailError] = useState<string | null>(null)
    const [emailSuccess, setEmailSuccess] = useState(false)

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [passwordSuccess, setPasswordSuccess] = useState(false)

    // Fetch user profile
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('user_id, username, email, full_name, phone, address')
                    .eq('user_id', user.id)
                    .single()

                if (error) throw error
                setProfile(data)
            } catch (error) {
                console.error('Error fetching profile:', error)
                setProfileError('Failed to load profile')
            } finally {
                setProfileLoading(false)
            }
        }

        if (user) {
            fetchProfile()
        }
    }, [user])

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    // Handle profile update
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile || !user) return

        setProfileSaving(true)
        setProfileError(null)
        setProfileSuccess(false)

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    username: profile.username,
                    full_name: profile.full_name,
                    phone: profile.phone,
                    address: profile.address
                })
                .eq('user_id', user.id)

            if (error) throw error

            // Also update Supabase Auth user metadata
            await supabase.auth.updateUser({
                data: {
                    username: profile.username,
                    full_name: profile.full_name
                }
            })

            setProfileSuccess(true)
            setTimeout(() => setProfileSuccess(false), 3000)
        } catch (error) {
            console.error('Error updating profile:', error)
            if (error instanceof Error) {
                setProfileError(error.message)
            } else {
                setProfileError('Failed to update profile')
            }
        } finally {
            setProfileSaving(false)
        }
    }

    // Handle email change
    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setEmailLoading(true)
        setEmailError(null)
        setEmailSuccess(false)

        try {
            const { error } = await supabase.auth.updateUser({
                email: newEmail
            })

            if (error) throw error

            setEmailSuccess(true)
            setNewEmail('')
        } catch (error) {
            console.error('Error updating email:', error)
            if (error instanceof Error) {
                setEmailError(error.message)
            } else {
                setEmailError('Failed to update email')
            }
        } finally {
            setEmailLoading(false)
        }
    }

    // Handle password change
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setPasswordError(null)
        setPasswordSuccess(false)

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match')
            return
        }

        setPasswordLoading(true)

        try {
            // First verify current password by re-authenticating
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email!,
                password: currentPassword
            })

            if (signInError) {
                throw new Error('Current password is incorrect')
            }

            // Update password
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            setPasswordSuccess(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setPasswordSuccess(false), 3000)
        } catch (error) {
            console.error('Error updating password:', error)
            if (error instanceof Error) {
                setPasswordError(error.message)
            } else {
                setPasswordError('Failed to update password')
            }
        } finally {
            setPasswordLoading(false)
        }
    }

    if (authLoading || profileLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#02FF73]" />
            </div>
        )
    }

    if (!user || !profile) {
        return null
    }

    return (
        <div className="container max-w-4xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold">Account Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">Email</span>
                    </TabsTrigger>
                    <TabsTrigger value="password" className="gap-2">
                        <Lock className="h-4 w-4" />
                        <span className="hidden sm:inline">Password</span>
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your personal information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                {profileError && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{profileError}</AlertDescription>
                                    </Alert>
                                )}
                                {profileSuccess && (
                                    <Alert className="border-[#02FF73]/50 bg-[#02FF73]/10">
                                        <CheckCircle2 className="h-4 w-4 text-[#02FF73]" />
                                        <AlertDescription className="text-[#02FF73]">
                                            Profile updated successfully
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="username"
                                                value={profile.username}
                                                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="fullName"
                                                value={profile.full_name}
                                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={profile.phone || ''}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                className="pl-10"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email-display">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email-display"
                                                value={profile.email}
                                                disabled
                                                className="pl-10 bg-muted"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            To change your email, use the Email tab
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Textarea
                                            id="address"
                                            value={profile.address || ''}
                                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                            className="pl-10 min-h-[100px]"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="gradient"
                                    disabled={profileSaving}
                                >
                                    {profileSaving ? (
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
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Email Tab */}
                <TabsContent value="email">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Email Address</CardTitle>
                            <CardDescription>
                                Update your email address. A confirmation link will be sent to the new email.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleEmailChange} className="space-y-6">
                                {emailError && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{emailError}</AlertDescription>
                                    </Alert>
                                )}
                                {emailSuccess && (
                                    <Alert className="border-[#02FF73]/50 bg-[#02FF73]/10">
                                        <CheckCircle2 className="h-4 w-4 text-[#02FF73]" />
                                        <AlertDescription className="text-[#02FF73]">
                                            Confirmation email sent! Check your inbox to verify the new email address.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="currentEmail">Current Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="currentEmail"
                                            value={user.email || ''}
                                            disabled
                                            className="pl-10 bg-muted"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newEmail">New Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="newEmail"
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => {
                                                setNewEmail(e.target.value)
                                                setEmailError(null)
                                            }}
                                            placeholder="newemail@example.com"
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="gradient"
                                    disabled={emailLoading || !newEmail}
                                >
                                    {emailLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Confirmation'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Password Tab */}
                <TabsContent value="password">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>
                                Update your password to keep your account secure
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                {passwordError && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{passwordError}</AlertDescription>
                                    </Alert>
                                )}
                                {passwordSuccess && (
                                    <Alert className="border-[#02FF73]/50 bg-[#02FF73]/10">
                                        <CheckCircle2 className="h-4 w-4 text-[#02FF73]" />
                                        <AlertDescription className="text-[#02FF73]">
                                            Password updated successfully
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="currentPassword"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => {
                                                setCurrentPassword(e.target.value)
                                                setPasswordError(null)
                                            }}
                                            placeholder="Enter current password"
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value)
                                                setPasswordError(null)
                                            }}
                                            placeholder="Enter new password"
                                            className="pl-10"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Must be at least 6 characters
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value)
                                                setPasswordError(null)
                                            }}
                                            placeholder="Confirm new password"
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="gradient"
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
