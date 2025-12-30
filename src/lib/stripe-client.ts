import { loadStripe, Stripe } from '@stripe/stripe-js'

// Client-side Stripe loader
// Uses NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for client operations

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
    if (!stripePromise) {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (!key) {
            console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
            return Promise.resolve(null)
        }
        stripePromise = loadStripe(key)
    }
    return stripePromise
}

// Redirect to Stripe Checkout
export async function redirectToCheckout(sessionId: string): Promise<void> {
    const stripe = await getStripe()
    if (!stripe) {
        throw new Error('Stripe is not configured')
    }

    const { error } = await stripe.redirectToCheckout({ sessionId })
    if (error) {
        throw error
    }
}

// Plan display information
export const SUBSCRIPTION_PLANS = [
    {
        id: 'free',
        name: 'Free',
        description: 'Perfect for trying out the system',
        price: { monthly: 0, yearly: 0 },
        features: [
            'Up to 100 books',
            'Up to 5 members',
            'Basic reporting',
            'Email support',
        ],
        highlighted: false,
    },
    {
        id: 'basic',
        name: 'Basic',
        description: 'Great for small libraries',
        price: { monthly: 0.99, yearly: 9.99 },
        features: [
            'Up to 1,000 books',
            'Up to 25 members',
            'Advanced reporting',
            'Priority email support',
            'Custom branding',
        ],
        highlighted: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'For growing organizations',
        price: { monthly: 2.99, yearly: 29.99 },
        features: [
            'Up to 10,000 books',
            'Up to 100 members',
            'Full analytics dashboard',
            'API access',
            'Phone support',
            'Multiple admins',
        ],
        highlighted: true,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large institutions',
        price: { monthly: 8.99, yearly: 89.99 },
        features: [
            'Unlimited books',
            'Unlimited members',
            'Custom integrations',
            'Dedicated account manager',
            '24/7 support',
            'SLA guarantee',
            'On-premise option',
        ],
        highlighted: false,
    },
]

export function getPlanById(planId: string) {
    return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId)
}

export function formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(price)
}
