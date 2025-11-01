-- Enable Row Level Security on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Categories: Public read, authenticated users can suggest (for now, admin insert only)
CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Users: Users can read and update their own profile
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text);

-- Books: Everyone can read, authenticated users can create (for demo purposes)
CREATE POLICY "Anyone can view books"
    ON books FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert books"
    ON books FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update books"
    ON books FOR UPDATE
    TO authenticated
    WITH CHECK (true);

-- Loans: Users can view and manage their own loans
CREATE POLICY "Users can view their own loans"
    ON loans FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own loans"
    ON loans FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own loans"
    ON loans FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- Reservations: Users can view and manage their own reservations
CREATE POLICY "Users can view their own reservations"
    ON reservations FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own reservations"
    ON reservations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own reservations"
    ON reservations FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- Reviews: Users can view all reviews, but only manage their own
CREATE POLICY "Anyone can view reviews"
    ON reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own reviews"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own reviews"
    ON reviews FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own reviews"
    ON reviews FOR DELETE
    TO authenticated
    USING (auth.uid()::text = user_id::text);
