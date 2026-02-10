-- LuvBees Database Schema for Aiven MySQL
-- Run this script in Aiven Console to initialize your database

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    regularPrice DECIMAL(10, 2),
    description TEXT,
    imageUrl TEXT,
    category VARCHAR(100),
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_info JSON,
    items JSON,
    subtotal DECIMAL(10, 2),
    shipCost DECIMAL(10, 2),
    total DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create configs table
CREATE TABLE IF NOT EXISTS configs (
    key_name VARCHAR(100) PRIMARY KEY,
    value JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial products
INSERT INTO products (name, price, regularPrice, description, imageUrl, category, active) VALUES
('LUVBEES Classic', 499.00, 799.00, 'India\'s viral chocolate sensation. Feed the flame, naturally.', 'https://images.unsplash.com/photo-1516589174184-c68526674fd6', 'Chocolates', 1),
('Combo Pack of 2', 799.00, 1598.00, 'Double the delight. Save ₹450 with this pack of two handcrafted bars.', 'https://images.unsplash.com/photo-1522673607200-16484837dec5', 'Chocolates', 1),
('Edible Chocobody Paint', 599.00, 899.00, 'Rich, smooth dark chocolate paint with a soft brush for artistic intimacy.', 'https://images.unsplash.com/photo-1511381939415-e44015466834', 'Chocolates', 1),
('Adam & Eve Candle', 1199.00, 2397.00, 'Scented with sandalwood and rose petals. Designed for intimate evenings.', 'https://images.unsplash.com/photo-1603006905003-be475563bc59', 'Gifts', 1),
('Couple Flaming Card', 299.00, 499.00, 'Heat-reactive cards that reveal daring dares and romantic prompts.', 'https://images.unsplash.com/photo-1534531173927-aeb928d54385', 'Gifts', 1),
('Massage Oil Set', 899.00, 1499.00, 'A trio of essential oils: Lavender, Ylang Ylang, and Jasmine for deep relaxation.', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef', 'Gifts', 1);

-- Insert initial configs
INSERT INTO configs (key_name, value) VALUES
('flashnews', '{"text": "Flashnews • India\'s viral chocolate • Free Shipping • Limited Stock", "speed": 15}'),
('media', '{"heroImages": ["https://images.unsplash.com/photo-1516589174184-c68526674fd6", "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3", "https://images.unsplash.com/photo-1518895312237-a9e23508027d"], "galleryVideos": [], "momentImages": [], "socialPosts": []}'),
('delivery', '{"fee": 50, "threshold": 500, "note": ""}'),
('faqs', '{"items": []}');

-- Verify tables were created
SHOW TABLES;

-- Verify data was inserted
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as config_count FROM configs;
