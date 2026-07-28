const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
app.use(cors());

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('خطأ في الاتصال بقاعدة البيانات:', err.message);
  } else {
    console.log('تم الاتصال بقاعدة البيانات بنجاح.');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    balance REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serviceName TEXT,
    link TEXT,
    quantity INTEGER,
    total REAL,
    status TEXT
  )`);

  db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO users (username, balance) VALUES ('زائر_مميز', 10.00)`);
    }
  });
});

app.get('/api/user', (req, res) => {
  db.get(`SELECT * FROM users LIMIT 1`, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});

app.post('/api/order', (req, res) => {
  const { serviceName, link, quantity, total } = req.body;

  db.get(`SELECT * FROM users LIMIT 1`, (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    if (user.balance < parseFloat(total)) {
      return res.status(400).json({ success: false, message: 'رصيدك لا يكفي!' });
    }

    const newBalance = user.balance - parseFloat(total);

    db.run(`UPDATE users SET balance = ? WHERE id = ?`, [newBalance, user.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      db.run(
        `INSERT INTO orders (serviceName, link, quantity, total, status) VALUES (?, ?, ?, ?, ?)`,
        [serviceName, link, quantity, total, 'Processing'],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            success: true,
            message: 'تم استلام طلبك بنجاح وحفظه في قاعدة البيانات!',
            balance: newBalance,
            newOrder: { id: this.lastID, serviceName, link, quantity, total, status: 'Processing' }
          });
        }
      );
    });
  });
});

app.get('/api/admin/orders', (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.patch('/api/admin/order/:id', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  
  db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, orderId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح' });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`السيرفر يعمل بنجاح على الرابط: http://localhost:${PORT}`);
});