-- =====================================================
-- Multi-Tenant Library Management System
-- Migration 1: Create Core Multi-Tenant Tables
-- =====================================================

-- =====================================================
-- 1. Subscription Plans Table (Configuration)
-- =====================================================
CREATE TABLE subscription_plans (
    plan_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,

    -- Quotas
    max_books INTEGER,
    max_users INTEGER,
    max_loans_per_user INTEGER DEFAULT 5,

    -- Features (JSONB for flexibility)
    features JSONB DEFAULT '{}',

    -- Pricing (in cents)
    price_monthly INTEGER DEFAULT 0,
    price_yearly INTEGER DEFAULT 0,
    stripe_price_id_monthly VARCHAR(100),
    stripe_price_id_yearly VARCHAR(100),

    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_id, name, description, max_books, max_users, max_loans_per_user, features, price_monthly, price_yearly, sort_order) VALUES
('free', 'Free', 'Perfect for personal use or small organizations', 100, 5, 3,
 '{"reservations": true, "reviews": true, "reports": false, "customBranding": false, "apiAccess": false}',
 0, 0, 0),
('basic', 'Basic', 'Great for small libraries and book clubs', 1000, 20, 5,
 '{"reservations": true, "reviews": true, "reports": true, "customBranding": false, "apiAccess": false}',
 2900, 29000, 1),
('pro', 'Professional', 'Ideal for medium-sized libraries', 10000, 100, 10,
 '{"reservations": true, "reviews": true, "reports": true, "customBranding": true, "apiAccess": false}',
 9900, 99000, 2),
('enterprise', 'Enterprise', 'For large institutions with advanced needs', NULL, NULL, NULL,
 '{"reservations": true, "reviews": true, "reports": true, "customBranding": true, "apiAccess": true, "prioritySupport": true, "sso": true}',
 NULL, NULL, 3);

-- =====================================================
-- 2. Organizations Table (Tenants)
-- =====================================================
CREATE TABLE organizations (
    organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Information
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,

    -- Contact Information
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    address TEXT,
    website VARCHAR(255),

    -- Subscription & Billing
    subscription_plan VARCHAR(20) DEFAULT 'free' REFERENCES subscription_plans(plan_id),
    subscription_status VARCHAR(20) DEFAULT 'trial'
        CHECK (subscription_status IN ('trial', 'active', 'past_due', 'suspended', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days'),
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),

    -- Quotas (override plan defaults if needed)
    max_books INTEGER,
    max_users INTEGER,
    max_loans_per_user INTEGER DEFAULT 5,
    loan_duration_days INTEGER DEFAULT 14,

    -- Custom Settings
    settings JSONB DEFAULT '{
        "allowSelfRegistration": false,
        "requireApproval": true,
        "overdueFinePer Day": 0.5,
        "theme": {"primaryColor": "#3b82f6"},
        "features": {}
    }',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX idx_organizations_subscription_plan ON organizations(subscription_plan);

-- =====================================================
-- 3. Organization Members Table
-- =====================================================
CREATE TABLE organization_members (
    membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Role & Permissions
    role VARCHAR(20) NOT NULL DEFAULT 'member'
        CHECK (role IN ('owner', 'admin', 'librarian', 'member')),

    -- Status
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('pending', 'active', 'suspended')),

    -- Audit Information
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspended_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- One membership per user per organization
    UNIQUE(organization_id, user_id)
);

-- Indexes for organization_members
CREATE INDEX idx_org_members_organization ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(organization_id, role);
CREATE INDEX idx_org_members_status ON organization_members(status);

-- =====================================================
-- 4. Organization Invitations Table
-- =====================================================
CREATE TABLE organization_invitations (
    invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Invitation Details
    email VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member'
        CHECK (role IN ('admin', 'librarian', 'member')),
    token VARCHAR(100) NOT NULL UNIQUE,
    message TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),

    -- Timestamps
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for invitations
CREATE INDEX idx_invitations_token ON organization_invitations(token);
CREATE INDEX idx_invitations_email ON organization_invitations(email);
CREATE INDEX idx_invitations_organization ON organization_invitations(organization_id);
CREATE INDEX idx_invitations_status ON organization_invitations(status);

-- =====================================================
-- 5. Subscription History Table (Audit Trail)
-- =====================================================
CREATE TABLE subscription_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Change Details
    previous_plan VARCHAR(20),
    new_plan VARCHAR(20),
    previous_status VARCHAR(20),
    new_status VARCHAR(20),

    -- Stripe Information
    stripe_event_id VARCHAR(100),
    stripe_invoice_id VARCHAR(100),

    -- Amount (in cents)
    amount INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Metadata
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_history_org ON subscription_history(organization_id);

-- =====================================================
-- 6. Triggers for updated_at
-- =====================================================
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
