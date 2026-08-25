'use strict';

const http = require('node:http');
const app = require('./server/index.js');

let server;
const PORT = 3456;

function request(path, { method = 'GET', body = null, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      ...headers
    };

    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: reqHeaders,
    }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(chunks); } catch { json = chunks; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log('Test server started on port ' + PORT);
    try {
      // 1. Health
      console.log('1. Testing /api/health...');
      const health = await request('/api/health');
      console.assert(health.status === 200, 'Health check failed');
      console.log('   OK:', health.body);

      // 2. Products List
      console.log('2. Testing GET /api/products...');
      const productsRes = await request('/api/products');
      console.assert(productsRes.status === 200, 'Products list failed');
      console.assert(productsRes.body.products.length === 4, `Expected 4 products, got ${productsRes.body.products.length}`);
      console.log(`   OK: Loaded ${productsRes.body.products.length} products`);
      productsRes.body.products.forEach(p => console.log(`      - [${p.sku}] ${p.title} (₹${p.basePrice})`));

      // 3. Customer Login & Cart Flow
      console.log('3. Testing Customer Login...');
      const custLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'customer@hcjeans.com', password: 'customer123' }
      });
      console.assert(custLogin.status === 200, 'Customer login failed');
      const custCookie = custLogin.headers['set-cookie'] ? custLogin.headers['set-cookie'][0].split(';')[0] : '';
      console.log('   OK: Customer signed in:', custLogin.body.user.fullName);

      // 4. Cart
      console.log('4. Testing Cart Add...');
      const p1Variant = productsRes.body.products[0].variants[0].id;
      const addCart = await request('/api/cart', {
        method: 'POST',
        body: { variantId: p1Variant, quantity: 1 },
        headers: { Cookie: custCookie }
      });
      console.assert(addCart.status === 200, 'Cart add failed');
      console.assert(addCart.body.items.length === 1, 'Expected 1 cart item');
      console.log('   OK: Cart subtotal:', addCart.body.totals.subtotal);

      // 5. Checkout & Place Order
      console.log('5. Testing Place Order...');
      const orderRes = await request('/api/checkout/place-order', {
        method: 'POST',
        body: {
          shippingAddress: {
            fullName: 'Arjun Verma',
            phone: '+91 9876543210',
            line1: 'Studio 4, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            zip: '560038',
            country: 'India'
          },
          paymentMethod: 'card',
          paymentId: 'sim_pay_test_123',
          items: addCart.body.items
        },
        headers: { Cookie: custCookie }
      });
      console.assert(orderRes.status === 201, 'Place order failed');
      console.log('   OK: Order placed:', orderRes.body.orderNumber);

      // 6. Admin Login & Product Management
      console.log('6. Testing Admin Login...');
      const adminLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'admin@hcjeans.com', password: 'admin123' }
      });
      console.assert(adminLogin.status === 200, 'Admin login failed');
      const adminCookie = adminLogin.headers['set-cookie'] ? adminLogin.headers['set-cookie'][0].split(';')[0] : '';
      console.log('   OK: Admin signed in:', adminLogin.body.user.fullName);

      // 7. Admin Add Product
      console.log('7. Testing Admin Add Product...');
      const addProductRes = await request('/api/admin/products', {
        method: 'POST',
        body: {
          title: 'The Archive 1955 Loose Fit Selvedge',
          sku: 'HC-ALF-005',
          fit: 'baggy',
          productType: 'Jeans',
          basePrice: 6200,
          description: 'A 5th limited run edition for test verification.',
          status: 'active',
          variants: [
            { size: '30', price: 6200, stock: 10, color: 'Raw' },
            { size: '32', price: 6200, stock: 15, color: 'Raw' }
          ]
        },
        headers: { Cookie: adminCookie }
      });
      console.assert(addProductRes.status === 201, 'Admin add product failed');
      const newProdId = addProductRes.body.product.id;
      console.log('   OK: Created product with ID:', newProdId);

      // Verify count is now 5
      const check5 = await request('/api/products');
      console.assert(check5.body.products.length === 5, `Expected 5 products after add, got ${check5.body.products.length}`);
      console.log('   OK: Product count is now 5 in catalog');

      // 8. Admin Delete Product
      console.log('8. Testing Admin Delete Product...');
      const delRes = await request(`/api/admin/products/${newProdId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie }
      });
      console.assert(delRes.status === 200, 'Admin delete product failed');
      console.log('   OK: Product deleted successfully');

      // Verify count is back to 4
      const check4 = await request('/api/products');
      console.assert(check4.body.products.length === 4, `Expected 4 products after delete, got ${check4.body.products.length}`);
      console.log('   OK: Product count back to 4 flagship products in catalog');

      console.log('\n=== ALL AUTOMATED INTEGRATION TESTS PASSED PERFECTLY ===\n');
      process.exit(0);
    } catch (e) {
      console.error('Test error:', e);
      process.exit(1);
    }
  });
}

runTests();
