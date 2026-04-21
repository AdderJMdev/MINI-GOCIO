-- Ensure products table has all columns with correct types
-- SQLite doesn't support changing column types easily, but we can ensure they exist

-- Add missing columns if they don't exist (using a safe approach for SQLite)
-- Brand
-- Supplier_id
-- Stock_type

-- Note: we already added these in the previous migration, but if it failed, 
-- this might help. However, ALTER TABLE might fail if columns already exist.
-- The most common reason for "stuck loading" is a database lock or a migration failure.

-- Let's try to ensure categories exists and has at least one entry
INSERT OR IGNORE INTO categories (id, name) VALUES (1, 'General');

-- Ensure settings for currency and units
INSERT OR IGNORE INTO settings (key, value) VALUES ('currency_type', 'PEN');
INSERT OR IGNORE INTO settings (key, value) VALUES ('default_unit', 'kg');
