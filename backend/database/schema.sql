-- Saintara Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent')),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Character types table
CREATE TABLE IF NOT EXISTS character_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    strengths TEXT[],
    challenges TEXT[],
    career_paths TEXT[],
    communication_style TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_type VARCHAR(50) DEFAULT 'personal' CHECK (test_type IN ('personal', 'couple', 'family', 'team')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test questions table
CREATE TABLE IF NOT EXISTS test_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    category VARCHAR(100),
    question_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test answers table
CREATE TABLE IF NOT EXISTS test_answers (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES test_questions(id),
    answer_value INTEGER CHECK (answer_value BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test results table
CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    character_type_id INTEGER REFERENCES character_types(id),
    personality_traits JSONB,
    strengths TEXT[],
    challenges TEXT[],
    career_recommendations TEXT[],
    relationship_insights TEXT,
    stress_management TEXT,
    communication_tips TEXT,
    development_areas TEXT[],
    score_breakdown JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    package_type VARCHAR(50) CHECK (package_type IN ('personal', 'couple', 'team')),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    payment_proof_url VARCHAR(500),
    transaction_code VARCHAR(100) UNIQUE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tokens/Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    package_type VARCHAR(50) CHECK (package_type IN ('personal', 'couple', 'team')),
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    commission_rate DECIMAL(5, 2) DEFAULT 10.00,
    total_sales DECIMAL(10, 2) DEFAULT 0.00,
    total_commission DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent sales table
CREATE TABLE IF NOT EXISTS agent_sales (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES transactions(id),
    commission_amount DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events/Seminars table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) CHECK (event_type IN ('webinar', 'talkshow', 'workshop', 'seminar')),
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    capacity INTEGER,
    registered_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Admin approvals table
CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL CHECK (type IN ('agent_commission', 'partnership', 'event_invite')),
    reference_id INTEGER,
    requester_id INTEGER REFERENCES users(id),
    approver_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tests_user_id ON tests(user_id);
CREATE INDEX idx_test_results_user_id ON test_results(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agent_sales_agent_id ON agent_sales(agent_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to approvals table
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Articles table for content management
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    featured_image VARCHAR(500),
    author_id INTEGER REFERENCES users(id),
    is_published BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for articles
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published);

-- Apply trigger to articles table
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
