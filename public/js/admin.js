import { API, showToast } from './api.js';

export const AdminState = {
  currentTab: 'dashboard',
  analytics: {},
  products: [],
  categories: [],
  collections: [],
  orders: [],
  paymentMethods: [],
  homepageSections: [],
  navigationMenu: [],
  settings: {},
  reviews: [],
  coupons: []
};

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('hc_admin_token');
  if (!token) {
    window.location.replace('/login?tab=admin');
    return;
  }

  try {
    const me = await API.adminGetMe();
    document.getElementById('admin-profile-name').textContent = me.admin.name || 'Master Tailor & Admin';
    showDashboardScreen();
    await loadInitialAdminData();
    switchTab('dashboard');
  } catch (err) {
    localStorage.removeItem('hc_admin_token');
    window.location.replace('/login?tab=admin');
  }
});

function showLoginScreen() {
  document.getElementById('admin-login-view').style.display = 'flex';
  document.getElementById('admin-app-layout').style.display = 'none';
}

function showDashboardScreen() {
  document.getElementById('admin-login-view').style.display = 'none';
  document.getElementById('admin-app-layout').style.display = 'flex';
}

window.handleAdminLogin = async function(e) {
  e.preventDefault();
  const u = document.getElementById('admin-username-input').value;
  const p = document.getElementById('admin-password-input').value;
  const btn = document.getElementById('admin-login-submit-btn');

  try {
    btn.disabled = true;
    btn.textContent = 'Verifying credentials...';
    const res = await API.adminLogin(u, p);
    localStorage.setItem('hc_admin_token', res.token);
    showToast('Authenticated as Administrator.', 'info');
    showDashboardScreen();
    document.getElementById('admin-profile-name').textContent = res.admin.name;
    await loadInitialAdminData();
    switchTab('dashboard');
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Authenticate & Enter Atelier';
    showToast(err.message || 'Login failed.', 'error');
  }
};

window.handleAdminLogout = function() {
  localStorage.removeItem('hc_admin_token');
  showToast('Logged out of administrative session.', 'info');
  window.location.replace('/login?tab=admin');
};

async function loadInitialAdminData() {
  try {
    const [catsRes, colsRes] = await Promise.all([
      API.getCategories(),
      API.getCollections()
    ]);
    AdminState.categories = catsRes.categories || [];
    AdminState.collections = colsRes.collections || [];
  } catch (e) {
    console.error('Error fetching meta:', e);
  }
}

// Tab Switching
window.switchTab = async function(tabName) {
  AdminState.currentTab = tabName;

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.tab === tabName) link.classList.add('active');
  });

  const titles = {
    dashboard: 'Real-Time Store Dashboard',
    products: 'Products & Inventory Management',
    orders: 'Orders & Fulfillment',
    payments: 'Payment Settings (COD & Gateways)',
    homepage: 'Dynamic Homepage Builder',
    navigation: 'Navigation Menu Builder',
    settings: 'Store Configuration & Policies',
    reviews: 'Patron Reviews Moderation',
    coupons: 'Promotional Coupons'
  };
  document.getElementById('admin-page-title').textContent = titles[tabName] || 'Admin Console';

  // Close mobile sidebar if open
  document.getElementById('admin-sidebar').classList.remove('open');

  const container = document.getElementById('admin-main-container');
  container.innerHTML = '<div style="text-align:center; padding:3rem;"><p style="color:var(--admin-text-muted);">Loading data...</p></div>';

  try {
    switch (tabName) {
      case 'dashboard':
        await renderDashboardTab();
        break;
      case 'products':
        await renderProductsTab();
        break;
      case 'orders':
        await renderOrdersTab();
        break;
      case 'payments':
        await renderPaymentSettingsTab();
        break;
      case 'homepage':
        await renderHomepageBuilderTab();
        break;
      case 'navigation':
        await renderNavigationTab();
        break;
      case 'settings':
        await renderStoreSettingsTab();
        break;
      case 'reviews':
        await renderReviewsTab();
        break;
      case 'coupons':
        await renderCouponsTab();
        break;
    }
  } catch (err) {
    container.innerHTML = `<div class="admin-card"><div class="admin-card-body"><p style="color:var(--admin-danger);">${escapeHtml(err.message)}</p></div></div>`;
  }
};

