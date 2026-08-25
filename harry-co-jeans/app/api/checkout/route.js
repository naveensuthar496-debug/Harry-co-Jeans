import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/models';

export async function POST(request) {
  try {
    const body = await request.json();
    const { shippingAddress, items, paymentMethod, paymentId, customerEmail } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Shopping bag is empty' }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.line1) {
      return NextResponse.json({ error: 'Shipping address details are required' }, { status: 400 });
    }

    const subtotal = items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
    const shippingFee = 0; // Free shipping
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + shippingFee + tax;

    const order = await createOrder({
      shippingAddress,
      customerEmail,
      items,
      subtotal,
      shippingFee,
      tax,
      total,
      paymentMethod: paymentMethod || 'card',
      paymentId: paymentId || `sim_${Date.now()}`,
    });

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, order }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
