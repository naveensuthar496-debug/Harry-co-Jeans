// Comprehensive End-to-End Test Suite for Harry & Co E-Commerce Platform
// Tests all requirements: Dynamic content, COD toggling, server-side rejection, analytics, inventory.

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END VERIFICATION SUITE');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- TEST 1: Admin Authentication ---
  console.log('\n--- TEST 1: Admin Authentication ---');
  const loginRes = await fetch(`${BASE_URL}/api/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  }).then(r => r.json());

  assert(loginRes.success === true, 'Admin login succeeds with valid credentials');
  assert(typeof loginRes.token === 'string', 'Admin receives signed JWT token');
  const token = loginRes.token;

  // --- TEST 2: Seed Artisanal Catalog ---
  console.log('\n--- TEST 2: Seed Artisanal Catalog ---');
  const seedRes = await fetch(`${BASE_URL}/api/v1/admin/seed-sample-catalog`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  assert(seedRes.success === true, 'Admin can seed sample denim catalog');

  // --- TEST 3: Dynamic Products Retrieval ---
  console.log('\n--- TEST 3: Dynamic Products & Inventory ---');
  const prodsRes = await fetch(`${BASE_URL}/api/v1/products`).then(r => r.json());
  assert(prodsRes.success === true && prodsRes.count > 0, `Storefront retrieves ${prodsRes.count} products from database`);
  
  const testProduct = prodsRes.products[0];
  assert(Boolean(testProduct.name && testProduct.price && testProduct.sku), 'Product contains valid database fields');
  assert(Array.isArray(testProduct.variants) && testProduct.variants.length > 0, 'Product contains real size variants');

  const targetSizeVariant = testProduct.variants.find(v => v.stock > 0);
  const initialStock = targetSizeVariant.stock;
  console.log(`  ℹ Selected variant: Size ${targetSizeVariant.size} (Initial Stock: ${initialStock})`);

  // --- TEST 4: Dynamic Navigation & Content Sections ---
  console.log('\n--- TEST 4: Dynamic CMS Content & Navigation ---');
  const navRes = await fetch(`${BASE_URL}/api/v1/content/navigation`).then(r => r.json());
  assert(navRes.success === true && navRes.menu.length > 0, `Navigation menu loaded from DB (${navRes.menu.length} links)`);

  const sectionsRes = await fetch(`${BASE_URL}/api/v1/content/homepage`).then(r => r.json());
  assert(sectionsRes.success === true && sectionsRes.sections.length > 0, `Homepage sections loaded from DB (${sectionsRes.sections.length} sections)`);

  // --- TEST 5: Cash on Delivery Enabled Order ---
  console.log('\n--- TEST 5: Cash on Delivery (COD) Order Flow ---');
  const initialMethods = await fetch(`${BASE_URL}/api/v1/payment-methods`).then(r => r.json());
  const hasCod = initialMethods.paymentMethods.some(m => m.code === 'COD');
  assert(hasCod === true, 'COD is active in public payment methods');

  const orderPayload = {
    customerName: 'Siddharth Varma',
    customerEmail: 'siddharth@varma.com',
    customerPhone: '9811223344',
    shippingAddress: { street: '14 Marine Drive', city: 'Mumbai', state: 'MH', pincode: '400020' },
    items: [{ productId: testProduct.id, size: targetSizeVariant.size, quantity: 1 }],
    paymentMethod: 'COD',
    customerNotes: 'Handle with care'
  };

  const orderRes = await fetch(`${BASE_URL}/api/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  }).then(r => r.json());

  assert(orderRes.success === true, 'Customer places COD order successfully');
  assert(orderRes.order.paymentMethod === 'COD', 'Order recorded with paymentMethod = COD');
  assert(orderRes.order.paymentStatus === 'PENDING', 'COD paymentStatus is initially PENDING');
  assert(orderRes.order.orderStatus === 'CONFIRMED', 'Order is CONFIRMED');
  const placedOrderNumber = orderRes.order.orderNumber;
  console.log(`  ℹ Order created: ${placedOrderNumber}`);

  // --- TEST 6: Real Inventory Decrement ---
  console.log('\n--- TEST 6: Real-Time Stock Decrement Verification ---');
  const updatedProdRes = await fetch(`${BASE_URL}/api/v1/products/${testProduct.id}`).then(r => r.json());
  const updatedVariant = updatedProdRes.product.variants.find(v => v.size === targetSizeVariant.size);
  assert(updatedVariant.stock === initialStock - 1, `Stock successfully decremented from ${initialStock} to ${updatedVariant.stock}`);

  // --- TEST 7: Order Tracking by Customer ---
  console.log('\n--- TEST 7: Real-Time Order Tracking ---');
  const trackRes = await fetch(`${BASE_URL}/api/v1/orders/track/${placedOrderNumber}`).then(r => r.json());
  assert(trackRes.success === true, 'Customer can track order by order number');
  assert(trackRes.order.order_number === placedOrderNumber, 'Tracking returns accurate order details');

  // --- TEST 8: Admin Disables COD (Requirement 10 & 11) ---
  console.log('\n--- TEST 8: Admin Disables COD & Server-Side Enforcement ---');
  const codMethod = initialMethods.paymentMethods.find(m => m.code === 'COD');
  
  // Toggle COD off
  const toggleOff = await fetch(`${BASE_URL}/api/v1/admin/payment-methods/${codMethod.id}/toggle`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  assert(toggleOff.enabled === false, 'Admin successfully toggles COD to DISABLED');

  // Verify COD is immediately removed from storefront payment-methods API
  const methodsAfterDisable = await fetch(`${BASE_URL}/api/v1/payment-methods`).then(r => r.json());
  const codStillPresent = methodsAfterDisable.paymentMethods.some(m => m.code === 'COD');
  assert(codStillPresent === false, 'COD is IMMEDIATELY removed from storefront checkout options');

  // Verify backend strictly REJECTS any direct COD attempt
  const rejectedCodOrder = await fetch(`${BASE_URL}/api/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  }).then(r => r.json());

  assert(rejectedCodOrder.success === false, 'Backend strictly rejects COD order when COD is disabled');
  assert(rejectedCodOrder.message === 'Cash on Delivery is currently unavailable.', 'Backend returns exact expected error message: "Cash on Delivery is currently unavailable."');

  // Re-enable COD for normal operations
  await fetch(`${BASE_URL}/api/v1/admin/payment-methods/${codMethod.id}/toggle`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('  ℹ Re-enabled COD for regular operations');

  // --- TEST 9: Real Calculated Database Analytics ---
  console.log('\n--- TEST 9: Genuine Real-Time Analytics (No Fake Numbers) ---');
  const analyticsRes = await fetch(`${BASE_URL}/api/v1/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  const a = analyticsRes.analytics;
  assert(a.totalOrders >= 1, `Analytics reports genuine order count: ${a.totalOrders}`);
  assert(a.totalRevenue > 0, `Analytics reports genuine revenue: ₹${a.totalRevenue}`);
  assert(a.totalCustomers >= 1, `Analytics reports genuine unique customer count: ${a.totalCustomers}`);

  // --- TEST 10: Clear Catalog & Empty State Verification ---
  console.log('\n--- TEST 10: Empty State Verification (Requirement 5 & 17) ---');
  await fetch(`${BASE_URL}/api/v1/admin/clear-catalog`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const emptyProdsRes = await fetch(`${BASE_URL}/api/v1/products`).then(r => r.json());
  assert(emptyProdsRes.count === 0, 'When database has 0 products, API returns empty list [ ] (No fake products)');

  const emptyAnalytics = await fetch(`${BASE_URL}/api/v1/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  assert(emptyAnalytics.analytics.totalOrders === 0 && emptyAnalytics.analytics.totalRevenue === 0, 'When database has 0 orders, Analytics reports ₹0 Revenue and 0 Orders (No fake numbers)');

  // Re-seed sample catalog so store is live and populated
  await fetch(`${BASE_URL}/api/v1/admin/seed-sample-catalog`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('  ℹ Re-seeded sample catalog for live store operation');

  console.log('\n===========================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');
}

runTests().catch(console.error);
