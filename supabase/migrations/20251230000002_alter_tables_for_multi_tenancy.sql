-- =====================================================
-- Multi-Tenant Library Management System
-- Migration 2: Alter Existing Tables for Multi-Tenancy
-- =====================================================

-- =====================================================
-- 1. Alter Users Table
-- =====================================================
-- Remove password_hash (managed by Supabase Auth)
-- Add relation to auth.users and current organization

ALTER TABLE users
    -- Drop password_hash column (Supabase Auth handles this)
    DROP COLUMN IF EXISTS password_hash,

    -- Add preferences and avatar
    ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,

    -- Add current active organization (for quick access)
    ADD COLUMN IF NOT EXISTS current_organization_id UUID
        REFERENCES organizations(organization_id) ON DELETE SET NULL;

-- Add foreign key to auth.users
-- First, ensure user_id references auth.users
-- Note: In Supabase, we typically link via auth.uid()
CREATE INDEX IF NOT EXISTS idx_users_current_org ON users(current_organization_id);

-- =====================================================
-- 2. Alter Categories Table
-- =====================================================
-- organization_id NULL means global/system category

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES organizations(organization_id) ON DELETE CASCADE;

-- Drop old unique constraint and add new one (org-scoped)
ALTER TABLE categories
    DROP CONSTRAINT IF EXISTS categories_name_key;

-- Add unique constraint for organization-scoped names
-- Global categories (org_id IS NULL) can have same name as org-specific ones
CREATE UNIQUE INDEX idx_categories_org_name_unique
    ON categories(organization_id, name)
    WHERE organization_id IS NOT NULL;

CREATE UNIQUE INDEX idx_categories_global_name_unique
    ON categories(name)
    WHERE organization_id IS NULL;

CREATE INDEX idx_categories_organization ON categories(organization_id);

-- =====================================================
-- 3. Alter Books Table
-- =====================================================
ALTER TABLE books
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES organizations(organization_id) ON DELETE CASCADE;

-- Drop old unique constraint on isbn and add org-scoped one
ALTER TABLE books
    DROP CONSTRAINT IF EXISTS books_isbn_key;

CREATE UNIQUE INDEX idx_books_org_isbn_unique
    ON books(organization_id, isbn);

CREATE INDEX idx_books_organization ON books(organization_id);

-- =====================================================
-- 4. Alter Loans Table
-- =====================================================
ALTER TABLE loans
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES organizations(organization_id) ON DELETE CASCADE;

CREATE INDEX idx_loans_organization ON loans(organization_id);

-- Composite index for common queries
CREATE INDEX idx_loans_org_user_status
    ON loans(organization_id, user_id, status);

-- =====================================================
-- 5. Alter Reservations Table
-- =====================================================
ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES organizations(organization_id) ON DELETE CASCADE;

CREATE INDEX idx_reservations_organization ON reservations(organization_id);

-- Composite index for common queries
CREATE INDEX idx_reservations_org_user_status
    ON reservations(organization_id, user_id, status);

-- =====================================================
-- 6. Alter Reviews Table
-- =====================================================
ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES organizations(organization_id) ON DELETE CASCADE;

CREATE INDEX idx_reviews_organization ON reviews(organization_id);

-- =====================================================
-- 7. Add Some System Categories (Global)
-- =====================================================
-- These are available to all organizations
INSERT INTO categories (name, description, organization_id) VALUES
    ('Fiction', 'Novels and fictional stories', NULL),
    ('Non-Fiction', 'Factual and informational books', NULL),
    ('Science', 'Scientific literature and textbooks', NULL),
    ('Technology', 'Computer science and technology books', NULL),
    ('History', 'Historical books and biographies', NULL),
    ('Literature', 'Classic and contemporary literature', NULL),
    ('Children', 'Books for children and young readers', NULL),
    ('Business', 'Business and economics books', NULL),
    ('Art & Design', 'Art, photography, and design books', NULL),
    ('Self-Help', 'Personal development and self-improvement', NULL)
ON CONFLICT DO NOTHING;
