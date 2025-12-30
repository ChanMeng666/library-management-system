import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendInvitationEmail } from '@/lib/resend'

// Create Supabase client with service role for server operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { invitationId, userId } = body

        if (!invitationId || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get invitation details
        const { data: inviteData, error: inviteError } = await supabase
            .from('organization_invitations')
            .select(`
                email,
                role,
                token,
                organizations (
                    name
                )
            `)
            .eq('invitation_id', invitationId)
            .single()

        if (inviteError || !inviteData) {
            return NextResponse.json(
                { error: 'Invitation not found' },
                { status: 404 }
            )
        }

        // Get inviter details
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('user_id', userId)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || ''
        const inviteUrl = `${baseUrl}/invite/${inviteData.token}`

        // Send invitation email
        const result = await sendInvitationEmail(inviteData.email, {
            inviterName: userData.full_name || userData.email,
            organizationName: (inviteData.organizations as { name: string }).name,
            inviteUrl,
            role: inviteData.role,
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to send email' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Email send error:', error)
        return NextResponse.json(
            { error: 'Failed to send invitation email' },
            { status: 500 }
        )
    }
}
