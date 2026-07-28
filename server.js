const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (index.html, admin.html, etc.) from the root directory
app.use(express.static(__dirname));

// Database connection
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', err.message);
    } else {
        console.log('تم الاتصال بقاعدة البيانات بنجاح.');
    }
});

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    service TEXT,
    quantity TEXT,
    status TEXT DEFAULT 'قيد الانتظار'
)`);

// Root route to explicitly serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin orders API
app.get('/api/admin/orders', (req, res) => {
    db.all(`SELECT * FROM orders ORDER BY id DESC`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Update order status API
app.put('/api/admin/order/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'تم تحديث حالة الطلب بنجاح' });
    });
});

// Server port setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`السيرفر فعال على المنفذ: ${PORT}`);
});
