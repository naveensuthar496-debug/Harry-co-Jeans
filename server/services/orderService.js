import { db } from '../config/database.js';

export function createOrder({
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
  billingAddress,
  items, // array of { productId, size, quantity }
  paymentMethodCode,
  couponCode,
  customerNotes
}) {
  if (!items || !items.length) {
    throw new Error('Your cart is empty. Please select products to continue.');
  }

  // 1. Fetch store settings
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const s of settingsRows) {
    settings[s.key] = s.value;
  }

  const freeShippingThreshold = parseFloat(settings.free_shipping_threshold || '2499');
  const standardShippingFee = parseFloat(settings.standard_shipping_fee || '149');
  const minOrderGlobal = parseFloat(settings.min_order_value || '0');
  const maxOrderGlobal = parseFloat(settings.max_order_value || '1000000');

  // 2. Validate Payment Method from Database (CRITICAL SERVER-SIDE CONTROL)
  const paymentMethod = db.prepare(`
    SELECT * FROM payment_methods WHERE UPPER(code) = UPPER(?)
  `).get(paymentMethodCode);

  if (!paymentMethod) {
    throw new Error(`The payment method "${paymentMethodCode}" is not recognized.`);
  }

  if (paymentMethod.enabled !== 1) {
    if (paymentMethod.code.toUpperCase() === 'COD') {
      throw new Error('Cash on Delivery is currently unavailable.');
    } else {
      throw new Error(`${paymentMethod.name} is currently unavailable.`);
    }
  }

  // 3. Verify products, sizes, prices, and stock strictly from Database
  let calculatedSubtotal = 0;
  const processedItems = [];

  const getProductStmt = db.prepare("SELECT * FROM products WHERE id = ? AND status = 'active'");
  const getVariantStmt = db.prepare('SELECT * FROM product_variants WHERE product_id = ? AND size = ?');

  for (const item of items) {
    const product = getProductStmt.get(item.productId);
    if (!product) {
      throw new Error(`One or more items in your cart are no longer available.`);
    }

    const variant = getVariantStmt.get(item.productId, item.size);
    if (!variant) {
      throw new Error(`Size "${item.size}" is unavailable for "${product.name}".`);
    }

    const requestedQty = parseInt(item.quantity, 10);
    if (isNaN(requestedQty) || requestedQty <= 0) {
      throw new Error(`Invalid quantity for "${product.name}".`);
    }

    if (variant.stock < requestedQty) {
      if (variant.stock <= 0) {
        throw new Error(`"${product.name}" in Size ${item.size} is OUT OF STOCK.`);
      } else {
        throw new Error(`Only ${variant.stock} units remaining in Size ${item.size} for "${product.name}".`);
      }
    }

    const unitPrice = product.price + (variant.additional_price || 0);
    const lineTotal = unitPrice * requestedQty;
    calculatedSubtotal += lineTotal;

    let parsedImages = [];
    try {
      parsedImages = JSON.parse(product.images);
    } catch (e) {
      parsedImages = [];
    }

    processedItems.push({
      productId: product.id,
      productName: product.name,
      sku: variant.sku || product.sku,
      size: item.size,
      quantity: requestedQty,
      unitPrice: unitPrice,
      totalPrice: lineTotal,
      image: parsedImages[0] || ''
    });
  }

  // 4. Validate Minimum / Maximum order global rules
  if (calculatedSubtotal < minOrderGlobal) {
    throw new Error(`Minimum order value is ₹${minOrderGlobal}. Your subtotal is ₹${calculatedSubtotal}.`);
  }
  if (calculatedSubtotal > maxOrderGlobal) {
    throw new Error(`Maximum order value limit is ₹${maxOrderGlobal}.`);
  }

  // 5. Payment method specific minimum/maximum order check
  if (calculatedSubtotal < paymentMethod.minimum_order_value) {
    throw new Error(`Minimum order total for ${paymentMethod.name} is ₹${paymentMethod.minimum_order_value}.`);
  }
  if (calculatedSubtotal > paymentMethod.maximum_order_value) {
    throw new Error(`Maximum order total for ${paymentMethod.name} is ₹${paymentMethod.maximum_order_value}.`);
  }

  // 6. Coupon validation
  let discountAmount = 0;
  let validatedCoupon = null;
  if (couponCode && couponCode.trim()) {
    const coupon = db.prepare(`
      SELECT * FROM coupons 
      WHERE UPPER(code) = UPPER(?) AND is_active = 1 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).get(couponCode.trim());

    if (coupon) {
      if (calculatedSubtotal >= coupon.min_order_amount) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = (calculatedSubtotal * coupon.discount_value) / 100;
          if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) {
            discountAmount = coupon.max_discount;
          }
        } else {
          discountAmount = coupon.discount_value;
        }
        validatedCoupon = coupon;
      }
    }
  }

  // 7. Calculate Shipping Fee
  let shippingFee = 0;
  if (calculatedSubtotal < freeShippingThreshold) {
    shippingFee = standardShippingFee;
  }

  // 8. Calculate COD fee (if applicable)
  let codFee = 0;
  if (paymentMethod.code.toUpperCase() === 'COD') {
    if (paymentMethod.fee > 0) {
      if (paymentMethod.free_threshold > 0 && calculatedSubtotal >= paymentMethod.free_threshold) {
        codFee = 0;
      } else {
        codFee = paymentMethod.fee;
      }
    }
  }

  // 9. Tax Calculation (if applicable)
  const taxRate = parseFloat(settings.tax_rate || '0');
  const taxInclusive = settings.tax_inclusive === 'true';
  let taxAmount = 0;
  if (taxRate > 0) {
    if (taxInclusive) {
      taxAmount = Math.round((calculatedSubtotal * taxRate) / (100 + taxRate));
    } else {
      taxAmount = Math.round((calculatedSubtotal * taxRate) / 100);
    }
  }

  const totalAmount = Math.max(0, calculatedSubtotal - discountAmount + shippingFee + codFee + (taxInclusive ? 0 : taxAmount));

  // 10. Generate Unique Order Number
  const orderNumber = `HC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  // Determine payment and order status
  const isCod = paymentMethod.code.toUpperCase() === 'COD';
  const paymentStatus = isCod ? 'PENDING' : 'PAID'; // For demo/mock online checkout, marked PAID; for real webhook it can be handled
  const orderStatus = 'CONFIRMED';

  // 11. Atomic Database Transaction: Insert order, decrement inventory, increment coupon count
  const insertOrderStmt = db.prepare(`
    INSERT INTO orders (
      order_number, customer_name, customer_email, customer_phone,
      shipping_address, billing_address, items, subtotal,
      discount_amount, coupon_code, shipping_fee, cod_fee,
      tax_amount, total_amount, payment_method, payment_status,
      order_status, customer_notes
    ) VALUES (
      @order_number, @customer_name, @customer_email, @customer_phone,
      @shipping_address, @billing_address, @items, @subtotal,
      @discount_amount, @coupon_code, @shipping_fee, @cod_fee,
      @tax_amount, @total_amount, @payment_method, @payment_status,
      @order_status, @customer_notes
    )
  `);

  const decrementVariantStockStmt = db.prepare(`
    UPDATE product_variants
    SET stock = stock - ?
    WHERE product_id = ? AND size = ?
  `);

  const decrementProductTotalStockStmt = db.prepare(`
    UPDATE products
    SET total_stock = total_stock - ?
    WHERE id = ?
  `);

  const incrementCouponCountStmt = db.prepare(`
    UPDATE coupons
    SET usage_count = usage_count + 1
    WHERE id = ?
  `);

  let createdOrderId = null;

  const orderTransaction = db.transaction(() => {
    // Insert order
    const result = insertOrderStmt.run({
      order_number: orderNumber,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_address: JSON.stringify(shippingAddress),
      billing_address: billingAddress ? JSON.stringify(billingAddress) : JSON.stringify(shippingAddress),
      items: JSON.stringify(processedItems),
      subtotal: calculatedSubtotal,
      discount_amount: discountAmount,
      coupon_code: validatedCoupon ? validatedCoupon.code : null,
      shipping_fee: shippingFee,
      cod_fee: codFee,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod.code.toUpperCase(),
      payment_status: paymentStatus,
      order_status: orderStatus,
      customer_notes: customerNotes || ''
    });

    createdOrderId = result.lastInsertRowid;

    // Decrement inventory stock
    for (const item of processedItems) {
      decrementVariantStockStmt.run(item.quantity, item.productId, item.size);
      decrementProductTotalStockStmt.run(item.quantity, item.productId);
    }

    // Increment coupon usage
    if (validatedCoupon) {
      incrementCouponCountStmt.run(validatedCoupon.id);
    }
  });

  orderTransaction();

  return {
    orderId: createdOrderId,
    orderNumber,
    customerName,
    customerEmail,
    items: processedItems,
    subtotal: calculatedSubtotal,
    discountAmount,
    shippingFee,
    codFee,
    taxAmount,
    totalAmount,
    paymentMethod: paymentMethod.code.toUpperCase(),
    paymentStatus,
    orderStatus
  };
}
