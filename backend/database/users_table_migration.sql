-- Migration to add missing columns to users table for admin functionality
-- This script adds the columns expected by the admin controller

USE casaos;

-- Add missing columns to users table one by one
ALTER TABLE users ADD COLUMN username VARCHAR(255) NULL AFTER clerk_id;
ALTER TABLE users ADD COLUMN first_name VARCHAR(255) NULL AFTER email;
ALTER TABLE users ADD COLUMN last_name VARCHAR(255) NULL AFTER first_name;
ALTER TABLE users ADD COLUMN role ENUM('user', 'artist', 'admin') DEFAULT 'user' AFTER last_name;
ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'banned', 'suspended') DEFAULT 'active' AFTER role;
ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP NULL AFTER updated_at;

-- Create indexes for the new columns
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_role ON users(role);
CREATE INDEX idx_status ON users(status);
CREATE INDEX idx_last_active_at ON users(last_active_at);

-- Update existing records to populate the new columns
-- Set username to clerk_id if not set
UPDATE users SET username = clerk_id WHERE username IS NULL;

-- Set role to 'user' for existing records
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Set status to 'active' for existing records
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Set last_active_at to last_login for existing records
UPDATE users SET last_active_at = last_login WHERE last_active_at IS NULL AND last_login IS NOT NULL;

-- Set last_active_at to created_at if last_login is null
UPDATE users SET last_active_at = created_at WHERE last_active_at IS NULL;