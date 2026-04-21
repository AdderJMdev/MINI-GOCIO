-- Final fix for products table and its dependencies
-- We drop dependent tables first to avoid FOREIGN KEY constraints failing
-- Since data is just for testing, we prioritize a clean and working schema.

DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS purchase_items;
DROP TABLE IF EXISTS products;

-- Recreate products with correct REAL types
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    price REAL NOT NULL DEFAULT 0.0,
    stock_quantity REAL NOT NULL DEFAULT 0.0,
    category_id INTEGER,
    brand TEXT,
    supplier_id INTEGER,
    stock_type TEXT DEFAULT 'quantity',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Recreate sale_items with REAL quantity
CREATE TABLE sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Recreate purchase_items
CREATE TABLE purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_cost REAL NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Ensure category exists
INSERT OR IGNORE INTO categories (id, name) VALUES (1, 'General');
