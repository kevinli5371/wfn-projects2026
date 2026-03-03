-- 1. DROP EXISTING TABLES FIRST (Nuke everything)
-- We drop them in this order to avoid foreign key constraint errors
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- 2. RECREATE EVERYTHING FRESH
-- Create the Users table
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    balance FLOAT DEFAULT 1000.0
);

-- Create the Videos (Assets) table
CREATE TABLE IF NOT EXISTS videos (
    asset_id TEXT PRIMARY KEY,
    video_url TEXT NOT NULL,
    author TEXT,
    views BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    current_price FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the Investments table
CREATE TABLE IF NOT EXISTS investments (
    investment_id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    asset_id TEXT REFERENCES videos(asset_id) ON DELETE CASCADE,
    shares_owned FLOAT DEFAULT 0.0,
    buy_price FLOAT DEFAULT 0.0,
    cost_basis FLOAT DEFAULT 0.0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert test users to match previous in-memory state
INSERT INTO users (user_id, balance) VALUES ('user1', 1000.0) ON CONFLICT (user_id) DO NOTHING;
INSERT INTO users (user_id, balance) VALUES ('testuser', 5000.0) ON CONFLICT (user_id) DO NOTHING;
