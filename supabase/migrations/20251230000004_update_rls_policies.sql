-- =====================================================
-- Multi-Tenant Library Management System
-- Migration 4: Update RLS Policies for Multi-Tenancy
-- =====================================================

-- =====================================================
-- 1. Drop Existing RLS Policies
-- =====================================================

-- Categories
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON categories;

-- Users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Books
DROP POLICY IF EXISTS "Anyone can view books" ON books;
DROP POLICY IF EXISTS "Authenticated users can insert books" ON books;
DROP POLICY IF EXISTS "Authenticated users can update books" ON books;

-- Loans
DROP POLICY IF EXISTS "Users can view their own loans" ON loans;
DROP POLICY IF EXISTS "Users can create their own loans" ON loans;
DROP POLICY IF EXISTS "Users can update their own loans" ON loans;

-- Reservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;

-- Reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

-- =====================================================
-- 2. Subscription Plans RLS (Public Read)
-- =====================================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
    ON subscription_plans FOR SELECT
    USING (is_active = true);

-- =====================================================
-- 3. Organizations RLS
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Members can view their organizations
CREATE POLICY "Members can view their organizations"
    ON organizations FOR SELECT
    TO authenticated
    USING (is_org_member(organization_id));

-- Also allow viewing by slug for join flow
CREATE POLICY "Anyone can view organization by slug for joining"
    ON organizations FOR SELECT
    USING (true);  -- Public info like name/slug for join flow

-- Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
    ON organizations FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only admins can update organizations
CREATE POLICY "Admins can update organizations"
    ON organizations FOR UPDATE
    TO authenticated
    USING (is_org_admin(organization_id))
    WITH CHECK (is_org_admin(organization_id));

-- Only owners can delete organizations
CREATE POLICY "Owners can delete organizations"
    ON organizations FOR DELETE
    TO authenticated
    USING (get_org_role(organization_id) = 'owner');

-- =====================================================
-- 4. Organization Members RLS
-- =====================================================
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in their organizations
CREATE POLICY "Members can view org members"
    ON organization_members FOR SELECT
    TO authenticated
    USING (is_org_member(organization_id));

-- Admins can add members
CREATE POLICY "Admins can insert members"
    ON organization_members FOR INSERT
    TO authenticated
    WITH CHECK (
        is_org_admin(organization_id)
        OR (user_id = auth.uid() AND role = 'owner')  -- Creator becomes owner
    );

-- Admins can update members (but not owners)
CREATE POLICY "Admins can update members"
    ON organization_members FOR UPDATE
    TO authenticated
    USING (
        is_org_admin(organization_id)
        AND (role != 'owner' OR user_id = auth.uid())  -- Can't change other owners
    )
    WITH CHECK (
        is_org_admin(organization_id)
    );

-- Admins can remove members (but not owners)
CREATE POLICY "Admins can delete members"
    ON organization_members FOR DELETE
    TO authenticated
    USING (
        (is_org_admin(organization_id) AND role != 'owner')
        OR user_id = auth.uid()  -- Users can leave
    );

-- =====================================================
-- 5. Organization Invitations RLS
-- =====================================================
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view invitations
CREATE POLICY "Admins can view invitations"
    ON organization_invitations FOR SELECT
    TO authenticated
    USING (is_org_admin(organization_id));

-- Also allow viewing by token for acceptance
CREATE POLICY "Anyone can view invitation by token"
    ON organization_invitations FOR SELECT
    USING (true);  -- Token lookup for join flow

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
    ON organization_invitations FOR INSERT
    TO authenticated
    WITH CHECK (is_org_admin(organization_id));

-- Admins can update invitations
CREATE POLICY "Admins can update invitations"
    ON organization_invitations FOR UPDATE
    TO authenticated
    USING (is_org_admin(organization_id))
    WITH CHECK (is_org_admin(organization_id));

-- Admins can delete invitations
CREATE POLICY "Admins can delete invitations"
    ON organization_invitations FOR DELETE
    TO authenticated
    USING (is_org_admin(organization_id));

-- =====================================================
-- 6. Categories RLS (Global + Org-specific)
-- =====================================================

-- Anyone can view global categories, members can view org categories
CREATE POLICY "View global and org categories"
    ON categories FOR SELECT
    TO authenticated
    USING (
        organization_id IS NULL  -- Global categories
        OR is_org_member(organization_id)  -- Org-specific categories
    );

-- Librarians can create org-specific categories
CREATE POLICY "Librarians can create org categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_librarian(organization_id)
    );

-- Librarians can update org-specific categories
CREATE POLICY "Librarians can update org categories"
    ON categories FOR UPDATE
    TO authenticated
    USING (
        organization_id IS NOT NULL
        AND is_org_librarian(organization_id)
    )
    WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_librarian(organization_id)
    );

-- Admins can delete org-specific categories
CREATE POLICY "Admins can delete org categories"
    ON categories FOR DELETE
    TO authenticated
    USING (
        organization_id IS NOT NULL
        AND is_org_admin(organization_id)
    );

