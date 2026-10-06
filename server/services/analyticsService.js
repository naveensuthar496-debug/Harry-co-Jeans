import { db } from '../config/database.js';

export function getRealStoreAnalytics() {
  // 1. Total Genuine Revenue (Paid orders + Confirmed/Delivered non-cancelled COD orders)
  const revenueRow = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total_revenue,
           COALESCE(SUM(subtotal), 0) as gross_sales,
           COALESCE(SUM(discount_amount), 0) as total_discounts,
           COALESCE(SUM(shipping_fee), 0) as shipping_revenue,
           COALESCE(SUM(cod_fee), 0) as cod_fee_revenue,
           COUNT(*) as order_count
    FROM orders
    WHERE order_status NOT IN ('CANCELLED')
  `).get();

  // 2. Net revenue (after estimated refunds)
  const refundsRow = db.prepare(`
    SELECT COALESCE(SUM(o.total_amount), 0) as refund_amount, COUNT(*) as refund_count
    FROM orders o
    WHERE o.return_status = 'APPROVED' OR o.order_status = 'RETURNED'
  `).get();

  // 3. COD vs Online split
  const codRow = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount
    FROM orders WHERE payment_method = 'COD' AND order_status NOT IN ('CANCELLED')
  `).get();

  const onlineRow = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount
    FROM orders WHERE payment_method != 'COD' AND order_status NOT IN ('CANCELLED')
  `).get();

  // 4. Order status breakdown
  const statusBreakdown = db.prepare(`
    SELECT order_status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as value
    FROM orders GROUP BY order_status
  `).all();

  // 5. Average Order Value
  const aovRow = db.prepare(`
    SELECT COALESCE(AVG(total_amount), 0) as aov
    FROM orders WHERE order_status NOT IN ('CANCELLED')
  `).get();

  // 6. Total products
  const productStats = db.prepare(`
    SELECT
      COUNT(*) as total_products,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_products,
      SUM(CASE WHEN total_stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
      SUM(CASE WHEN total_stock <= 5 AND total_stock > 0 THEN 1 ELSE 0 END) as low_stock,
      SUM(total_stock) as total_inventory_units
    FROM products
  `).get();

  // 7. Recent orders (last 10)
  const recentOrders = db.prepare(`
    SELECT id, order_number, customer_name, total_amount, order_status, payment_method, created_at
    FROM orders ORDER BY created_at DESC LIMIT 10
  `).all();

  // 8. Best selling products (by revenue)
  const topProducts = db.prepare(`
    SELECT name, sku, purchase_count, views,
           CASE WHEN views > 0 THEN ROUND(purchase_count * 100.0 / views, 1) ELSE 0 END as conversion_rate
    FROM products WHERE status = 'active'
    ORDER BY purchase_count DESC LIMIT 10
  `).all();

  // 9. Daily revenue for last 30 days
  const dailyRevenue = db.prepare(`
    SELECT DATE(created_at) as date,
           COUNT(*) as orders,
           COALESCE(SUM(total_amount), 0) as revenue
    FROM orders
    WHERE order_status NOT IN ('CANCELLED')
      AND created_at >= DATE('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all();

  // 10. Customer analytics
  const customerStats = db.prepare(`
    SELECT
      COUNT(DISTINCT customer_email) as unique_customers,
      COUNT(*) as total_orders,
      COALESCE(AVG(total_amount), 0) as avg_order_value
    FROM orders WHERE order_status NOT IN ('CANCELLED')
  `).get();

  // Repeat customers
  const repeatCustomers = db.prepare(`
    SELECT COUNT(*) as repeat_count FROM (
      SELECT customer_email FROM orders
      WHERE order_status NOT IN ('CANCELLED')
      GROUP BY customer_email HAVING COUNT(*) > 1
    )
  `).get();

  // 11. Return requests
  let returnStats = { total: 0, pending: 0, approved: 0, rejected: 0 };
  try {
    const returnRow = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
      FROM return_requests
    `).get();
    returnStats = returnRow;
  } catch (e) {}

  // 12. Abandoned cart analytics
  let abandonedStats = { total: 0, recovered: 0, total_value: 0 };
  try {
    const cartRow = db.prepare(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN is_recovered = 1 THEN 1 ELSE 0 END) as recovered,
             COALESCE(SUM(cart_value), 0) as total_value
      FROM abandoned_carts
    `).get();
    abandonedStats = cartRow;
  } catch (e) {}

  // 13. Newsletter subscribers
  let newsletterCount = 0;
  try {
    newsletterCount = db.prepare('SELECT COUNT(*) as c FROM newsletter_subscribers WHERE is_active = 1').get().c;
  } catch (e) {}

  // 14. Revenue by category
  const categoryRevenue = db.prepare(`
    SELECT c.name as category_name, COUNT(p.id) as product_count, COALESCE(SUM(p.purchase_count * p.price), 0) as estimated_revenue
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
    GROUP BY c.id ORDER BY estimated_revenue DESC
  `).all();

  // 15. Reviews stats
  const reviewStats = db.prepare(`
    SELECT
      COUNT(*) as total_reviews,
      ROUND(AVG(rating), 1) as avg_rating,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reviews,
      SUM(CASE WHEN verified_purchase = 1 THEN 1 ELSE 0 END) as verified_reviews
    FROM reviews WHERE status != 'rejected'
  `).get();

  // 16. Revenue trend (week over week)
  const thisWeek = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders
    WHERE order_status NOT IN ('CANCELLED')
      AND created_at >= DATE('now', '-7 days')
  `).get();

  const lastWeek = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders
    WHERE order_status NOT IN ('CANCELLED')
      AND created_at >= DATE('now', '-14 days')
      AND created_at < DATE('now', '-7 days')
  `).get();

  const weekGrowth = lastWeek.revenue > 0
    ? Math.round(((thisWeek.revenue - lastWeek.revenue) / lastWeek.revenue) * 100)
    : (thisWeek.revenue > 0 ? 100 : 0);

  // 17. Profit analytics (if cost prices are set)
  const profitRow = db.prepare(`
    SELECT COALESCE(SUM(p.purchase_count * (p.price - p.cost_price)), 0) as estimated_profit
    FROM products p WHERE p.cost_price > 0
  `).get();

  const wishlistCount = (() => {
    try { return db.prepare('SELECT COUNT(*) as c FROM wishlist').get().c; } catch (e) { return 0; }
  })();

  return {
    revenue: {
      total: Math.round(revenueRow.total_revenue),
      gross: Math.round(revenueRow.gross_sales),
      net: Math.round(revenueRow.total_revenue - (refundsRow?.refund_amount || 0)),
      discounts: Math.round(revenueRow.total_discounts),
      shipping: Math.round(revenueRow.shipping_revenue),
      codFees: Math.round(revenueRow.cod_fee_revenue),
      estimatedProfit: Math.round(profitRow?.estimated_profit || 0),
      thisWeek: Math.round(thisWeek.revenue),
      lastWeek: Math.round(lastWeek.revenue),
      weekGrowth
    },
    orders: {
      total: revenueRow.order_count,
      avgOrderValue: Math.round(aovRow.aov),
      codCount: codRow.count,
      codAmount: Math.round(codRow.amount),
      onlineCount: onlineRow.count,
      onlineAmount: Math.round(onlineRow.amount),
      statusBreakdown,
      recent: recentOrders
    },
    products: {
      ...productStats,
      topProducts,
      categoryRevenue
    },
    customers: {
      unique: customerStats.unique_customers,
      totalOrders: customerStats.total_orders,
      repeatCount: repeatCustomers.repeat_count,
      avgOrderValue: Math.round(customerStats.avg_order_value),
      repeatRate: customerStats.unique_customers > 0
        ? Math.round((repeatCustomers.repeat_count / customerStats.unique_customers) * 100)
        : 0
    },
    reviews: reviewStats,
    returns: returnStats,
    abandonedCarts: {
      ...abandonedStats,
      recoveryRate: abandonedStats.total > 0
        ? Math.round((abandonedStats.recovered / abandonedStats.total) * 100)
        : 0
    },
    newsletter: { subscribers: newsletterCount },
    wishlist: { total: wishlistCount },
    dailyRevenue,
    refunds: {
      count: refundsRow?.refund_count || 0,
      amount: Math.round(refundsRow?.refund_amount || 0)
    }
  };
}
