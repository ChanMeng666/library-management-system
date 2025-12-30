import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
    stripe,
    getOrCreateStripeCustomer,
    createNewStripeCustomer,
    createCheckoutSession,
    getStripePrices,
} from '@/lib/stripe-server'

// Create Supabase client with service role for server operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { organizationId, planId, billingPeriod, userId } = body

        if (!organizationId || !planId || !billingPeriod || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get user details
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('user_id', userId)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Get organization details
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('organization_id, name, stripe_customer_id, stripe_subscription_id, subscription_status')
            .eq('organization_id', organizationId)
            .single()

        if (orgError || !orgData) {
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
            )
        }

        // Check if organization already has an active subscription
        if (orgData.stripe_subscription_id &&
            orgData.subscription_status &&
            ['active', 'trialing', 'trial'].includes(orgData.subscription_status)) {
            return NextResponse.json(
                {
                    error: 'You already have an active subscription. Please use "Manage Billing" to change your plan.',
                    hasActiveSubscription: true
                },
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

        // Get or create Stripe customer
        let customerId = orgData.stripe_customer_id

        if (!customerId) {
            customerId = await getOrCreateStripeCustomer(
                userData.email,
                orgData.name,
                {
                    organization_id: organizationId.toString(),
                    user_id: userId,
                }
            )

            // Save customer ID to organization
            await supabase
                .from('organizations')
                .update({ stripe_customer_id: customerId })
                .eq('organization_id', organizationId)
        }

        // Get the appropriate price ID
        const prices = getStripePrices()
        const priceKey = `${planId}_${billingPeriod}` as keyof typeof prices
        const priceId = prices[priceKey]

        if (!priceId) {
            return NextResponse.json(
                { error: `Invalid plan or billing period: ${planId} ${billingPeriod}` },
                { status: 400 }
            )
        }

        // Create checkout session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || ''

        try {
            const session = await createCheckoutSession({
                customerId,
                priceId,
                organizationId,
                successUrl: `${baseUrl}/org/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${baseUrl}/org/billing?canceled=true`,
                trialDays: planId !== 'enterprise' ? 14 : undefined, // 14-day trial for non-enterprise
            })

            return NextResponse.json({ sessionId: session.id, url: session.url })
        } catch (stripeError: unknown) {
            // Handle currency mismatch by creating a new customer
            if (stripeError instanceof Error && stripeError.message.includes('cannot combine currencies')) {
                console.log('Currency mismatch detected, creating new customer...')

                // Create a new customer with the correct currency
                const newCustomerId = await createNewStripeCustomer(
                    userData.email,
                    orgData.name,
                    {
                        organization_id: organizationId,
                        user_id: userId,
                    }
                )

                // Update organization with new customer ID
                await supabase
                    .from('organizations')
                    .update({ stripe_customer_id: newCustomerId })
                    .eq('organization_id', organizationId)

                // Retry checkout with new customer
                const session = await createCheckoutSession({
                    customerId: newCustomerId,
                    priceId,
                    organizationId,
                    successUrl: `${baseUrl}/org/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${baseUrl}/org/billing?canceled=true`,
                    trialDays: planId !== 'enterprise' ? 14 : undefined,
                })

                return NextResponse.json({ sessionId: session.id, url: session.url })
            }
            throw stripeError
        }
    } catch (error) {
        console.error('Checkout session error:', error)
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
