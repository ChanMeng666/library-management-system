-- Create categories table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    membership_type VARCHAR(20) DEFAULT 'basic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create books table
CREATE TABLE books (
    book_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(100),
    publish_date DATE,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    description TEXT,
    cover_image_url TEXT,
    location VARCHAR(50),
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_available_copies CHECK (available_copies >= 0 AND available_copies <= total_copies)
);

-- Create loans table
CREATE TABLE loans (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    book_id UUID REFERENCES books(book_id) ON DELETE SET NULL,
    checkout_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reservations table
CREATE TABLE reservations (
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    book_id UUID REFERENCES books(book_id) ON DELETE SET NULL,
    reservation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    book_id UUID REFERENCES books(book_id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

-- Create indexes for better performance
CREATE INDEX idx_books_category ON books(category_id);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_book ON loans(book_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_book ON reservations(book_id);
CREATE INDEX idx_reviews_book ON reviews(book_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: borrow_book (creates a new loan)
CREATE OR REPLACE FUNCTION borrow_book(
    p_user_id UUID,
    p_book_id UUID,
    p_due_date DATE
)
RETURNS TEXT AS $$
DECLARE
    v_available_copies INTEGER;
    v_loan_id UUID;
BEGIN
    -- Check if book has available copies
    SELECT available_copies INTO v_available_copies
    FROM books
    WHERE book_id = p_book_id;

    IF v_available_copies IS NULL THEN
        RETURN 'error:book_not_found';
    END IF;

    IF v_available_copies <= 0 THEN
        RETURN 'error:no_copies_available';
    END IF;

    -- Create loan
    INSERT INTO loans (user_id, book_id, due_date, status)
    VALUES (p_user_id, p_book_id, p_due_date, 'active')
    RETURNING loan_id INTO v_loan_id;

    -- Decrease available copies
    UPDATE books
    SET available_copies = available_copies - 1
    WHERE book_id = p_book_id;

    RETURN 'success:' || v_loan_id::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function: return_book (marks loan as returned)
CREATE OR REPLACE FUNCTION return_book(p_loan_id UUID)
RETURNS VOID AS $$
DECLARE
    v_book_id UUID;
BEGIN
    -- Get book_id and update loan
    UPDATE loans
    SET status = 'returned',
        return_date = CURRENT_TIMESTAMP
    WHERE loan_id = p_loan_id AND status = 'active'
    RETURNING book_id INTO v_book_id;

    -- Increase available copies
    IF v_book_id IS NOT NULL THEN
        UPDATE books
        SET available_copies = available_copies + 1
        WHERE book_id = v_book_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: get_category_distribution
CREATE OR REPLACE FUNCTION get_category_distribution()
RETURNS TABLE(name TEXT, value BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.name::TEXT,
        COUNT(b.book_id) as value
    FROM categories c
    LEFT JOIN books b ON c.category_id = b.category_id
    GROUP BY c.category_id, c.name
    ORDER BY value DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: get_popular_books
CREATE OR REPLACE FUNCTION get_popular_books(limit_num INTEGER)
RETURNS TABLE(title TEXT, loan_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.title::TEXT,
        COUNT(l.loan_id) as loan_count
    FROM books b
    LEFT JOIN loans l ON b.book_id = l.book_id
    GROUP BY b.book_id, b.title
    ORDER BY loan_count DESC
    LIMIT limit_num;
END;
$$ LANGUAGE plpgsql;

-- Function: get_loan_trends
CREATE OR REPLACE FUNCTION get_loan_trends(days_num INTEGER)
RETURNS TABLE(date TEXT, loans BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(l.checkout_date, 'YYYY-MM-DD')::TEXT as date,
        COUNT(l.loan_id) as loans
    FROM loans l
    WHERE l.checkout_date >= CURRENT_DATE - days_num
    GROUP BY TO_CHAR(l.checkout_date, 'YYYY-MM-DD')
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- Function: get_activity_data
CREATE OR REPLACE FUNCTION get_activity_data(time_range TEXT)
RETURNS TABLE(
    name TEXT,
    loans BIGINT,
    returns BIGINT,
    new_users BIGINT
) AS $$
DECLARE
    days_back INTEGER;
BEGIN
    -- Determine days to look back based on time_range
    days_back := CASE time_range
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
        COALESCE(COUNT(DISTINCT u.user_id), 0) as new_users
    FROM date_series ds
    LEFT JOIN loans l1 ON DATE(l1.checkout_date) = ds.activity_date
    LEFT JOIN loans l2 ON DATE(l2.return_date) = ds.activity_date
    LEFT JOIN users u ON DATE(u.created_at) = ds.activity_date
    GROUP BY ds.activity_date
    ORDER BY ds.activity_date;
END;
$$ LANGUAGE plpgsql;

-- Function: get_user_dashboard_stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_id UUID)
RETURNS TABLE(
    totalbooks BIGINT,
    borrowedbooks BIGINT,
    overduebooks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM books)::BIGINT as totalbooks,
        (SELECT COUNT(*) FROM loans WHERE loans.user_id = get_user_dashboard_stats.user_id AND status = 'active')::BIGINT as borrowedbooks,
        (SELECT COUNT(*) FROM loans WHERE loans.user_id = get_user_dashboard_stats.user_id AND status = 'active' AND due_date < CURRENT_DATE)::BIGINT as overduebooks;
END;
$$ LANGUAGE plpgsql;

-- Function: get_user_statistics
CREATE OR REPLACE FUNCTION get_user_statistics(user_id UUID)
RETURNS TABLE(
    books_read BIGINT,
    pages_read INTEGER,
    average_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT l.book_id)::BIGINT as books_read,
        0 as pages_read, -- Placeholder, requires pages column in books table
        COALESCE(AVG(r.rating), 0)::NUMERIC as average_rating
    FROM loans l
    LEFT JOIN reviews r ON r.user_id = l.user_id
    WHERE l.user_id = get_user_statistics.user_id AND l.status = 'returned';
END;
$$ LANGUAGE plpgsql;

-- Function: reserve_book (compatibility function, simplified version)
CREATE OR REPLACE FUNCTION reserve_book(book_id INTEGER, user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- This is a legacy function signature, keeping for compatibility
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
