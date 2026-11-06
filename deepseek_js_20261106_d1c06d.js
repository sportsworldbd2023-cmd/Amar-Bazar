let products = [];
let cart = [];

/* ============ LOAD PRODUCTS ============ */
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    products = await res.json();
    renderProducts();
  } catch (e) {
    document.getElementById('productGrid').innerHTML =
      '<p style="grid-column:1/-1;text-align:center;color:#d32f2f;">প্রোডাক্ট লোড করতে সমস্যা হয়েছে। সার্ভার চালু আছে কিনা দেখুন।</p>';
  }
}

function renderProducts() {
  document.getElementById('productGrid').innerHTML = products.map(p => `
    <div class="card">
      <div class="emoji">${p.img}</div>
      <span class="cat">${p.category}</span>
      <h3>${p.name}</h3>
      <div class="unit">${p.unit}</div>
      <div class="price">৳${p.price}</div>
      <button onclick="addToCart(${p.id})">কার্টে যোগ করুন</button>
    </div>
  `).join('');
}

/* ============ CART LOGIC ============ */
function addToCart(id) {
  const p = products.find(x => x.id === id);
  const existing = cart.find(x => x.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...p, qty: 1 });
  renderCart();
  showToast(`${p.name} কার্টে যোগ হয়েছে ✅`);
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(x => x.id !== id);
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(x => x.id !== id);
  renderCart();
}

function renderCart() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = count;

  const itemsEl = document.getElementById('cartItems');
  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="empty-cart">🛒<br>কার্ট খালি</div>';
  } else {
    itemsEl.innerHTML = cart.map(i => `
      <div class="cart-item">
        <div class="emoji">${i.img}</div>
        <div class="info">
          <h4>${i.name}</h4>
          <div class="price">৳${i.price} × ${i.qty} = ৳${i.price * i.qty}</div>
        </div>
        <div class="qty-controls">
          <button onclick="changeQty(${i.id}, -1)">−</button>
          <span>${i.qty}</span>
          <button onclick="changeQty(${i.id}, 1)">+</button>
        </div>
        <button class="remove-btn" onclick="removeItem(${i.id})">🗑️</button>
      </div>
    `).join('');
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal === 0 ? 0 : (subtotal >= 1000 ? 0 : 60);
  document.getElementById('subtotal').textContent = subtotal;
  document.getElementById('delivery').textContent = subtotal === 0 ? '৳0' : (delivery === 0 ? 'ফ্রি' : '৳' + delivery);
  document.getElementById('cartTotal').textContent = subtotal + delivery;
}

/* ============ UI HELPERS ============ */
function toggleCart() {
  document.getElementById('cartPanel').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('show');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2000);
}

function closeModal() {
  document.getElementById('confirmModal').classList.remove('show');
  toggleCart();
}

/* ============ ORDER SUBMIT ============ */
document.getElementById('orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (cart.length === 0) return showToast('কার্ট খালি! প্রথমে পণ্য যোগ করুন।');

  const btn = e.target.querySelector('.order-submit');
  btn.disabled = true;
  btn.textContent = '⏳ প্রসেসিং...';

  const body = {
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))
  };

  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('confirmText').textContent = data.message;
      document.getElementById('confirmModal').classList.add('show');
      cart = [];
      renderCart();
      e.target.reset();
    } else {
      showToast('❌ ' + data.message);
    }
  } catch (err) {
    showToast('❌ সার্ভার সমস্যা। আবার চেষ্টা করুন।');
  } finally {
    btn.disabled = false;
    btn.textContent = '✅ অর্ডার কনফার্ম করুন';
  }
});

/* ============ INIT ============ */
loadProducts();
renderCart();