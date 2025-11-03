-- Migration: Add biodata fields to users table
-- Date: 2025-11-03

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Add constraints for gender
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_gender_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_gender_check
        CHECK (gender IN ('Laki-laki', 'Perempuan', NULL));
    END IF;
END $$;

-- Add constraints for blood_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_blood_type_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_blood_type_check
        CHECK (blood_type IN ('A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', NULL));
    END IF;
END $$;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);

-- Comment the columns
COMMENT ON COLUMN users.nickname IS 'User nickname or preferred name';
COMMENT ON COLUMN users.gender IS 'User gender (Laki-laki/Perempuan)';
COMMENT ON COLUMN users.blood_type IS 'User blood type (A, B, AB, O with +/-)';
COMMENT ON COLUMN users.country IS 'User country of residence';
COMMENT ON COLUMN users.city IS 'User city of residence';
