-- Seed data for local development
-- This file is automatically loaded when running `supabase db reset`

-- Insert test users with hashed passwords (password: "password123")
INSERT INTO users (name, email, password, is_active) VALUES 
('John Doe', 'john@example.com', '$2b$10$rQZ8fQZ8fQZ8fQZ8fQZ8fOZ8fQZ8fQZ8fQZ8fQZ8fQZ8fQZ8fQZ8fQ', true),
('Jane Smith', 'jane@example.com', '$2b$10$rQZ8fQZ8fQZ8fQZ8fQZ8fOZ8fQZ8fQZ8fQZ8fQZ8fQZ8fQZ8fQZ8fQ', true),
('Test User', 'test@example.com', '$2b$10$rQZ8fQZ8fQZ8fQZ8fQZ8fOZ8fQZ8fQZ8fQZ8fQZ8fQZ8fQZ8fQZ8fQ', false)
ON CONFLICT (email) DO NOTHING; 