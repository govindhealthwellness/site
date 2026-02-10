const pool = require('./db');

async function initDb() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        regularPrice DECIMAL(10, 2),
        description TEXT,
        imageUrl VARCHAR(2048),
        category VARCHAR(50),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_info JSON,
        items JSON,
        subtotal DECIMAL(10, 2),
        shipCost DECIMAL(10, 2),
        total DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS configs (
        key_name VARCHAR(50) PRIMARY KEY,
        value JSON
      )
    `);

    // Insert initial data if empty
    const [rows] = await connection.query('SELECT * FROM products');
    if (rows.length === 0) {
      const INITIAL_PRODUCTS = [
        { name: 'LUVBEES Classic', price: 499.00, regularPrice: 799, description: "India's viral chocolate sensation. Feed the flame, naturally.", imageUrl: 'https://images.unsplash.com/photo-1516589174184-c68526674fd6', active: true, category: 'Chocolates' },
        { name: 'Combo Pack of 2', price: 799.00, regularPrice: 1598, description: "Double the delight. Save ₹450 with this pack of two handcrafted bars.", imageUrl: 'https://images.unsplash.com/photo-1522673607200-16484837dec5', active: true, category: 'Chocolates' },
        { name: 'Edible Chocobody Paint', price: 599.00, regularPrice: 899, description: "Rich, smooth dark chocolate paint with a soft brush for artistic intimacy.", imageUrl: 'https://images.unsplash.com/photo-1511381939415-e44015466834', active: true, category: 'Chocolates' },
        { name: 'Adam & Eve Candle', price: 1199.00, regularPrice: 2397, description: "Scented with sandalwood and rose petals. Designed for intimate evenings.", imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59', active: true, category: 'Gifts' },
        { name: 'Couple Flaming Card', price: 299.00, regularPrice: 499, description: "Heat-reactive cards that reveal daring dares and romantic prompts.", imageUrl: 'https://images.unsplash.com/photo-1534531173927-aeb928d54385', active: true, category: 'Gifts' },
        { name: 'Massage Oil Set', price: 899.00, regularPrice: 1499, description: "A trio of essential oils: Lavender, Ylang Ylang, and Jasmine for deep relaxation.", imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef', active: true, category: 'Gifts' }
      ];

      for (const p of INITIAL_PRODUCTS) {
        await connection.query('INSERT INTO products (name, price, regularPrice, description, imageUrl, category, active) VALUES (?, ?, ?, ?, ?, ?, ?)', [p.name, p.price, p.regularPrice, p.description, p.imageUrl, p.category, p.active]);
      }
      console.log('Initial products inserted');
    }

    // Insert initial configs
    await connection.query(`INSERT IGNORE INTO configs (key_name, value) VALUES ('flashnews', '{"text": "Flashnews • India\\'s viral chocolate • Free Shipping • Limited Stock", "speed": 15}')`);
    await connection.query(`INSERT IGNORE INTO configs (key_name, value) VALUES ('media', '{"heroImages": ["https://images.unsplash.com/photo-1516589174184-c68526674fd6", "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3", "https://images.unsplash.com/photo-1518895312237-a9e23508027d"], "galleryVideos": [], "socialPosts": []}')`);
    await connection.query(`INSERT IGNORE INTO configs (key_name, value) VALUES ('delivery', '{"fee": 50, "threshold": 500}')`);
    await connection.query(`INSERT IGNORE INTO configs (key_name, value) VALUES ('faqs', '{"items": []}')`);

    console.log('Database initialized');
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('Init DB Error:', err);
    process.exit(1);
  }
}

initDb();
