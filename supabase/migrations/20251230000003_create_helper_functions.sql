-- =====================================================
-- Multi-Tenant Library Management System
-- Migration 3: Create Helper Functions for RLS
-- =====================================================

-- =====================================================
-- 1. Check if user is an active member of organization
-- =====================================================
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND status = 'active'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- 2. Get user's role in an organization
-- =====================================================
CREATE OR REPLACE FUNCTION get_org_role(org_id UUID)
RETURNS TEXT AS $$
    SELECT role FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- 3. Check if user has admin privileges (owner/admin)
-- =====================================================
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- 4. Check if user has librarian privileges
-- =====================================================
CREATE OR REPLACE FUNCTION is_org_librarian(org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'librarian')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- 5. Get all organization IDs for current user
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID AS $$
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- 6. Check if organization is within quota limits
-- =====================================================
CREATE OR REPLACE FUNCTION check_org_book_quota(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_max_books INTEGER;
    v_current_books INTEGER;
    v_plan_max_books INTEGER;
BEGIN
    -- Get org-specific max or fall back to plan default
    SELECT
        COALESCE(o.max_books, sp.max_books),
        (SELECT COUNT(*) FROM books WHERE organization_id = org_id)
    INTO v_max_books, v_current_books
    FROM organizations o
    JOIN subscription_plans sp ON o.subscription_plan = sp.plan_id
    WHERE o.organization_id = org_id;

    -- NULL means unlimited
    IF v_max_books IS NULL THEN
        RETURN true;
    END IF;

    RETURN v_current_books < v_max_books;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 7. Check if organization is within user quota
-- =====================================================
CREATE OR REPLACE FUNCTION check_org_user_quota(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_max_users INTEGER;
    v_current_users INTEGER;
BEGIN
    -- Get org-specific max or fall back to plan default
    SELECT
        COALESCE(o.max_users, sp.max_users),
        (SELECT COUNT(*) FROM organization_members WHERE organization_id = org_id AND status = 'active')
    INTO v_max_users, v_current_users
    FROM organizations o
    JOIN subscription_plans sp ON o.subscription_plan = sp.plan_id
    WHERE o.organization_id = org_id;

    -- NULL means unlimited
    IF v_max_users IS NULL THEN
        RETURN true;
    END IF;

    RETURN v_current_users < v_max_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 8. Get organization's effective loan duration
-- =====================================================
CREATE OR REPLACE FUNCTION get_org_loan_duration(org_id UUID)
RETURNS INTEGER AS $$
    SELECT COALESCE(loan_duration_days, 14)
    FROM organizations
    WHERE organization_id = org_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- 9. Get organization's max loans per user
-- =====================================================
CREATE OR REPLACE FUNCTION get_org_max_loans_per_user(org_id UUID)
RETURNS INTEGER AS $$
    SELECT COALESCE(o.max_loans_per_user, sp.max_loans_per_user, 5)
    FROM organizations o
    JOIN subscription_plans sp ON o.subscription_plan = sp.plan_id
    WHERE o.organization_id = org_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- 10. Check if organization subscription is active
-- =====================================================
CREATE OR REPLACE FUNCTION is_org_subscription_active(org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM organizations
        WHERE organization_id = org_id
        AND (
            subscription_status = 'active'
            OR (subscription_status = 'trial' AND trial_ends_at > CURRENT_TIMESTAMP)
        )
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- 11. Generate unique invitation token
-- =====================================================
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
    SELECT encode(gen_random_bytes(32), 'hex');
$$ LANGUAGE sql;

-- =====================================================
-- 12. Get user's current active loans count in org
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_active_loans_count(org_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM loans
    WHERE organization_id = org_id
    AND user_id = p_user_id
    AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE;