// 1. DASHBOARD TAB (100% REAL DATABASE ANALYTICS)
async function renderDashboardTab() {
  const container = document.getElementById('admin-main-container');
  const res = await API.adminGetAnalytics();
  const a = res.analytics;
  AdminState.analytics = a;

  container.innerHTML = `
    <!-- Testing Control Banner -->
    <div class="demo-banner">
      <div class="demo-banner-text">
        <strong>Demo & Testing Controls:</strong> Switch easily between a clean 0-product empty state and a populated artisanal denim catalog to verify all states.
      </div>
      <div class="demo-banner-actions">
        <button class="btn-admin btn-admin-secondary" onclick="seedSampleCatalogAction()">
          ◈ Populate Sample Catalog
        </button>
        <button class="btn-admin btn-admin-danger" onclick="clearCatalogAction()">
          ⚠ Clear Catalog (Test 0-Products)
        </button>
      </div>
    </div>

    <!-- KPI Grid (Calculated from Real Database) -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Total Real Revenue</span>
          <div class="kpi-icon-wrap">₹</div>
        </div>
        <div class="kpi-value">₹${Number(a.totalRevenue).toLocaleString('en-IN')}</div>
        <div class="kpi-subtext">Real confirmed/paid orders</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Total Orders Placed</span>
          <div class="kpi-icon-wrap">📦</div>
        </div>
        <div class="kpi-value">${a.totalOrders}</div>
        <div class="kpi-subtext">${a.ordersByStatus.CONFIRMED || 0} Confirmed / ${a.ordersByStatus.DELIVERED || 0} Delivered</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Unique Patrons</span>
          <div class="kpi-icon-wrap">👥</div>
        </div>
        <div class="kpi-value">${a.totalCustomers}</div>
        <div class="kpi-subtext">Verified customer accounts</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Active Denim Cuts</span>
          <div class="kpi-icon-wrap">👖</div>
        </div>
        <div class="kpi-value">${a.totalProducts}</div>
        <div class="kpi-subtext">${a.outOfStockProducts} out of stock</div>
      </div>
    </div>

    <!-- Recent Orders & Low Stock Split -->
    <div style="display:grid; grid-template-columns:1fr; gap:1.75rem;" class="dashboard-split-layout">
      <style>
        @media(min-width: 1024px) {
          .dashboard-split-layout { grid-template-columns: 2fr 1fr !important; }
        }
      </style>

      <!-- Recent Orders Card -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">Recent Customer Orders</h3>
          <button class="btn-admin btn-admin-secondary" onclick="switchTab('orders')">View All</button>
        </div>
        <div class="admin-card-body" style="padding:0;">
          ${a.recentOrders.length === 0 ? `
            <div style="text-align:center; padding:3rem; color:var(--admin-text-muted);">
              No orders placed yet. As patrons checkout, they will display here in real-time.
            </div>
          ` : `
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${a.recentOrders.map(o => `
                    <tr>
                      <td><strong>${escapeHtml(o.order_number)}</strong></td>
                      <td>${escapeHtml(o.customer_name)}<br><small style="color:var(--admin-text-muted);">${escapeHtml(o.customer_email)}</small></td>
                      <td><strong>₹${Number(o.total_amount).toLocaleString('en-IN')}</strong></td>
                      <td>
                        <span class="badge-status" style="background:#f1f5f9; color:#334155;">${escapeHtml(o.payment_method)}</span>
                        <small>(${o.payment_status})</small>
                      </td>
                      <td><span class="badge-status badge-status-${o.order_status}">${o.order_status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>

      <!-- Low Stock Alerts Card -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">Inventory Watchlist</h3>
          <span style="font-size:0.75rem; color:var(--admin-copper); font-weight:700;">≤ 5 in Stock</span>
        </div>
        <div class="admin-card-body" style="padding:0;">
          ${a.lowStockVariants.length === 0 ? `
            <div style="text-align:center; padding:2rem; color:var(--admin-text-muted); font-size:0.85rem;">
              ✓ All denim variants have healthy stock levels.
            </div>
          ` : `
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  ${a.lowStockVariants.map(v => `
                    <tr>
                      <td>${escapeHtml(v.product_name)}</td>
                      <td><strong>${escapeHtml(v.size)}</strong></td>
                      <td><span style="color:${v.stock <= 0 ? 'var(--admin-danger)' : 'var(--admin-warning)'}; font-weight:800;">${v.stock} units</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

// 2. PAYMENT SETTINGS CMS (STRICT SERVER CONTROL & COD TOGGLE)
async function renderPaymentSettingsTab() {
  const container = document.getElementById('admin-main-container');
  const res = await API.adminGetPaymentMethods();
  const methods = res.paymentMethods || [];
  AdminState.paymentMethods = methods;

  container.innerHTML = `
    <div style="max-width:960px;">
      <div style="background:#fff; border:1px solid var(--admin-border); border-radius:var(--radius-md); padding:1.5rem; margin-bottom:1.75rem;">
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--admin-indigo); margin-bottom:0.5rem;">
          Payment Gateways & Cash on Delivery (COD) Configuration
        </h3>
        <p style="font-size:0.85rem; color:var(--admin-text-muted); line-height:1.6;">
          Enable or disable payment options instantly. When an option (such as Cash on Delivery) is disabled, it is <strong>immediately removed from storefront checkout</strong>, and the <strong>backend API will reject any direct submission attempts</strong> with an appropriate error.
        </p>
      </div>

      <!-- Payment Methods Cards -->
      <div>
        ${methods.map(m => `
          <div class="payment-cms-card" id="payment-card-${m.id}">
            <div class="payment-cms-header">
              <div>
                <span class="badge-status" style="background:var(--admin-indigo); color:#fff; margin-bottom:0.4rem;">${escapeHtml(m.code)}</span>
                <div class="payment-cms-title">${escapeHtml(m.name)}</div>
                <p style="font-size:0.8rem; color:var(--admin-text-muted); margin-top:0.25rem;">${escapeHtml(m.description || '')}</p>
              </div>

              <!-- Switch -->
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <span style="font-size:0.85rem; font-weight:700; color:${m.enabled ? '#10b981' : '#94a3b8'};">
                  ${m.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
                <label class="toggle-switch">
                  <input type="checkbox" ${m.enabled ? 'checked' : ''} onchange="togglePaymentMethod(${m.id})">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <!-- Parameters Grid (Min, Max, Fee, Free Threshold) -->
            <div class="payment-cms-grid">
              <div class="admin-form-group">
                <label class="admin-form-label">Minimum Order (₹)</label>
                <input type="number" id="pm-min-${m.id}" class="admin-input" value="${m.minimum_order_value}">
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">Maximum Order (₹)</label>
                <input type="number" id="pm-max-${m.id}" class="admin-input" value="${m.maximum_order_value}">
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">Handling Fee (₹)</label>
                <input type="number" id="pm-fee-${m.id}" class="admin-input" value="${m.fee}">
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">Free Threshold (₹)</label>
                <input type="number" id="pm-free-${m.id}" class="admin-input" value="${m.free_threshold}">
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; margin-top:1rem;">
              <button class="btn-admin btn-admin-secondary" onclick="savePaymentMethodConfig(${m.id})">
                Save ${escapeHtml(m.name)} Settings
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.togglePaymentMethod = async function(id) {
  try {
    const res = await API.adminTogglePaymentMethod(id);
    showToast(res.message, 'info');
    await renderPaymentSettingsTab();
  } catch (err) {
    showToast(err.message || 'Error toggling payment method.', 'error');
  }
};

window.savePaymentMethodConfig = async function(id) {
  const min = document.getElementById(`pm-min-${id}`).value;
  const max = document.getElementById(`pm-max-${id}`).value;
  const fee = document.getElementById(`pm-fee-${id}`).value;
  const free = document.getElementById(`pm-free-${id}`).value;

  try {
    const res = await API.adminUpdatePaymentMethod(id, {
      minimum_order_value: parseFloat(min),
      maximum_order_value: parseFloat(max),
      fee: parseFloat(fee),
      free_threshold: parseFloat(free)
    });
    showToast(res.message, 'info');
  } catch (err) {
    showToast(err.message || 'Error saving settings.', 'error');
  }
};

// 3. HOMEPAGE BUILDER CMS (Reorder, Toggle, Edit Content)
async function renderHomepageBuilderTab() {
  const container = document.getElementById('admin-main-container');
  const res = await API.adminGetHomepageSections();
  const sections = res.sections || [];
  AdminState.homepageSections = sections;

  container.innerHTML = `
    <div style="max-width:960px;">
      <div style="background:#fff; border:1px solid var(--admin-border); border-radius:var(--radius-md); padding:1.5rem; margin-bottom:1.75rem;">
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--admin-indigo); margin-bottom:0.5rem;">
          Dynamic Homepage Section Engine
        </h3>
        <p style="font-size:0.85rem; color:var(--admin-text-muted); line-height:1.6;">
          Enable or disable sections, change banners, edit titles, modify call-to-actions, and reorder sections without editing frontend source code. The storefront renders dynamically according to this exact configuration.
        </p>
      </div>

      <div id="homepage-sections-list">
        ${sections.map((s, idx) => `
          <div class="section-builder-row">
            <div class="section-builder-info">
              <div class="order-badge">${s.display_order}</div>
              <div>
                <span class="badge-status" style="background:#f1f5f9; color:#475569; margin-bottom:0.25rem;">
                  ${escapeHtml(s.section_type)}
                </span>
                <div style="font-size:0.95rem; font-weight:700; color:var(--admin-indigo);">
                  ${escapeHtml(s.title || s.section_key)}
                </div>
                ${s.subtitle ? `<div style="font-size:0.75rem; color:var(--admin-copper);">${escapeHtml(s.subtitle)}</div>` : ''}
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:0.75rem;">
              <!-- Reorder Buttons -->
              <button class="btn-admin btn-admin-secondary" style="padding:0.4rem 0.6rem;" onclick="moveSectionOrder(${s.id}, -1)" ${idx === 0 ? 'disabled' : ''}>▲</button>
              <button class="btn-admin btn-admin-secondary" style="padding:0.4rem 0.6rem;" onclick="moveSectionOrder(${s.id}, 1)" ${idx === sections.length - 1 ? 'disabled' : ''}>▼</button>
              
              <!-- Edit Button -->
              <button class="btn-admin btn-admin-secondary" onclick="openEditSectionModal(${s.id})">Edit Section</button>

              <!-- Toggle Switch -->
              <label class="toggle-switch">
                <input type="checkbox" ${s.enabled ? 'checked' : ''} onchange="toggleHomepageSection(${s.id})">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.toggleHomepageSection = async function(id) {
  try {
    const res = await API.adminToggleHomepageSection(id);
    showToast(res.message, 'info');
    await renderHomepageBuilderTab();
  } catch (err) {
    showToast(err.message || 'Error toggling section.', 'error');
  }
};

window.moveSectionOrder = async function(id, direction) {
  const sections = [...AdminState.homepageSections];
  const idx = sections.findIndex(s => s.id === id);
  if (idx < 0) return;

  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= sections.length) return;

  // Swap display_order
  const temp = sections[idx].display_order;
  sections[idx].display_order = sections[targetIdx].display_order;
  sections[targetIdx].display_order = temp;

  const payload = [
    { id: sections[idx].id, display_order: sections[idx].display_order },
    { id: sections[targetIdx].id, display_order: sections[targetIdx].display_order }
  ];

  try {
    await API.adminReorderHomepageSections(payload);
    await renderHomepageBuilderTab();
    showToast('Section order updated.', 'info');
  } catch (err) {
    showToast(err.message || 'Error reordering sections.', 'error');
  }
};

window.openEditSectionModal = function(id) {
  const section = AdminState.homepageSections.find(s => s.id === id);
  if (!section) return;

  let modal = document.getElementById('admin-edit-section-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-edit-section-modal';
    modal.className = 'admin-modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <h3 class="admin-card-title">Edit Section: ${escapeHtml(section.section_key)}</h3>
        <button onclick="document.getElementById('admin-edit-section-modal').classList.remove('open')" style="font-size:1.5rem;">×</button>
      </div>
      <div class="admin-modal-body">
        <form id="edit-section-form" onsubmit="event.preventDefault(); saveEditedSection(${section.id});">
          <div class="admin-form-group">
            <label class="admin-form-label">Section Title</label>
            <input type="text" id="sec-title" class="admin-input" value="${escapeHtml(section.title || '')}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Subtitle / Pretitle</label>
            <input type="text" id="sec-subtitle" class="admin-input" value="${escapeHtml(section.subtitle || '')}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Description Text</label>
            <textarea id="sec-desc" class="admin-textarea" rows="3">${escapeHtml(section.description || '')}</textarea>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Media / Banner Image URL</label>
            <input type="url" id="sec-image" class="admin-input" value="${escapeHtml(section.image_url || '')}">
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="admin-form-group">
              <label class="admin-form-label">CTA Button Text</label>
              <input type="text" id="sec-cta-text" class="admin-input" value="${escapeHtml(section.cta_text || '')}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">CTA Button URL</label>
              <input type="text" id="sec-cta-url" class="admin-input" value="${escapeHtml(section.cta_url || '')}">
            </div>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Background Style</label>
            <select id="sec-bg-style" class="admin-select">
              <option value="dark" ${section.background_style === 'dark' ? 'selected' : ''}>Dark Indigo (#070d19)</option>
              <option value="light" ${section.background_style === 'light' ? 'selected' : ''}>Light Minimal (#ffffff)</option>
              <option value="indigo" ${section.background_style === 'indigo' ? 'selected' : ''}>Denim Deep Blue (#0f182c)</option>
              <option value="accent" ${section.background_style === 'accent' ? 'selected' : ''}>Copper Accent</option>
            </select>
          </div>
          <div class="admin-modal-footer">
            <button type="button" class="btn-admin btn-admin-secondary" onclick="document.getElementById('admin-edit-section-modal').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn-admin btn-admin-primary">Save Section Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
  modal.classList.add('open');
};

window.saveEditedSection = async function(id) {
  const payload = {
    title: document.getElementById('sec-title').value,
    subtitle: document.getElementById('sec-subtitle').value,
    description: document.getElementById('sec-desc').value,
    image_url: document.getElementById('sec-image').value,
    cta_text: document.getElementById('sec-cta-text').value,
    cta_url: document.getElementById('sec-cta-url').value,
    background_style: document.getElementById('sec-bg-style').value
  };

  try {
    const res = await API.adminUpdateHomepageSection(id, payload);
    document.getElementById('admin-edit-section-modal').classList.remove('open');
    showToast(res.message, 'info');
    await renderHomepageBuilderTab();
  } catch (err) {
    showToast(err.message || 'Error updating section.', 'error');
  }
};

// 4. PRODUCTS & INVENTORY TAB
async function renderProductsTab() {
  const container = document.getElementById('admin-main-container');
  const res = await API.adminGetProducts();
  const prods = res.products || [];
  AdminState.products = prods;

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--admin-indigo);">Atelier Denim Catalog (${prods.length} Products)</h3>
        <p style="font-size:0.8rem; color:var(--admin-text-muted);">Manage cuts, pricing, imagery, and inventory per waist size.</p>
      </div>
      <button class="btn-admin btn-admin-primary" onclick="openProductModal()">+ Add New Denim Product</button>
    </div>

    ${prods.length === 0 ? `
      <div class="admin-card">
        <div class="admin-card-body" style="text-align:center; padding:4rem;">
          <h4 style="font-size:1.2rem; margin-bottom:0.5rem;">0 Products in Database</h4>
          <p style="color:var(--admin-text-muted); font-size:0.85rem; margin-bottom:1.5rem;">
            The store is currently in an empty state. You can add a handcrafted product or use the testing seeder.
          </p>
          <div style="display:flex; gap:0.75rem; justify-content:center;">
            <button class="btn-admin btn-admin-primary" onclick="openProductModal()">Add Product</button>
            <button class="btn-admin btn-admin-secondary" onclick="seedSampleCatalogAction()">Seed Sample Denim</button>
          </div>
        </div>
      </div>
    ` : `
      <div class="admin-card">
        <div class="admin-card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Sizes & Stock</th>
                  <th>Total Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${prods.map(p => {
                  const img = (p.images && p.images[0]) || '';
                  const variantChips = (p.variants || []).map(v => `
                    <span style="display:inline-block; font-size:0.7rem; background:${v.stock <= 0 ? '#fee2e2' : '#f1f5f9'}; color:${v.stock <= 0 ? '#b91c1c' : '#334155'}; padding:2px 6px; border-radius:3px; margin:2px;">
                      ${v.size}: <strong>${v.stock}</strong>
                    </span>
                  `).join('');

                  return `
                    <tr>
                      <td style="display:flex; align-items:center; gap:0.75rem;">
                        <img src="${img}" style="width:45px; height:55px; object-fit:cover; border-radius:4px; background:#eee;">
                        <div>
                          <strong>${escapeHtml(p.name)}</strong>
                          <div style="font-size:0.75rem; color:var(--admin-copper);">${escapeHtml(p.fit || '')}</div>
                        </div>
                      </td>
                      <td><code>${escapeHtml(p.sku)}</code></td>
                      <td><strong>₹${Number(p.price).toLocaleString('en-IN')}</strong></td>
                      <td style="max-width:240px;">${variantChips}</td>
                      <td>
                        <strong style="color:${p.total_stock <= 0 ? 'var(--admin-danger)' : '#10b981'};">
                          ${p.total_stock} units
                        </strong>
                      </td>
                      <td><span class="badge-status badge-status-${p.status}">${p.status}</span></td>
                      <td>
                        <div style="display:flex; gap:0.4rem;">
                          <button class="btn-admin btn-admin-secondary" style="padding:0.3rem 0.6rem;" onclick="openProductModal(${p.id})">Edit</button>
                          <button class="btn-admin btn-admin-secondary" style="padding:0.3rem 0.6rem;" onclick="openStockModal(${p.id})">Stock</button>
                          <button class="btn-admin btn-admin-danger" style="padding:0.3rem 0.6rem;" onclick="deleteProductAction(${p.id})">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `}
  `;
}

window.openProductModal = function(id = null) {
  const p = id ? AdminState.products.find(item => item.id === id) : null;

  let modal = document.getElementById('admin-product-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-product-modal';
    modal.className = 'admin-modal-overlay';
    document.body.appendChild(modal);
  }

  const defaultSizes = p && p.variants && p.variants.length > 0 
    ? p.variants.map(v => `${v.size}:${v.stock}`).join(', ')
    : '28:10, 30:15, 32:20, 34:12, 36:8, 38:4';

  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <h3 class="admin-card-title">${p ? 'Edit Product' : 'Add New Handcrafted Denim'}</h3>
        <button onclick="document.getElementById('admin-product-modal').classList.remove('open')" style="font-size:1.5rem;">×</button>
      </div>
      <div class="admin-modal-body">
        <form id="product-admin-form" onsubmit="event.preventDefault(); saveProductAction(${p ? p.id : 'null'});">
          <div class="admin-form-group">
            <label class="admin-form-label">Product Name *</label>
            <input type="text" id="p-name" required class="admin-input" value="${p ? escapeHtml(p.name) : ''}">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="admin-form-group">
              <label class="admin-form-label">Price (₹) *</label>
              <input type="number" id="p-price" required class="admin-input" value="${p ? p.price : ''}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Compare at Price (₹)</label>
              <input type="number" id="p-compare-price" class="admin-input" value="${p && p.compare_at_price ? p.compare_at_price : ''}">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="admin-form-group">
              <label class="admin-form-label">SKU *</label>
              <input type="text" id="p-sku" required class="admin-input" value="${p ? escapeHtml(p.sku) : ''}" style="text-transform:uppercase;">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Category</label>
              <select id="p-category" class="admin-select">
                <option value="">None</option>
                ${AdminState.categories.map(c => `
                  <option value="${c.id}" ${p && p.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">
            <div class="admin-form-group">
              <label class="admin-form-label">Fit Profile</label>
              <input type="text" id="p-fit" class="admin-input" placeholder="e.g. Slim Tapered" value="${p ? escapeHtml(p.fit || '') : ''}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Wash</label>
              <input type="text" id="p-wash" class="admin-input" placeholder="e.g. Raw Indigo" value="${p ? escapeHtml(p.wash || '') : ''}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Fabric Specs</label>
              <input type="text" id="p-fabric" class="admin-input" placeholder="e.g. 14.5oz Selvedge" value="${p ? escapeHtml(p.fabric || '') : ''}">
            </div>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">Images (Comma-separated URLs)</label>
            <textarea id="p-images" class="admin-textarea" rows="2" placeholder="https://..., https://...">${p && p.images ? p.images.join(', ') : 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=900&auto=format&fit=crop'}</textarea>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">Size Variants & Stock (Format: size:stock, size:stock)</label>
            <input type="text" id="p-variants-str" class="admin-input" value="${defaultSizes}" placeholder="28:10, 30:15, 32:20, 34:10">
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">Description</label>
            <textarea id="p-desc" class="admin-textarea" rows="3">${p ? escapeHtml(p.description || '') : ''}</textarea>
          </div>

          <div style="display:flex; gap:1.5rem; margin-top:1rem;">
            <label><input type="checkbox" id="p-featured" ${p && p.is_featured ? 'checked' : ''}> Featured</label>
            <label><input type="checkbox" id="p-new" ${p && p.is_new_arrival ? 'checked' : ''}> New Arrival</label>
            <label><input type="checkbox" id="p-bestseller" ${p && p.is_bestseller ? 'checked' : ''}> Best Seller</label>
          </div>

          <div class="admin-modal-footer">
            <button type="button" class="btn-admin btn-admin-secondary" onclick="document.getElementById('admin-product-modal').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn-admin btn-admin-primary">${p ? 'Save Product' : 'Create Product'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  modal.classList.add('open');
};

window.saveProductAction = async function(id) {
  const name = document.getElementById('p-name').value;
  const price = document.getElementById('p-price').value;
  const comparePrice = document.getElementById('p-compare-price').value;
  const sku = document.getElementById('p-sku').value;
  const cat = document.getElementById('p-category').value;
  const fit = document.getElementById('p-fit').value;
  const wash = document.getElementById('p-wash').value;
  const fabric = document.getElementById('p-fabric').value;
  const desc = document.getElementById('p-desc').value;
  const imagesRaw = document.getElementById('p-images').value;
  const variantsRaw = document.getElementById('p-variants-str').value;

  const images = imagesRaw.split(',').map(s => s.trim()).filter(Boolean);

  // Parse variants
  const variants = variantsRaw.split(',').map(s => {
    const parts = s.split(':').map(p => p.trim());
    return {
      size: parts[0] || '32',
      stock: parseInt(parts[1], 10) || 0
    };
  }).filter(v => Boolean(v.size));

  const payload = {
    name,
    price: parseFloat(price),
    compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
    sku,
    category_id: cat ? parseInt(cat, 10) : null,
    fit,
    wash,
    fabric,
    description: desc,
    images,
    variants,
    is_featured: document.getElementById('p-featured').checked,
    is_new_arrival: document.getElementById('p-new').checked,
    is_bestseller: document.getElementById('p-bestseller').checked
  };

  try {
    if (id) {
      await API.adminUpdateProduct(id, payload);
      showToast('Product updated successfully.', 'info');
    } else {
      await API.adminCreateProduct(payload);
      showToast('Product loomed & created.', 'info');
    }
    document.getElementById('admin-product-modal').classList.remove('open');
    await renderProductsTab();
  } catch (err) {
    showToast(err.message || 'Error saving product.', 'error');
  }
};

window.deleteProductAction = async function(id) {
  if (!confirm('Are you sure you want to permanently delete this product?')) return;
  try {
    await API.adminDeleteProduct(id);
    showToast('Product deleted.', 'info');
    await renderProductsTab();
  } catch (err) {
    showToast(err.message || 'Error deleting product.', 'error');
  }
};

window.openStockModal = function(id) {
  const p = AdminState.products.find(item => item.id === id);
  if (!p) return;

  let modal = document.getElementById('admin-stock-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-stock-modal';
    modal.className = 'admin-modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="admin-modal" style="max-width:440px;">
      <div class="admin-modal-header">
        <h3 class="admin-card-title">Adjust Inventory: ${escapeHtml(p.name)}</h3>
        <button onclick="document.getElementById('admin-stock-modal').classList.remove('open')" style="font-size:1.5rem;">×</button>
      </div>
      <div class="admin-modal-body">
        <form onsubmit="event.preventDefault(); saveQuickStockAction(${p.id});">
          ${(p.variants || []).map(v => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <span style="font-weight:700;">Size ${escapeHtml(v.size)}</span>
              <input type="number" class="admin-input stock-variant-input" data-variant-id="${v.id}" value="${v.stock}" min="0" style="width:90px; text-align:center;">
            </div>
          `).join('')}
          <div class="admin-modal-footer">
            <button type="submit" class="btn-admin btn-admin-primary">Update Stock</button>
          </div>
        </form>
      </div>
    </div>
  `;
  modal.classList.add('open');
};

window.saveQuickStockAction = async function(productId) {
  const inputs = document.querySelectorAll('.stock-variant-input');
  const variants = Array.from(inputs).map(inp => ({
    id: parseInt(inp.dataset.variantId, 10),
    stock: parseInt(inp.value, 10) || 0
  }));

  try {
    await API.adminUpdateInventory(productId, variants);
    document.getElementById('admin-stock-modal').classList.remove('open');
    showToast('Inventory updated.', 'info');
    await renderProductsTab();
  } catch (err) {
    showToast(err.message || 'Error updating inventory.', 'error');
  }
};

// 5. ORDERS & FULFILLMENT TAB
async function renderOrdersTab() {
  const container = document.getElementById('admin-main-container');
  const res = await API.adminGetOrders();
  const orders = res.orders || [];
  AdminState.orders = orders;

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">All Customer Orders (${orders.length})</h3>
      </div>
      <div class="admin-card-body" style="padding:0;">
        ${orders.length === 0 ? `
          <div style="text-align:center; padding:4rem; color:var(--admin-text-muted);">
            No customer orders recorded yet.
          </div>
        ` : `
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th>Tracking #</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => `
                  <tr>
                    <td><strong>${escapeHtml(o.order_number)}</strong><br><small style="color:var(--admin-text-muted);">${new Date(o.created_at).toLocaleDateString()}</small></td>
                    <td>${escapeHtml(o.customer_name)}<br><small style="color:var(--admin-text-muted);">${escapeHtml(o.customer_phone)}</small></td>
                    <td><strong>₹${Number(o.total_amount).toLocaleString('en-IN')}</strong></td>
                    <td>${escapeHtml(o.payment_method)}</td>
                    <td><span class="badge-status badge-status-${o.payment_status}">${o.payment_status}</span></td>
                    <td><span class="badge-status badge-status-${o.order_status}">${o.order_status}</span></td>
                    <td>${o.tracking_number ? `<code>${escapeHtml(o.tracking_number)}</code>` : '<span style="color:#94a3b8;">None</span>'}</td>
                    <td>
                      <button class="btn-admin btn-admin-secondary" style="padding:0.3rem 0.6rem;" onclick="openOrderModal(${o.id})">Manage</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;
}

window.openOrderModal = function(id) {
  const o = AdminState.orders.find(item => item.id === id);
  if (!o) return;

  let modal = document.getElementById('admin-order-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-order-modal';
    modal.className = 'admin-modal-overlay';
    document.body.appendChild(modal);
  }

  const items = Array.isArray(o.items) ? o.items : [];
  const address = o.shipping_address || {};

  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <h3 class="admin-card-title">Manage Order: ${escapeHtml(o.order_number)}</h3>
        <button onclick="document.getElementById('admin-order-modal').classList.remove('open')" style="font-size:1.5rem;">×</button>
      </div>
      <div class="admin-modal-body">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:1.5rem; background:#f8fafc; padding:1rem; border-radius:var(--radius-sm); font-size:0.85rem;">
          <div>
            <strong>Customer:</strong> ${escapeHtml(o.customer_name)}<br>
            <strong>Email:</strong> ${escapeHtml(o.customer_email)}<br>
            <strong>Phone:</strong> ${escapeHtml(o.customer_phone)}
          </div>
          <div>
            <strong>Shipping Address:</strong><br>
            ${escapeHtml(address.street || '')}, ${escapeHtml(address.city || '')}, ${escapeHtml(address.state || '')} - ${escapeHtml(address.pincode || '')}
          </div>
        </div>

        <h4 style="font-size:0.85rem; font-weight:700; text-transform:uppercase; margin-bottom:0.5rem;">Ordered Items</h4>
        <div style="margin-bottom:1.5rem; border:1px solid var(--admin-border); border-radius:var(--radius-sm); padding:0.75rem;">
          ${items.map(i => `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; font-size:0.85rem;">
              <span>${escapeHtml(i.productName)} (Size ${i.size}) × ${i.quantity}</span>
              <strong>₹${Number(i.totalPrice || (i.unitPrice * i.quantity)).toLocaleString('en-IN')}</strong>
            </div>
          `).join('')}
          <div style="border-top:1px solid var(--admin-border); padding-top:0.5rem; display:flex; justify-content:space-between; font-weight:800;">
            <span>Total Bill:</span>
            <span>₹${Number(o.total_amount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <form onsubmit="event.preventDefault(); updateOrderAction(${o.id});">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="admin-form-group">
              <label class="admin-form-label">Order Status</label>
              <select id="ord-status" class="admin-select">
                <option value="CONFIRMED" ${o.order_status === 'CONFIRMED' ? 'selected' : ''}>CONFIRMED</option>
                <option value="PROCESSING" ${o.order_status === 'PROCESSING' ? 'selected' : ''}>PROCESSING</option>
                <option value="SHIPPED" ${o.order_status === 'SHIPPED' ? 'selected' : ''}>SHIPPED</option>
                <option value="DELIVERED" ${o.order_status === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
                <option value="CANCELLED" ${o.order_status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
              </select>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Payment Status</label>
              <select id="ord-payment-status" class="admin-select">
                <option value="PENDING" ${o.payment_status === 'PENDING' ? 'selected' : ''}>PENDING</option>
                <option value="PAID" ${o.payment_status === 'PAID' ? 'selected' : ''}>PAID</option>
                <option value="REFUNDED" ${o.payment_status === 'REFUNDED' ? 'selected' : ''}>REFUNDED</option>
                <option value="FAILED" ${o.payment_status === 'FAILED' ? 'selected' : ''}>FAILED</option>
              </select>
            </div>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">Courier Tracking Number</label>
            <input type="text" id="ord-tracking" class="admin-input" value="${escapeHtml(o.tracking_number || '')}" placeholder="e.g. BLUEDART-84729104">
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">Atelier Admin Notes</label>
            <input type="text" id="ord-notes" class="admin-input" value="${escapeHtml(o.admin_notes || '')}" placeholder="Internal notes">
          </div>

          <div class="admin-modal-footer">
            <button type="button" class="btn-admin btn-admin-secondary" onclick="document.getElementById('admin-order-modal').classList.remove('open')">Close</button>
            <button type="submit" class="btn-admin btn-admin-primary">Update Order</button>
          </div>
        </form>
      </div>
    </div>
  `;
  modal.classList.add('open');
};

window.updateOrderAction = async function(id) {
  const orderStatus = document.getElementById('ord-status').value;
  const paymentStatus = document.getElementById('ord-payment-status').value;
  const trackingNumber = document.getElementById('ord-tracking').value;
  const adminNotes = document.getElementById('ord-notes').value;

  try {
    await API.adminUpdateOrderStatus(id, {
      orderStatus,
      paymentStatus,
      trackingNumber,
      adminNotes
    });
    document.getElementById('admin-order-modal').classList.remove('open');
    showToast('Order details updated.', 'info');
    await renderOrdersTab();
  } catch (err) {
    showToast(err.message || 'Error updating order.', 'error');
  }
};

// 6. STORE SETTINGS & MAINTENANCE MODE TAB
async function renderStoreSettingsTab() {
  const container = document.getElementById('admin-main-container');
  const res = await API.adminGetSettings();
  const s = res.settings || {};
  AdminState.settings = s;

  container.innerHTML = `
    <div style="max-width:840px;">
      <form id="store-settings-form" onsubmit="event.preventDefault(); saveStoreSettingsAction();">
        <!-- Maintenance Mode Switch -->
        <div class="admin-card" style="border-color:${s.maintenance_mode === 'true' ? 'var(--admin-warning)' : 'var(--admin-border)'};">
          <div class="admin-card-header">
            <div>
              <h3 class="admin-card-title">Atelier Maintenance Mode</h3>
              <p style="font-size:0.78rem; color:var(--admin-text-muted);">
                When enabled, patrons see a luxury maintenance notice, while administrators retain full access.
              </p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="set-maintenance" ${s.maintenance_mode === 'true' ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- General Info -->
        <div class="admin-card">
          <div class="admin-card-header"><h3 class="admin-card-title">General Brand Identity</h3></div>
          <div class="admin-card-body">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div class="admin-form-group">
                <label class="admin-form-label">Brand Name</label>
                <input type="text" id="set-brand" class="admin-input" value="${escapeHtml(s.brand_name || 'HARRY & CO')}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Currency Symbol</label>
                <input type="text" id="set-currency" class="admin-input" value="${escapeHtml(s.currency_symbol || '₹')}">
              </div>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Brand Tagline</label>
              <input type="text" id="set-tagline" class="admin-input" value="${escapeHtml(s.tag_line || '')}">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div class="admin-form-group">
                <label class="admin-form-label">Store Email</label>
                <input type="email" id="set-email" class="admin-input" value="${escapeHtml(s.store_email || '')}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Store Phone</label>
                <input type="text" id="set-phone" class="admin-input" value="${escapeHtml(s.store_phone || '')}">
              </div>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Atelier Physical Address</label>
              <input type="text" id="set-address" class="admin-input" value="${escapeHtml(s.store_address || '')}">
            </div>
          </div>
        </div>

        <!-- Shipping & Tax -->
        <div class="admin-card">
          <div class="admin-card-header"><h3 class="admin-card-title">Shipping & Tax Rules</h3></div>
          <div class="admin-card-body">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div class="admin-form-group">
                <label class="admin-form-label">Free Shipping Threshold (₹)</label>
                <input type="number" id="set-free-ship" class="admin-input" value="${s.free_shipping_threshold || '2499'}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Standard Shipping Fee (₹)</label>
                <input type="number" id="set-std-ship" class="admin-input" value="${s.standard_shipping_fee || '149'}">
              </div>
            </div>
          </div>
        </div>

        <!-- Policies -->
        <div class="admin-card">
          <div class="admin-card-header"><h3 class="admin-card-title">Policies</h3></div>
          <div class="admin-card-body">
            <div class="admin-form-group">
              <label class="admin-form-label">Return & Care Policy</label>
              <textarea id="set-returns" class="admin-textarea" rows="2">${escapeHtml(s.return_policy || '')}</textarea>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Privacy Policy</label>
              <textarea id="set-privacy" class="admin-textarea" rows="2">${escapeHtml(s.privacy_policy || '')}</textarea>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Terms & Conditions</label>
              <textarea id="set-terms" class="admin-textarea" rows="2">${escapeHtml(s.terms_conditions || '')}</textarea>
            </div>
          </div>
        </div>

        <!-- Social Media -->
        <div class="admin-card">
          <div class="admin-card-header"><h3 class="admin-card-title">Social Links</h3></div>
          <div class="admin-card-body">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div class="admin-form-group">
                <label class="admin-form-label">Instagram</label>
                <input type="url" id="set-ig" class="admin-input" value="${escapeHtml(s.social_instagram || '')}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Facebook</label>
                <input type="url" id="set-fb" class="admin-input" value="${escapeHtml(s.social_facebook || '')}">
              </div>
            </div>
          </div>
        </div>

        <button type="submit" class="btn-admin btn-admin-primary" style="padding:0.9rem 2rem; font-size:0.9rem;">
          Save All Store Settings
        </button>
      </form>
    </div>
  `;
}

window.saveStoreSettingsAction = async function() {
  const settings = {
    maintenance_mode: document.getElementById('set-maintenance').checked ? 'true' : 'false',
    brand_name: document.getElementById('set-brand').value,
    currency_symbol: document.getElementById('set-currency').value,
    tag_line: document.getElementById('set-tagline').value,
    store_email: document.getElementById('set-email').value,
    store_phone: document.getElementById('set-phone').value,
    store_address: document.getElementById('set-address').value,
    free_shipping_threshold: document.getElementById('set-free-ship').value,
    standard_shipping_fee: document.getElementById('set-std-ship').value,
    return_policy: document.getElementById('set-returns').value,
    privacy_policy: document.getElementById('set-privacy').value,
    terms_conditions: document.getElementById('set-terms').value,
    social_instagram: document.getElementById('set-ig').value,
    social_facebook: document.getElementById('set-fb').value
  };

  try {
    await API.adminUpdateSettings(settings);
    showToast('Store settings saved successfully.', 'info');
  } catch (err) {
    showToast(err.message || 'Error saving settings.', 'error');
  }
};

// 7. NAVIGATION BUILDER TAB
async function renderNavigationTab() {
  const container = document.getElementById('admin-main-container');
  const res = await API.getNavigation();
  const menu = res.menu || [];

  container.innerHTML = `
    <div style="max-width:840px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div>
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--admin-indigo);">Navigation Menu Items</h3>
          <p style="font-size:0.8rem; color:var(--admin-text-muted);">Manage links displayed in the storefront top navigation header.</p>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Menu Label</th>
                  <th>URL Target</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${menu.map(m => `
                  <tr>
                    <td><strong>${m.display_order}</strong></td>
                    <td><strong>${escapeHtml(m.label)}</strong></td>
                    <td><code>${escapeHtml(m.url)}</code></td>
                    <td>${escapeHtml(m.target_type)}</td>
                    <td><span class="badge-status badge-status-${m.enabled ? 'active' : 'CANCELLED'}">${m.enabled ? 'ACTIVE' : 'HIDDEN'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 8. REVIEWS TAB
async function renderReviewsTab() {
  const container = document.getElementById('admin-main-container');
  const res = await API.adminGetReviews();
  const reviews = res.reviews || [];

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header"><h3 class="admin-card-title">Customer Reviews Moderation (${reviews.length})</h3></div>
      <div class="admin-card-body" style="padding:0;">
        ${reviews.length === 0 ? `
          <div style="text-align:center; padding:3rem; color:var(--admin-text-muted);">No customer reviews submitted yet.</div>
        ` : `
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Patron</th>
                  <th>Rating</th>
                  <th>Feedback</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${reviews.map(r => `
                  <tr>
                    <td><strong>${escapeHtml(r.product_name)}</strong></td>
                    <td>${escapeHtml(r.customer_name)}</td>
                    <td>${'★'.repeat(r.rating)}</td>
                    <td style="max-width:280px;">"${escapeHtml(r.comment)}"</td>
                    <td>${r.verified_purchase ? '✓ Yes' : 'No'}</td>
                    <td><span class="badge-status badge-status-${r.status}">${r.status}</span></td>
                    <td>
                      <button class="btn-admin btn-admin-danger" style="padding:0.25rem 0.5rem;" onclick="deleteReviewAction(${r.id})">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;
}

window.deleteReviewAction = async function(id) {
  if (!confirm('Delete this review?')) return;
  try {
    await API.adminDeleteReview(id);
    showToast('Review removed.', 'info');
    await renderReviewsTab();
  } catch (e) {
    showToast(e.message, 'error');
  }
};

// 9. COUPONS TAB
async function renderCouponsTab() {
  const container = document.getElementById('admin-main-container');
  container.innerHTML = `
    <div style="max-width:840px;">
      <div class="admin-card">
        <div class="admin-card-header"><h3 class="admin-card-title">Promotional Coupons</h3></div>
        <div class="admin-card-body">
          <p style="font-size:0.85rem; color:var(--admin-text-muted); margin-bottom:1rem;">
            Coupons can be applied at storefront checkout for percentage or flat discounts.
          </p>
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Min Order</th>
                  <th>Usage Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>RAWHERITAGE10</code></td>
                  <td>percentage</td>
                  <td>10%</td>
                  <td>₹1,999</td>
                  <td>Active</td>
                </tr>
                <tr>
                  <td><code>HARRYFIRST500</code></td>
                  <td>fixed</td>
                  <td>₹500</td>
                  <td>₹3,500</td>
                  <td>Active</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Demo Controls
window.seedSampleCatalogAction = async function() {
  try {
    const res = await API.adminSeedSampleCatalog();
    showToast(res.message, 'info');
    await loadInitialAdminData();
    await switchTab(AdminState.currentTab);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.clearCatalogAction = async function() {
  if (!confirm('This will clear all products, categories, and orders to test the 0-product empty state. Proceed?')) return;
  try {
    const res = await API.adminClearCatalog();
    showToast(res.message, 'info');
    await loadInitialAdminData();
    await switchTab(AdminState.currentTab);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.toggleMobileSidebar = function() {
  const s = document.getElementById('admin-sidebar');
  if (s) s.classList.toggle('open');
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
