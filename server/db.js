const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

let mysqlPool = null;
let sqliteDb = null;
let useSqlite = false;

async function getDb() {
  if (useSqlite) return sqliteDb;

  if (!mysqlPool) {
    try {
      console.log("Attempting MySQL Connection...");
      const tempPool = mysql.createPool({
        host: 'luvbees-govindhealthwellness.d.aivencloud.com',
        port: 12252,
        user: 'avnadmin',
        password: process.env.DB_PASSWORD,
        database: 'defaultdb',
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000
      });
      await tempPool.getConnection();
      console.log("MySQL Connected Successfully!");
      mysqlPool = tempPool;
    } catch (err) {
      console.error("MySQL Connection Failed (likely IP restriction). Switching to Local SQLite.");
      useSqlite = true;
      sqliteDb = await open({
        filename: path.join(__dirname, 'luvbees.sqlite'),
        driver: sqlite3.Database
      });
      await initSqliteSchema(sqliteDb);
      return sqliteDb;
    }
  }
  return mysqlPool;
}

async function initSqliteSchema(db) {
  await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        regularPrice REAL,
        description TEXT,
        imageUrl TEXT,
        category TEXT,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_info TEXT,
        items TEXT,
        subtotal REAL,
        shipCost REAL,
        total REAL,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS configs (
        key_name TEXT PRIMARY KEY,
        value TEXT
      );
    `);

  // Check if empty, seed
  const existing = await db.get('SELECT count(*) as count FROM products');
  if (existing.count === 0) {
    const INITIAL_PRODUCTS = [
      { name: 'LUVBEES Classic', price: 499.00, regularPrice: 799, description: "India's viral chocolate sensation. Feed the flame, naturally.", imageUrl: 'https://images.unsplash.com/photo-1516589174184-c68526674fd6', active: true, category: 'Chocolates' },
      { name: 'Combo Pack of 2', price: 799.00, regularPrice: 1598, description: "Double the delight. Save ₹450 with this pack of two handcrafted bars.", imageUrl: 'https://images.unsplash.com/photo-1522673607200-16484837dec5', active: true, category: 'Chocolates' },
      { name: 'Edible Chocobody Paint', price: 599.00, regularPrice: 899, description: "Rich, smooth dark chocolate paint with a soft brush for artistic intimacy.", imageUrl: 'https://images.unsplash.com/photo-1511381939415-e44015466834', active: true, category: 'Chocolates' },
      { name: 'Adam & Eve Candle', price: 1199.00, regularPrice: 2397, description: "Scented with sandalwood and rose petals. Designed for intimate evenings.", imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59', active: true, category: 'Gifts' },
      { name: 'Couple Flaming Card', price: 299.00, regularPrice: 499, description: "Heat-reactive cards that reveal daring dares and romantic prompts.", imageUrl: 'https://images.unsplash.com/photo-1534531173927-aeb928d54385', active: true, category: 'Gifts' },
      { name: 'Massage Oil Set', price: 899.00, regularPrice: 1499, description: "A trio of essential oils: Lavender, Ylang Ylang, and Jasmine for deep relaxation.", imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef', active: true, category: 'Gifts' }
    ];
    for (const p of INITIAL_PRODUCTS) {
      await db.run('INSERT INTO products (name, price, regularPrice, description, imageUrl, category, active) VALUES (?, ?, ?, ?, ?, ?, ?)', [p.name, p.price, p.regularPrice, p.description, p.imageUrl, p.category, p.active ? 1 : 0]);
    }
    await db.run(`INSERT OR IGNORE INTO configs (key_name, value) VALUES ('flashnews', '{"text": "Flashnews • India\\'s viral chocolate • Free Shipping • Limited Stock", "speed": 15}')`);
    await db.run(`INSERT OR IGNORE INTO configs (key_name, value) VALUES ('media', '{"heroImages": ["https://images.unsplash.com/photo-1516589174184-c68526674fd6", "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3", "https://images.unsplash.com/photo-1518895312237-a9e23508027d"], "galleryVideos": [], "socialPosts": []}')`);
    await db.run(`INSERT OR IGNORE INTO configs (key_name, value) VALUES ('delivery', '{"fee": 50, "threshold": 500}')`);
    await db.run(`INSERT OR IGNORE INTO configs (key_name, value) VALUES ('faqs', '{"items": []}')`);
  }
}

module.exports = {
  query: async (sql, params = []) => {
    const db = await getDb();
    if (useSqlite) {
      // Convert MySQL specific SQL to generic/SQLite if needed
      // NOTE: MySQL uses '?' for params, SQLite also supports '?'
      // But 'INSERT INTO ... SET ?' syntax is only MySQL. We used VALUES (?, ?, ...) in our code so it should be fine.
      // ON DUPLICATE KEY UPDATE is MySQL. SQLite is UPSERT (ON CONFLICT DO UPDATE).

      if (sql.includes('ON DUPLICATE KEY UPDATE')) {
        // Quick hack for the Config upsert: Replace with INSERT OR REPLACE or similar
        // Our config query: INSERT INTO configs (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?
        // SQLite: INSERT INTO configs (key_name, value) VALUES (?, ?) ON CONFLICT(key_name) DO UPDATE SET value = ?
        sql = sql.replace('ON DUPLICATE KEY UPDATE value = ?', 'ON CONFLICT(key_name) DO UPDATE SET value = excluded.value');
        // The params passed to the original query were [key, value, value].
        // SQLite UPSERT syntax in this tailored replace doesn't strictly need the 3rd param if we use 'excluded.value'
        // But the caller passes 3 params.
        // Actually, let's just use INSERT OR REPLACE INTO which takes 2 params for 2 cols.
        if (sql.startsWith('INSERT INTO configs')) {
          sql = 'INSERT OR REPLACE INTO configs (key_name, value) VALUES (?, ?)';
          if (params.length === 3) params.pop(); // Remove the 3rd duplicate param
        }
      }

      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
      try {
        if (isSelect) {
          const rows = await db.all(sql, params);
          return [rows, []];
        } else {
          const result = await db.run(sql, params);
          return [{ insertId: result.lastID, affectedRows: result.changes }, []];
        }
      } catch (err) {
        console.error("SQL Error", err);
        throw err;
      }
    } else {
      return db.query(sql, params);
    }
  }
};
