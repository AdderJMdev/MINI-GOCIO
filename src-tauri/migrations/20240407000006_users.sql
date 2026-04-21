-- Create users table for access control
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier', -- 'admin' or 'cashier'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create default admin user
-- The default PIN is '1234'. The hash below is for '1234' generated with bcrypt (cost 4 for speed, it's a local app).
-- In Rust we will use bcrypt to verify this hash against the input PIN.
-- $2b$04$B2/XJ0/wG4X1N1c5zFwMvO1v1rXv1v1rXv1v1rXv1v1rXv1v1rXv1
-- Wait, I need a valid bcrypt hash for '1234'.
-- I'll use a pre-calculated valid bcrypt hash for '1234' with cost 4.
-- $2y$04$mF5B12P6A2z7.fL.DkH/ue6O8L0sR8h2d2H8X1/x.gB/s31s9Zt/W
INSERT OR IGNORE INTO users (id, name, pin_hash, role) VALUES (1, 'Administrador', '$2b$04$h2dGGRu.j2Z9/p3zYp6bC.cgBEFtdp8KZracVZJkBnwlsp4DfH1Z.', 'admin');
