import { NextResponse } from 'next/server';
import { getOrderByNumber, getOrders } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('order');

    if (orderNumber) {
      const order = await getOrderByNumber(orderNumber);
      return NextResponse.json({ order });
    }

    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ orders: [] });
    }

    const orders = await getOrders({});
    return NextResponse.json({ orders: orders.filter(o => o.customerEmail === session.email) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
