import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    const db = await getDb();
    const products = await db.collection('products').find({}).toArray();

    const inventory = [];
    products.forEach(p => {
      (p.variants || []).forEach((v, idx) => {
        inventory.push({
          productId: p._id.toString(),
          variantIndex: idx,
          productName: p.title,
          sku: p.sku,
          imageUrl: p.images?.[0]?.url || '',
          size: v.size,
          color: v.color || 'Raw Indigo',
          price: v.price || p.basePrice,
          stock: v.stock || 0,
        });
      });
    });

    return NextResponse.json({ inventory });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    const { productId, size, stock } = await request.json();
    const db = await getDb();

    await db.collection('products').updateOne(
      { _id: new ObjectId(productId), 'variants.size': size },
      { $set: { 'variants.$.stock': Number(stock) || 0 } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
