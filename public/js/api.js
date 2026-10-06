// Centralized API client for Harry & Co E-Commerce Platform
export const API = {
  baseUrl: '/api/v1',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const adminToken = localStorage.getItem('hc_admin_token');
    if (adminToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  },

  // Storefront APIs
  getHomepageSections() {
    return this.request('/content/homepage');
  },

  getNavigation() {
    return this.request('/content/navigation');
  },

  getStoreSettings() {
    return this.request('/content/settings');
  },

  getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/products${qs ? `?${qs}` : ''}`);
  },

  getProduct(identifier) {
    return this.request(`/products/${identifier}`);
  },

  getCategories() {
    return this.request('/products/meta/categories');
  },

  getCollections() {
    return this.request('/products/meta/collections');
  },

  getRecentReviews() {
    return this.request('/content/recent-reviews');
  },

  submitReview(productId, reviewData) {
    return this.request(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },

  getPaymentMethods() {
    return this.request('/payment-methods');
  },

  validateCoupon(code, subtotal) {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    });
  },

  placeOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  trackOrder(orderNumber) {
    return this.request(`/orders/track/${encodeURIComponent(orderNumber)}`);
  },

  // Administrative APIs
  adminLogin(username, password) {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  adminGetMe() {
    return this.request('/admin/me');
  },

  adminGetAnalytics() {
    return this.request('/admin/analytics');
  },

  adminGetProducts() {
    return this.request('/admin/products');
  },

  adminCreateProduct(productData) {
    return this.request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  adminUpdateProduct(id, productData) {
    return this.request(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  adminDeleteProduct(id) {
    return this.request(`/admin/products/${id}`, {
      method: 'DELETE'
    });
  },

  adminUpdateInventory(id, variants) {
    return this.request(`/admin/products/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ variants })
    });
  },

  adminGetOrders(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/admin/orders${qs ? `?${qs}` : ''}`);
  },

  adminUpdateOrderStatus(id, statusData) {
    return this.request(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    });
  },

  adminGetPaymentMethods() {
    return this.request('/admin/payment-methods');
  },

  adminTogglePaymentMethod(id) {
    return this.request(`/admin/payment-methods/${id}/toggle`, {
      method: 'POST'
    });
  },

  adminUpdatePaymentMethod(id, config) {
    return this.request(`/admin/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  },

  adminGetHomepageSections() {
    return this.request('/admin/homepage-sections');
  },

  adminToggleHomepageSection(id) {
    return this.request(`/admin/homepage-sections/${id}/toggle`, {
      method: 'POST'
    });
  },

  adminUpdateHomepageSection(id, sectionData) {
    return this.request(`/admin/homepage-sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sectionData)
    });
  },

  adminReorderHomepageSections(order) {
    return this.request('/admin/homepage-sections/reorder', {
      method: 'PUT',
      body: JSON.stringify({ order })
    });
  },

  adminGetSettings() {
    return this.request('/admin/settings');
  },

  adminUpdateSettings(settings) {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
  },

  adminGetReviews() {
    return this.request('/admin/reviews');
  },

  adminUpdateReviewStatus(id, status) {
    return this.request(`/admin/reviews/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  adminDeleteReview(id) {
    return this.request(`/admin/reviews/${id}`, {
      method: 'DELETE'
    });
  },

  adminSeedSampleCatalog() {
    return this.request('/admin/seed-sample-catalog', {
      method: 'POST'
    });
  },

  adminClearCatalog() {
    return this.request('/admin/clear-catalog', {
      method: 'POST'
    });
  }
};

// Global Toast utility
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
