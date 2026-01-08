-- Converge KYC System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'partner');
CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('aadhaar', 'pan', 'passport', 'driving_license', 'voter_id', 'utility_bill', 'bank_statement');
CREATE TYPE transaction_type AS ENUM ('credit', 'debit');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- KYC Profiles Table
CREATE TABLE kyc_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kyc_status kyc_status DEFAULT 'pending',
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    credit_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    document_number VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    merchant_name VARCHAR(255),
    category VARCHAR(100),
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Partner Integrations Table
CREATE TABLE partner_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_name VARCHAR(255) NOT NULL UNIQUE,
    partner_code VARCHAR(50) NOT NULL UNIQUE,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    allowed_scopes TEXT[], -- Array of allowed data access scopes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Partner Links Table (OAuth-like linking)
CREATE TABLE user_partner_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partner_integrations(id) ON DELETE CASCADE,
    access_token VARCHAR(500) NOT NULL UNIQUE,
    refresh_token VARCHAR(500),
    granted_scopes TEXT[],
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, partner_id)
);

-- KYC Review History Table
CREATE TABLE kyc_review_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kyc_profile_id UUID NOT NULL REFERENCES kyc_profiles(id) ON DELETE CASCADE,
    reviewed_by UUID NOT NULL REFERENCES users(id),
    previous_status kyc_status,
    new_status kyc_status NOT NULL,
    comments TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_kyc_profiles_user_id ON kyc_profiles(user_id);
CREATE INDEX idx_kyc_profiles_status ON kyc_profiles(kyc_status);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_user_partner_links_user ON user_partner_links(user_id);
CREATE INDEX idx_user_partner_links_partner ON user_partner_links(partner_id);
CREATE INDEX idx_user_partner_links_token ON user_partner_links(access_token);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_profiles_updated_at BEFORE UPDATE ON kyc_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: Admin@123456)
-- Note: The password hash is for "Admin@123456" using bcrypt with 10 rounds
-- Hash generated with: bcrypt.hash('Admin@123456', 10)
INSERT INTO users (email, password_hash, full_name, role) 
VALUES (
    'admin@converge.com',
    '$2b$10$YourActualBcryptHashWouldGoHere.OrUseApplicationToCreateIt',
    'System Administrator',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert a test user (password: TestUser@123)
-- For quick testing without registration
INSERT INTO users (email, password_hash, full_name, phone, role) 
VALUES (
    'testuser@example.com',
    '$2b$10$AnotherHashForTestUser.UseApplicationOrBcryptCLI',
    'Test User',
    '+919876543210',
    'user'
) ON CONFLICT (email) DO NOTHING;

-- Create KYC profile for test user
INSERT INTO kyc_profiles (user_id, date_of_birth, address, city, state, postal_code, country)
SELECT id, '1995-01-15', '123 Test Street', 'Mumbai', 'Maharashtra', '400001', 'India'
FROM users WHERE email = 'testuser@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample partner (Slice)
INSERT INTO partner_integrations (partner_name, partner_code, api_key, allowed_scopes)
VALUES (
    'Slice',
    'SLICE',
    'slice_api_key_' || gen_random_uuid()::text,
    ARRAY['kyc_status', 'credit_score', 'transaction_history']
) ON CONFLICT (partner_code) DO NOTHING;

-- Sample transactions for testing credit score (for demo purposes)
-- These will be inserted when a user signs up through application logic
