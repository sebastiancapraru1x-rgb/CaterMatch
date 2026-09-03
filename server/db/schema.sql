-- =====================================================
-- CATERMATCH — PostgreSQL Schema (v0.1)
-- Run against ANY PostgreSQL instance with PostGIS available:
--   * Local dev  → docker compose up -d (postgis/postgis:16-3.4)
--   * Free cloud → Supabase free tier (enable "PostGIS" extension in SQL editor)
--   * Self-host  → local Postgres + PostGIS packages (Path A in README §5)
-- =====================================================

-- Extensions
-- NOTE: zero-extension schema — gen_random_uuid() is built into Postgres 13+.
-- Optional (only if you enable PostGIS later):
--    CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- 1. Users
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. Listings (Dual Type: vendor_service | host_gig)
-- =====================================================
CREATE TYPE listing_type_enum AS ENUM ('vendor_service', 'host_gig');
CREATE TYPE price_tier_enum AS ENUM ('$', '$$', '$$$', '$$$$');

CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    listing_type listing_type_enum NOT NULL, -- 'vendor_service' OR 'host_gig'

    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,

    -- Location & Radius
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    service_radius_km INT DEFAULT 50,

    -- Host Gig Fields (Nullable)
    event_date DATE,
    expected_guests INT,
    budget_estimate NUMERIC(10, 2),

    -- Vendor Fields (Nullable)
    price_tier price_tier_enum DEFAULT '$$',
    photos TEXT[] DEFAULT '{}',

    -- Boost System
    is_boosted BOOLEAN DEFAULT FALSE,
    boost_expires_at TIMESTAMP WITH TIME ZONE,

    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. Conversations & Messages
-- =====================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    participant_one UUID REFERENCES users(id) ON DELETE CASCADE,
    participant_two UUID REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. Boost Transactions (Stripe)
-- =====================================================
CREATE TABLE boost_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_id VARCHAR(255) NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    boost_duration_days INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Indexes for Fast Geo & Boost Filtering
-- =====================================================
CREATE INDEX idx_listings_geo ON listings(latitude, longitude);
CREATE INDEX idx_listings_type ON listings(listing_type);
CREATE INDEX idx_listings_boosted ON listings(is_boosted, boost_expires_at);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_conversations_participants ON conversations(participant_one, participant_two);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);