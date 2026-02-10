const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const Razorpay = require('razorpay');
const { query: dbQuery, testConnection } = require('./db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Razorpay Config
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Multer for file upload handling (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Health check endpoint for debugging
app.get('/api/health', async (req, res) => {
    try {
        await testConnection();
        res.json({
            status: 'ok',
            database: 'MySQL connected',
            env: {
                hasDbPassword: !!process.env.DB_PASSWORD,
                hasCloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
                hasRazorpay: !!process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            database: 'MySQL connection failed',
            error: error.message,
            code: error.code
        });
    }
});

// --- Routes ---

// Products
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await dbQuery('SELECT * FROM products');
        const products = rows.map(p => ({
            ...p,
            price: Number(p.price),
            regularPrice: Number(p.regularPrice),
            active: Boolean(p.active)
        }));
        res.json(products);
    } catch (err) {
        console.error('[API] Error fetching products:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, price, regularPrice, description, imageUrl, category, active } = req.body;
        const [result] = await dbQuery(
            'INSERT INTO products (name, price, regularPrice, description, imageUrl, category, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, price, regularPrice, description, imageUrl, category, active]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (err) {
        console.error('[API] Error creating product:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await dbQuery('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('[API] Error deleting product:', err);
        res.status(500).json({ error: err.message });
    }
});

// Configs (General getter/setter)
app.get('/api/configs/:key', async (req, res) => {
    try {
        const [rows] = await dbQuery('SELECT value FROM configs WHERE key_name = ?', [req.params.key]);
        if (rows.length > 0) {
            let val = rows[0].value;
            // MySQL JSON columns return objects directly
            res.json(val);
        } else {
            res.status(404).json({ error: 'Config not found' });
        }
    } catch (err) {
        console.error('[API] Error fetching config:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/configs/:key', async (req, res) => {
    try {
        const key = req.params.key;
        const value = JSON.stringify(req.body);

        await dbQuery(
            'INSERT INTO configs (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
            [key, value, value]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('[API] Error saving config:', err);
        res.status(500).json({ error: err.message });
    }
});

// Upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file uploaded.');

        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: "auto",
            folder: "luvbees"
        });

        res.json({ url: result.secure_url });
    } catch (err) {
        console.error("[API] Cloudinary Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Orders
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await dbQuery('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('[API] Error fetching orders:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { customer_info, items, subtotal, shipCost, total, status = 'Pending' } = req.body;

        const [result] = await dbQuery(
            'INSERT INTO orders (customer_info, items, subtotal, shipCost, total, status) VALUES (?, ?, ?, ?, ?, ?)',
            [JSON.stringify(customer_info), JSON.stringify(items), subtotal, shipCost, total, status]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (err) {
        console.error('[API] Error creating order:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await dbQuery('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('[API] Error updating order status:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        await dbQuery('DELETE FROM orders WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('[API] Error deleting order:', err);
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
        console.error('[API] Razorpay error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[SERVER] Running on port ${PORT}`);
    });
}

module.exports = app;
