const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const Razorpay = require('razorpay');
const pool = require('./db');

dotenv.config();

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL || ["http://localhost:5173", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json());

// Cloudinary Config
// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Razorpay Config (Use env vars in real app, defaults here for structure)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Multer for file upload handling (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Routes ---

// Products
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products');
        // Convert decimal strings to numbers if needed, though JS handles quite a bit.
        // React code expected numbers for price.
        const products = rows.map(p => ({
            ...p,
            price: Number(p.price),
            regularPrice: Number(p.regularPrice),
            active: Boolean(p.active)
        }));
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, price, regularPrice, description, imageUrl, category, active } = req.body;
        const [result] = await pool.query(
            'INSERT INTO products (name, price, regularPrice, description, imageUrl, category, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, price, regularPrice, description, imageUrl, category, active]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Configs (General getter/setter)
app.get('/api/configs/:key', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT value FROM configs WHERE key_name = ?', [req.params.key]);
        if (rows.length > 0) {
            let val = rows[0].value;
            if (typeof val === 'string') {
                try { val = JSON.parse(val); } catch (e) { }
            }
            res.json(val);
        } else {
            res.status(404).json({ error: 'Config not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/configs/:key', async (req, res) => {
    try {
        const key = req.params.key;
        const value = JSON.stringify(req.body); // Ensure it's stored as JSON string if not auto-handled
        // MySQL JSON type handles objects, but 'value' in query parameter depends on driver. 
        // With mysql2 and JSON column, we usually pass the object directly or stringify.
        // Let's use ON DUPLICATE KEY UPDATE
        await pool.query('INSERT INTO configs (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?', [key, value, value]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file uploaded.');

        // Upload to Cloudinary stream
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: "auto",
            folder: "luvbees"
        });

        res.json({ url: result.secure_url });
    } catch (err) {
        console.error("Cloudinary Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Orders
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        // Parse JSON fields
        const orders = rows.map(o => {
            let customer = o.customer_info;
            let items = o.items;
            if (typeof customer === 'string') try { customer = JSON.parse(customer); } catch (e) { }
            if (typeof items === 'string') try { items = JSON.parse(items); } catch (e) { }
            return {
                ...o,
                customer,
                items
            };
        });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { customer, items, subtotal, shipCost, total, status } = req.body;
        // customer and items are objects/arrays, need to assume JSON column or stringify
        const [result] = await pool.query(
            'INSERT INTO orders (customer_info, items, subtotal, shipCost, total, status) VALUES (?, ?, ?, ?, ?, ?)',
            [JSON.stringify(customer), JSON.stringify(items), subtotal, shipCost, total, status]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Razorpay Create Order
app.post('/api/create-razorpay-order', async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;
        const options = {
            amount: amount * 100, // amount in smallest currency unit
            currency,
            receipt: `receipt_${Date.now()}`
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
