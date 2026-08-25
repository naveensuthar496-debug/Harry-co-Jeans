// core/config.js — central route map + shared constants.
// Every link/redirect in the app resolves through ROUTES so navigation is
// defined in exactly one place.

export const API_BASE = '/api';

export const ROUTES = {
  // storefront
  home: '/',
  shop: '/shop',
  product: (slug) => `/product?slug=${encodeURIComponent(slug)}`,
  selvedge: '/selvedge',
  bag: '/bag',
  wishlist: '/wishlist',
  checkoutAddress: '/checkout-address',
  checkoutPayment: '/checkout-payment',
  orderConfirmed: (num) => `/order-confirmed?order=${encodeURIComponent(num)}`,
  orderTracking: (num) => `/order-tracking?order=${encodeURIComponent(num)}`,
  account: '/account',
  orderHistory: '/order-history',
  addresses: '/addresses',
  login: '/login',
  register: '/register',
  help: '/help',
  article: (slug) => `/article?slug=${encodeURIComponent(slug)}`,
  // admin
  admin: {
    login: '/admin/login',
    dashboard: '/admin/dashboard',
    products: '/admin/products',
    editProduct: (id) => `/admin/edit-product${id ? `?id=${id}` : ''}`,
    inventory: '/admin/inventory',
    orders: '/admin/orders',
    customers: '/admin/customers',
    analytics: '/admin/analytics',
    promotions: '/admin/promotions',
    createPromotion: (id) => `/admin/create-promotion${id ? `?id=${id}` : ''}`,
    settings: '/admin/settings',
    loyalty: '/admin/loyalty',
    editTiers: '/admin/edit-tiers',
    loyaltyAnalytics: '/admin/loyalty-analytics',
    rewards: '/admin/rewards',
    segmentation: '/admin/segmentation',
    support: '/admin/support',
    kb: '/admin/kb',
    createArticle: (id) => `/admin/create-article${id ? `?id=${id}` : ''}`,
    mDashboard: '/admin/m-dashboard',
    mAnalytics: '/admin/m-analytics',
  },
};

// Canonical option lists used by filters and forms.
export const FITS = ['slim', 'straight', 'relaxed', 'baggy', 'oversized'];
export const PRODUCT_TYPES = ['Jeans', 'Jackets', 'Shirts', 'Accessories'];
export const WAIST_SIZES = ['28', '30', '32', '34', '36', '38', '40'];
export const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low - High' },
  { value: 'price-high', label: 'Price: High - Low' },
];

export const ORDER_STATUS_LABELS = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const CURRENCY = '₹';
