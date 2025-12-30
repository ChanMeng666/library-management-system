import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createBillingPortalSession } from '@/lib/stripe-server'

// Create Supabase client with service role for server operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { organizationId, userId } = body

        if (!organizationId || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get organization details
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('organization_id, stripe_customer_id')
            .eq('organization_id', organizationId)
            .single()

        if (orgError || !orgData) {
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
            )
        }

        if (!orgData.stripe_customer_id) {
            return NextResponse.json(
                { error: 'No billing information found. Please subscribe to a plan first.' },
                { status: 400 }
            )
        }

        // Verify user is admin of the organization
        const { data: memberData, error: memberError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', userId)
            .single()

        if (memberError || !memberData || !['owner', 'admin'].includes(memberData.role)) {
            return NextResponse.json(
                { error: 'Unauthorized: Only admins can manage billing' },
                { status: 403 }
            )
        }

        // Create billing portal session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || ''

        try {
            const session = await createBillingPortalSession(
                orgData.stripe_customer_id,
                `${baseUrl}/org/billing`
            )
            return NextResponse.json({ url: session.url })
        } catch (stripeError: unknown) {
            console.error('Stripe portal error:', stripeError)

            // Check for common Stripe errors
            if (stripeError instanceof Error) {
                if (stripeError.message.includes('portal')) {
                    return NextResponse.json(
                        { error: 'Billing portal is not configured. Please configure it in Stripe Dashboard > Settings > Billing > Customer portal.' },
                        { status: 400 }
                    )
                }
                if (stripeError.message.includes('customer')) {
                    return NextResponse.json(
                        { error: 'Invalid customer. The customer may have been created in a different Stripe mode (test/live).' },
                        { status: 400 }
                    )
                }
                return NextResponse.json(
                    { error: `Stripe error: ${stripeError.message}` },
                    { status: 500 }
                )
            }
            throw stripeError
        }
    } catch (error) {
        console.error('Billing portal error:', error)
        return NextResponse.json(
            { error: 'Failed to create billing portal session' },
            { status: 500 }
        )
    }
}