-- =====================================================
-- 7. Users RLS (Profile is personal)
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id::text);

-- Users in same org can view basic profile info
CREATE POLICY "Org members can view member profiles"
    ON users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om1
            JOIN organization_members om2 ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = auth.uid()
            AND om2.user_id::text = users.user_id::text
            AND om1.status = 'active'
            AND om2.status = 'active'
        )
    );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- =====================================================
-- 8. Books RLS
-- =====================================================

-- Members can view organization books
CREATE POLICY "Members can view org books"
    ON books FOR SELECT
    TO authenticated
    USING (is_org_member(organization_id));

-- Librarians can insert books
CREATE POLICY "Librarians can insert books"
    ON books FOR INSERT
    TO authenticated
    WITH CHECK (
        is_org_librarian(organization_id)
        AND is_org_subscription_active(organization_id)
        AND check_org_book_quota(organization_id)
    );

-- Librarians can update books
CREATE POLICY "Librarians can update books"
    ON books FOR UPDATE
    TO authenticated
    USING (is_org_librarian(organization_id))
    WITH CHECK (is_org_librarian(organization_id));

-- Admins can delete books
CREATE POLICY "Admins can delete books"
    ON books FOR DELETE
    TO authenticated
    USING (is_org_admin(organization_id));

-- =====================================================
-- 9. Loans RLS
-- =====================================================

-- Members can view their own loans, librarians can view all org loans
CREATE POLICY "View loans"
    ON loans FOR SELECT
    TO authenticated
    USING (
        is_org_member(organization_id)
        AND (user_id = auth.uid() OR is_org_librarian(organization_id))
    );

-- Members can create their own loans, librarians can create for others
CREATE POLICY "Create loans"
    ON loans FOR INSERT
    TO authenticated
    WITH CHECK (
        is_org_member(organization_id)
        AND is_org_subscription_active(organization_id)
        AND (user_id = auth.uid() OR is_org_librarian(organization_id))
    );

-- Members can update their own loans, librarians can update all
CREATE POLICY "Update loans"
    ON loans FOR UPDATE
    TO authenticated
    USING (
        is_org_member(organization_id)
        AND (user_id = auth.uid() OR is_org_librarian(organization_id))
    )
    WITH CHECK (
        is_org_member(organization_id)
        AND (user_id = auth.uid() OR is_org_librarian(organization_id))
    );

-- Admins can delete loans
CREATE POLICY "Admins can delete loans"
    ON loans FOR DELETE
    TO authenticated
    USING (is_org_admin(organization_id));

-- =====================================================
-- 10. Reservations RLS
-- =====================================================

-- Members can view their own reservations, librarians can view all
CREATE POLICY "View reservations"
    ON reservations FOR SELECT
    TO authenticated
    USING (
        is_org_member(organization_id)
        AND (user_id = auth.uid() OR is_org_librarian(organization_id))
    );

-- Members can create their own reservations
CREATE POLICY "Create reservations"
    ON reservations FOR INSERT
    TO authenticated
    WITH CHECK (
        is_org_member(organization_id)
        AND is_org_subscription_active(organization_id)
        AND user_id = auth.uid()
    );

-- Members can update their own reservations, librarians can update all
CREATE POLICY "Update reservations"
    ON reservations FOR UPDATE
    TO authenticated
    USING (
        is_org_member(organization_id)
        AND (user_id = auth.uid() OR is_org_librarian(organization_id))
    )
    WITH CHECK (
        is_org_member(organization_id)
        AND (user_id = auth.uid() OR is_org_librarian(organization_id))
    );

-- Members can cancel their own reservations, librarians can delete any
CREATE POLICY "Delete reservations"
    ON reservations FOR DELETE
    TO authenticated
    USING (
        is_org_member(organization_id)
        AND (user_id = auth.uid() OR is_org_librarian(organization_id))
    );

-- =====================================================
-- 11. Reviews RLS
-- =====================================================

-- Members can view all reviews in their organizations
CREATE POLICY "Members can view org reviews"
    ON reviews FOR SELECT
    TO authenticated
    USING (is_org_member(organization_id));

-- Members can create their own reviews
CREATE POLICY "Members can create reviews"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        is_org_member(organization_id)
        AND user_id = auth.uid()
    );

-- Members can update their own reviews
CREATE POLICY "Members can update own reviews"
    ON reviews FOR UPDATE
    TO authenticated
    USING (
        is_org_member(organization_id)
        AND user_id = auth.uid()
    )
    WITH CHECK (
        is_org_member(organization_id)
        AND user_id = auth.uid()
    );

-- Members can delete their own reviews, admins can delete any
CREATE POLICY "Delete reviews"
    ON reviews FOR DELETE
    TO authenticated
    USING (
        is_org_member(organization_id)
        AND (user_id = auth.uid() OR is_org_admin(organization_id))
    );

-- =====================================================
-- 12. Subscription History RLS
-- =====================================================
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view subscription history
CREATE POLICY "Admins can view subscription history"
    ON subscription_history FOR SELECT
    TO authenticated
    USING (is_org_admin(organization_id));
