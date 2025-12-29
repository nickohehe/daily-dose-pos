-- Create Menu Categories Table
CREATE TABLE IF NOT EXISTS categories (
    name VARCHAR(255) PRIMARY KEY
);

-- Seed Default Categories
INSERT INTO categories (name) VALUES ('All'), ('Basic') ON CONFLICT DO NOTHING;

-- Create Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(255) REFERENCES categories(name) ON DELETE SET NULL,
    emoji VARCHAR(10),
    image_url TEXT,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    total_amount DECIMAL(10, 2) DEFAULT 0,
    customer_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE, -- For history archiving
    table_number INTEGER,
    beeper_number INTEGER
);

-- Create Order Items Table (Junction table for Order <-> Menu Items)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id VARCHAR(255) REFERENCES menu_items(id), -- Nullable in case item is deleted? Or strict?
    menu_item_name_snapshot VARCHAR(255), -- Snapshot name in case menu changes
    menu_item_price_snapshot DECIMAL(10, 2), -- Snapshot price
    quantity INTEGER NOT NULL DEFAULT 1
);
