'use strict';

const http = require('node:http');

const urls = [
  '/',
  '/shop',
  '/product?slug=1968-vintage-straight-selvedge',
  '/bag',
  '/checkout-address',
  '/checkout-payment',
  '/selvedge',
  '/login',
  '/register',
  '/account',
  '/addresses',
  '/help',
  '/admin/login',
  '/admin/dashboard',
  '/admin/products',
  '/admin/edit-product',
  '/admin/inventory',
  '/admin/orders',
  '/admin/customers',
  '/admin/analytics',
  '/admin/settings'
];

async function checkAll() {
  console.log('Checking all 21 storefront & admin routes on http://localhost:3000...\n');
  let passed = 0;
  for (const path of urls) {
    await new Promise((resolve) => {
      http.get('http://localhost:3000' + path, (res) => {
        let len = 0;
        res.on('data', d => len += d.length);
        res.on('end', () => {
          const ok = res.statusCode === 200;
          console.log(`[${res.statusCode} ${ok ? 'OK ' : 'ERR'}] http://localhost:3000${path} (${len} bytes)`);
          if (ok) passed++;
          resolve();
        });
      }).on('error', (e) => {
        console.log(`[FAILED] ${path}: ${e.message}`);
        resolve();
      });
    });
  }
  console.log(`\nResult: ${passed}/${urls.length} routes returned 200 OK.`);
}

checkAll();
