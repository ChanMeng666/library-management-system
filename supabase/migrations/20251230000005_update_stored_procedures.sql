-- =====================================================
-- Multi-Tenant Library Management System
-- Migration 5: Update Stored Procedures for Multi-Tenancy
-- =====================================================

-- =====================================================
-- 1. Create Organization (with owner)
-- =====================================================
CREATE OR REPLACE FUNCTION create_organization(
    p_name VARCHAR(100),
    p_slug VARCHAR(50),
    p_description TEXT DEFAULT NULL,
    p_contact_email VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;

    -- Check if slug is already taken
    IF EXISTS (SELECT 1 FROM organizations WHERE slug = p_slug) THEN
        RETURN jsonb_build_object('success', false, 'error', 'slug_taken');
    END IF;

    -- Create organization
    INSERT INTO organizations (name, slug, description, contact_email)
    VALUES (p_name, p_slug, p_description, p_contact_email)
    RETURNING organization_id INTO v_org_id;

    -- Add creator as owner
    INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
    VALUES (v_org_id, v_user_id, 'owner', 'active', CURRENT_TIMESTAMP);

    -- Update user's current organization
    UPDATE users
    SET current_organization_id = v_org_id
    WHERE user_id::text = v_user_id::text;

    RETURN jsonb_build_object(
        'success', true,
        'organization_id', v_org_id,
        'slug', p_slug
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. Invite User to Organization
-- =====================================================
CREATE OR REPLACE FUNCTION invite_to_organization(
    p_organization_id UUID,
    p_email VARCHAR(100),
    p_role VARCHAR(20) DEFAULT 'member',
    p_message TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_token TEXT;
    v_invitation_id UUID;
    v_inviter_id UUID;
BEGIN
    v_inviter_id := auth.uid();

    -- Check if user has permission to invite
    IF NOT is_org_admin(p_organization_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
    END IF;

    -- Check if already a member
    IF EXISTS (
        SELECT 1 FROM organization_members om
        JOIN auth.users au ON om.user_id = au.id
        WHERE om.organization_id = p_organization_id
        AND au.email = p_email
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'already_member');
    END IF;

    -- Check if invitation already pending
    IF EXISTS (
        SELECT 1 FROM organization_invitations
        WHERE organization_id = p_organization_id
        AND email = p_email
        AND status = 'pending'
        AND expires_at > CURRENT_TIMESTAMP
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'invitation_pending');
    END IF;

    -- Check user quota
    IF NOT check_org_user_quota(p_organization_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'user_quota_exceeded');
    END IF;

    -- Generate token
    v_token := generate_invitation_token();

    -- Create invitation
    INSERT INTO organization_invitations (
        organization_id, email, role, token, message, invited_by
    )
    VALUES (
        p_organization_id, p_email, p_role, v_token, p_message, v_inviter_id
    )
    RETURNING invitation_id INTO v_invitation_id;

    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', v_invitation_id,
        'token', v_token
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. Accept Organization Invitation
-- =====================================================
CREATE OR REPLACE FUNCTION accept_invitation(p_token VARCHAR(100))
RETURNS JSONB AS $$
DECLARE
    v_invitation RECORD;
    v_user_id UUID;
    v_membership_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;

    -- Get invitation
    SELECT * INTO v_invitation
    FROM organization_invitations
    WHERE token = p_token
    AND status = 'pending'
    AND expires_at > CURRENT_TIMESTAMP;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_or_expired_invitation');
    END IF;

    -- Check if user email matches invitation
    IF NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = v_user_id AND email = v_invitation.email
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'email_mismatch');
    END IF;

    -- Check if already a member
    IF EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = v_invitation.organization_id
        AND user_id = v_user_id
    ) THEN
        -- Update invitation status
        UPDATE organization_invitations
        SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
        WHERE invitation_id = v_invitation.invitation_id;

        RETURN jsonb_build_object('success', false, 'error', 'already_member');
    END IF;

    -- Add as member
    INSERT INTO organization_members (
        organization_id, user_id, role, status, invited_by, joined_at
    )
    VALUES (
        v_invitation.organization_id, v_user_id, v_invitation.role,
        'active', v_invitation.invited_by, CURRENT_TIMESTAMP
    )
    RETURNING membership_id INTO v_membership_id;

    -- Update invitation status
    UPDATE organization_invitations
    SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE invitation_id = v_invitation.invitation_id;

    -- Update user's current organization if not set
    UPDATE users
    SET current_organization_id = v_invitation.organization_id
    WHERE user_id::text = v_user_id::text
    AND current_organization_id IS NULL;

    RETURN jsonb_build_object(
        'success', true,
        'organization_id', v_invitation.organization_id,
        'membership_id', v_membership_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. Updated Borrow Book (Multi-Tenant)
-- =====================================================
DROP FUNCTION IF EXISTS borrow_book(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS borrow_book(INTEGER, TEXT);

CREATE OR REPLACE FUNCTION borrow_book(
    p_organization_id UUID,
    p_book_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_due_date DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_available_copies INTEGER;
    v_loan_id UUID;
    v_max_loans INTEGER;
    v_current_loans INTEGER;
    v_loan_duration INTEGER;
    v_borrower_id UUID;
BEGIN
    -- Determine who is borrowing
    v_borrower_id := COALESCE(p_user_id, auth.uid());

    -- Check if borrower is a member of the organization
    IF NOT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = p_organization_id
        AND user_id = v_borrower_id
        AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_member');
    END IF;

    -- Check organization subscription is active
    IF NOT is_org_subscription_active(p_organization_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'subscription_inactive');
    END IF;

    -- Get organization settings
    v_max_loans := get_org_max_loans_per_user(p_organization_id);
    v_loan_duration := get_org_loan_duration(p_organization_id);

    -- Check user's current loans count
    v_current_loans := get_user_active_loans_count(p_organization_id, v_borrower_id);

    IF v_current_loans >= v_max_loans THEN
        RETURN jsonb_build_object('success', false, 'error', 'max_loans_reached', 'max', v_max_loans);
    END IF;

    -- Check book belongs to organization and has available copies
    SELECT available_copies INTO v_available_copies
    FROM books
    WHERE book_id = p_book_id AND organization_id = p_organization_id;

    IF v_available_copies IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'book_not_found');
    END IF;

    IF v_available_copies <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'no_copies_available');
    END IF;

    -- Set due date
    IF p_due_date IS NULL THEN
        p_due_date := CURRENT_DATE + v_loan_duration;
    END IF;

    -- Create loan
    INSERT INTO loans (organization_id, user_id, book_id, due_date, status)
    VALUES (p_organization_id, v_borrower_id, p_book_id, p_due_date, 'active')
    RETURNING loan_id INTO v_loan_id;

    -- Decrease available copies
    UPDATE books
    SET available_copies = available_copies - 1
    WHERE book_id = p_book_id;

    -- Check if there are pending reservations to notify
    -- (Could trigger a notification here)

    RETURN jsonb_build_object(
        'success', true,
        'loan_id', v_loan_id,
        'due_date', p_due_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. Updated Return Book (Multi-Tenant)
-- =====================================================
DROP FUNCTION IF EXISTS return_book(UUID);
DROP FUNCTION IF EXISTS return_book(INTEGER, TEXT);

CREATE OR REPLACE FUNCTION return_book(
    p_loan_id UUID,
    p_organization_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_loan RECORD;
    v_fine DECIMAL(10, 2) := 0;
    v_days_overdue INTEGER;
    v_fine_per_day DECIMAL(10, 2);
BEGIN
    -- Get loan info
    SELECT * INTO v_loan
    FROM loans
    WHERE loan_id = p_loan_id
    AND status = 'active';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'loan_not_found');
    END IF;

    -- Verify organization if provided
    IF p_organization_id IS NOT NULL AND v_loan.organization_id != p_organization_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'wrong_organization');
    END IF;

    -- Check permission (owner or librarian)
    IF v_loan.user_id != auth.uid() AND NOT is_org_librarian(v_loan.organization_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
    END IF;

    -- Calculate fine if overdue
    IF v_loan.due_date < CURRENT_DATE THEN
        v_days_overdue := CURRENT_DATE - v_loan.due_date;

        -- Get fine per day from organization settings
        SELECT COALESCE((settings->>'overdueFinePer Day')::DECIMAL, 0.5)
        INTO v_fine_per_day
        FROM organizations
        WHERE organization_id = v_loan.organization_id;

        v_fine := v_days_overdue * v_fine_per_day;
    END IF;

    -- Update loan
    UPDATE loans
    SET status = 'returned',
        return_date = CURRENT_TIMESTAMP,
        fine_amount = v_fine
    WHERE loan_id = p_loan_id;

    -- Increase available copies
    UPDATE books
    SET available_copies = available_copies + 1
    WHERE book_id = v_loan.book_id;

    RETURN jsonb_build_object(
        'success', true,
        'days_overdue', GREATEST(0, v_days_overdue),
        'fine_amount', v_fine
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Updated Reserve Book (Multi-Tenant)
-- =====================================================
DROP FUNCTION IF EXISTS reserve_book(INTEGER, TEXT);

CREATE OR REPLACE FUNCTION reserve_book(
    p_organization_id UUID,
    p_book_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_reservation_id UUID;
    v_available INTEGER;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());

    -- Check if user is member
    IF NOT is_org_member(p_organization_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_member');
    END IF;

    -- Check subscription
    IF NOT is_org_subscription_active(p_organization_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'subscription_inactive');
    END IF;

    -- Check if book exists and belongs to org
    SELECT available_copies INTO v_available
    FROM books
    WHERE book_id = p_book_id AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'book_not_found');
    END IF;

    -- If copies available, no need to reserve
    IF v_available > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'copies_available');
    END IF;

    -- Check if already has pending reservation
    IF EXISTS (
        SELECT 1 FROM reservations
        WHERE organization_id = p_organization_id
        AND book_id = p_book_id
        AND user_id = v_user_id
        AND status = 'pending'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'already_reserved');
    END IF;

    -- Create reservation
    INSERT INTO reservations (organization_id, book_id, user_id, status)
    VALUES (p_organization_id, p_book_id, v_user_id, 'pending')
    RETURNING reservation_id INTO v_reservation_id;

    RETURN jsonb_build_object(
        'success', true,
        'reservation_id', v_reservation_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Updated Dashboard Stats (Multi-Tenant)
-- =====================================================
DROP FUNCTION IF EXISTS get_user_dashboard_stats(UUID);

CREATE OR REPLACE FUNCTION get_user_dashboard_stats(
    p_organization_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_books BIGINT,
    borrowed_books BIGINT,
    overdue_books BIGINT,
    reservations BIGINT
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM books WHERE organization_id = p_organization_id)::BIGINT,
        (SELECT COUNT(*) FROM loans WHERE organization_id = p_organization_id AND user_id = v_user_id AND status = 'active')::BIGINT,
        (SELECT COUNT(*) FROM loans WHERE organization_id = p_organization_id AND user_id = v_user_id AND status = 'active' AND due_date < CURRENT_DATE)::BIGINT,
        (SELECT COUNT(*) FROM reservations WHERE organization_id = p_organization_id AND user_id = v_user_id AND status = 'pending')::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. Updated Category Distribution (Multi-Tenant)
-- =====================================================
DROP FUNCTION IF EXISTS get_category_distribution();

CREATE OR REPLACE FUNCTION get_category_distribution(p_organization_id UUID)
RETURNS TABLE(name TEXT, value BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.name::TEXT,
        COUNT(b.book_id) as value
    FROM categories c
    LEFT JOIN books b ON c.category_id = b.category_id AND b.organization_id = p_organization_id
    WHERE c.organization_id = p_organization_id OR c.organization_id IS NULL
    GROUP BY c.category_id, c.name
    HAVING COUNT(b.book_id) > 0
    ORDER BY value DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. Updated Popular Books (Multi-Tenant)
-- =====================================================
DROP FUNCTION IF EXISTS get_popular_books(INTEGER);

CREATE OR REPLACE FUNCTION get_popular_books(
    p_organization_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(title TEXT, loan_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.title::TEXT,
        COUNT(l.loan_id) as loan_count
    FROM books b
    LEFT JOIN loans l ON b.book_id = l.book_id
    WHERE b.organization_id = p_organization_id
    GROUP BY b.book_id, b.title
    ORDER BY loan_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. Updated Loan Trends (Multi-Tenant)
-- =====================================================
DROP FUNCTION IF EXISTS get_loan_trends(INTEGER);

CREATE OR REPLACE FUNCTION get_loan_trends(
    p_organization_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(date TEXT, loans BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(l.checkout_date, 'YYYY-MM-DD')::TEXT as date,
        COUNT(l.loan_id) as loans
    FROM loans l
    WHERE l.organization_id = p_organization_id
    AND l.checkout_date >= CURRENT_DATE - p_days
    GROUP BY TO_CHAR(l.checkout_date, 'YYYY-MM-DD')
    ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. Updated Activity Data (Multi-Tenant)
-- =====================================================
DROP FUNCTION IF EXISTS get_activity_data(TEXT);

CREATE OR REPLACE FUNCTION get_activity_data(
    p_organization_id UUID,
    p_time_range TEXT DEFAULT '30d'
)
RETURNS TABLE(
    name TEXT,
    loans BIGINT,
    returns BIGINT,
    new_members BIGINT
) AS $$
DECLARE
    days_back INTEGER;
BEGIN
    days_back := CASE p_time_range
        WHEN '7d' THEN 7
        WHEN '30d' THEN 30
        WHEN '90d' THEN 90
        ELSE 30
    END;

    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - days_back,
            CURRENT_DATE,
            '1 day'::interval
        )::date as activity_date
    )
    SELECT
        TO_CHAR(ds.activity_date, 'YYYY-MM-DD')::TEXT as name,
        COALESCE(COUNT(DISTINCT l1.loan_id), 0) as loans,
        COALESCE(COUNT(DISTINCT l2.loan_id), 0) as returns,
        COALESCE(COUNT(DISTINCT om.membership_id), 0) as new_members
    FROM date_series ds
    LEFT JOIN loans l1 ON DATE(l1.checkout_date) = ds.activity_date AND l1.organization_id = p_organization_id
    LEFT JOIN loans l2 ON DATE(l2.return_date) = ds.activity_date AND l2.organization_id = p_organization_id
    LEFT JOIN organization_members om ON DATE(om.joined_at) = ds.activity_date AND om.organization_id = p_organization_id
    GROUP BY ds.activity_date
    ORDER BY ds.activity_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. Get Organization Stats (Admin Dashboard)
-- =====================================================
CREATE OR REPLACE FUNCTION get_organization_stats(p_organization_id UUID)
RETURNS TABLE(
    total_books BIGINT,
    total_members BIGINT,
    active_loans BIGINT,
    overdue_loans BIGINT,
    total_reservations BIGINT,
    books_quota INTEGER,
    users_quota INTEGER
) AS $$
BEGIN
    IF NOT is_org_member(p_organization_id) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM books WHERE organization_id = p_organization_id)::BIGINT,
        (SELECT COUNT(*) FROM organization_members WHERE organization_id = p_organization_id AND status = 'active')::BIGINT,
        (SELECT COUNT(*) FROM loans WHERE organization_id = p_organization_id AND status = 'active')::BIGINT,
        (SELECT COUNT(*) FROM loans WHERE organization_id = p_organization_id AND status = 'active' AND due_date < CURRENT_DATE)::BIGINT,
        (SELECT COUNT(*) FROM reservations WHERE organization_id = p_organization_id AND status = 'pending')::BIGINT,
        (SELECT COALESCE(o.max_books, sp.max_books) FROM organizations o JOIN subscription_plans sp ON o.subscription_plan = sp.plan_id WHERE o.organization_id = p_organization_id),
        (SELECT COALESCE(o.max_users, sp.max_users) FROM organizations o JOIN subscription_plans sp ON o.subscription_plan = sp.plan_id WHERE o.organization_id = p_organization_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 13. Switch Current Organization
-- =====================================================
CREATE OR REPLACE FUNCTION switch_organization(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;

    -- Check if user is member of target organization
    IF NOT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = p_organization_id
        AND user_id = v_user_id
        AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_member');
    END IF;

    -- Update current organization
    UPDATE users
    SET current_organization_id = p_organization_id
    WHERE user_id::text = v_user_id::text;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 14. Get User Organizations
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE(
    organization_id UUID,
    name VARCHAR(100),
    slug VARCHAR(50),
    logo_url TEXT,
    role VARCHAR(20),
    subscription_plan VARCHAR(20),
    subscription_status VARCHAR(20),
    is_current BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
    v_current_org_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Get current organization
    SELECT current_organization_id INTO v_current_org_id
    FROM users
    WHERE user_id::text = v_user_id::text;

    RETURN QUERY
    SELECT
        o.organization_id,
        o.name,
        o.slug,
        o.logo_url,
        om.role,
        o.subscription_plan,
        o.subscription_status,
        (o.organization_id = v_current_org_id) as is_current
    FROM organizations o
    JOIN organization_members om ON o.organization_id = om.organization_id
    WHERE om.user_id = v_user_id
    AND om.status = 'active'
    ORDER BY (o.organization_id = v_current_org_id) DESC, o.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
