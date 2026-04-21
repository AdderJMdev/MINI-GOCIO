-- Add new columns to products
ALTER TABLE products ADD COLUMN brand TEXT;
ALTER TABLE products ADD COLUMN supplier_id INTEGER;
ALTER TABLE products ADD COLUMN stock_type TEXT DEFAULT 'quantity'; -- quantity, weight, volume

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Purchases table (Buys from suppliers)
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Purchase Items table
CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_cost REAL NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Logs table for linear reports
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL, -- sale, purchase, inventory_adjustment, customer_update, etc.
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initial settings for currency and units
INSERT OR IGNORE INTO settings (key, value) VALUES ('currency_type', 'PEN'); -- PEN (Soles), USD (Dolares)
INSERT OR IGNORE INTO settings (key, value) VALUES ('default_unit', 'kg'); -- kg, g, l, unit
