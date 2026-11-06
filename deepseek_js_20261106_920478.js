const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const ORDERS_FILE = path.join(__dirname, 'orders.json');
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');

/* ================= PRODUCTS ================= */
const products = [
  { id: 1,  name: 'খাঁটি সুন্দরবন মধু',   price: 850,  unit: '৫০০ গ্রাম', img: '🍯', category: 'মধু' },
  { id: 2,  name: 'গাওয়া ঘি',              price: 1200, unit: '৫০০ গ্রাম', img: '🧈', category: 'ঘি' },
  { id: 3,  name: 'মিনিকেট চাল',            price: 75,   unit: '১ কেজি',   img: '🍚', category: 'চাল' },
  { id: 4,  name: 'দেশি মসুর ডাল',          price: 140,  unit: '১ কেজি',   img: '🥣', category: 'ডাল' },
  { id: 5,  name: 'সরিষার তেল',             price: 320,  unit: '১ লিটার',  img: '🫗', category: 'তেল' },
  { id: 6,  name: 'হিলসা মাছ',              price: 950,  unit: '১ কেজি',   img: '🐟', category: 'মাছ' },
  { id: 7,  name: 'দেশি চিনি',              price: 110,  unit: '১ কেজি',   img: '🍬', category: 'মসলা' },
  { id: 8,  name: 'গুঁড়া হলুদ',            price: 90,   unit: '২৫০ গ্রাম', img: '🌿', category: 'মসলা' },
  { id: 9,  name: 'গরম মসলা',               price: 120,  unit: '১০০ গ্রাম', img: '🌶️', category: 'মসলা' },
  { id: 10, name: 'নারিকেল তেল',            price: 280,  unit: '৫০০ মিলি', img: '🥥', category: 'তেল' }
];

/* ================= ROUTES ================= */
app.get('/api/products', (req, res) => res.json(products));

app.post('/api/order', (req, res) => {
  const { name, phone, address, items } = req.body;

  if (!name || !phone || !address || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'সব তথ্য পূরণ করুন।' });
  }
  if (!/^01[3-9]\d{8}$/.test(phone)) {
    return res.status(400).json({ success: false, message: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' });
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = total >= 1000 ? 0 : 60;
  const grandTotal = total + delivery;
  const orderId = 'GB' + Date.now().toString().slice(-6);

  const order = {
    orderId, name, phone, address, items,
    subtotal: total, delivery, total: grandTotal,
    status: 'confirmed', createdAt: new Date().toISOString()
  };

  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  orders.push(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));

  const message =
`✅ অর্ডার কনফার্ম হয়েছে!

অর্ডার আইডি: ${orderId}
প্রিয় ${name}, আপনার অর্ডারটি গ্রহণ করা হয়েছে।

সাবটোটাল: ৳${total}
ডেলিভারি চার্জ: ${delivery === 0 ? 'ফ্রি' : '৳' + delivery}
সর্বমোট: ৳${grandTotal}

আমরা শীঘ্রই ${phone} নম্বরে কল করে অর্ডার কনফার্ম করব।

ধন্যবাদ — ঘরের বাজার 🛒`;

  console.log('\n========== SMS DEMO ==========');
  console.log('To:', phone);
  console.log(message);
  console.log('==============================\n');

  res.json({ success: true, orderId, total: grandTotal, message });
});

/* ============== ADMIN (ডেমো) ============== */
app.get('/api/admin/orders', (req, res) => {
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  res.json(orders.reverse());
});

/* ============== SERVER ============== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running: http://localhost:${PORT}`);
  console.log(`🔐 Admin orders:  http://localhost:${PORT}/api/admin/orders\n`);
});