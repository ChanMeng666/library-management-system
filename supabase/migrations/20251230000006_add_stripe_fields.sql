-- Add Stripe fields to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Add Stripe price_id to subscription_plans for mapping
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS stripe_price_id_monthly TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id_yearly TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription_id ON organizations(stripe_subscription_id);

-- Add billing history table
CREATE TABLE IF NOT EXISTS billing_history (
    billing_id SERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,
    amount_paid INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('paid', 'failed', 'pending', 'refunded')),
    description TEXT,
    invoice_url TEXT,
    invoice_pdf TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for billing history
CREATE INDEX IF NOT EXISTS idx_billing_history_organization_id ON billing_history(organization_id);

-- RLS for billing_history
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organization admins can view billing history" ON billing_history;
CREATE POLICY "Organization admins can view billing history"
    ON billing_history FOR SELECT
    USING (is_org_admin(organization_id));

-- Function to handle subscription status changes
CREATE OR REPLACE FUNCTION handle_subscription_change(
    p_organization_id UUID,
    p_subscription_id TEXT,
    p_price_id TEXT,
    p_status TEXT,
    p_current_period_end TIMESTAMPTZ,
    p_cancel_at_period_end BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
    v_plan_id VARCHAR(20);
    v_previous_plan VARCHAR(20);
    v_previous_status VARCHAR(20);
BEGIN
    -- Get current plan and status
    SELECT subscription_plan, subscription_status INTO v_previous_plan, v_previous_status
    FROM organizations
    WHERE organization_id = p_organization_id;

    -- Find the plan based on stripe price id
    SELECT plan_id INTO v_plan_id
    FROM subscription_plans
    WHERE stripe_price_id_monthly = p_price_id OR stripe_price_id_yearly = p_price_id;

    -- Update organization subscription
    UPDATE organizations
    SET
        stripe_subscription_id = p_subscription_id,
        stripe_price_id = p_price_id,
        subscription_status = p_status,
        current_period_end = p_current_period_end,
        cancel_at_period_end = p_cancel_at_period_end,
        subscription_plan = COALESCE(v_plan_id, subscription_plan)
    WHERE organization_id = p_organization_id;

    -- Record in subscription history
    INSERT INTO subscription_history (
        organization_id,
        previous_plan,
        new_plan,
        previous_status,
        new_status,
        change_reason
    )
    VALUES (
        p_organization_id,
        v_previous_plan,
        COALESCE(v_plan_id, v_previous_plan),
        v_previous_status,
        p_status,
        CASE
            WHEN p_status = 'canceled' THEN 'Subscription canceled'
            WHEN p_cancel_at_period_end THEN 'Subscription scheduled for cancellation'
            ELSE 'Subscription updated via Stripe'
        END
    );

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
