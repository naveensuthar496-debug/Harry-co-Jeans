import { NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const status = searchParams.get('status') || 'all';

    const products = await getProducts({ q, status, limit: 100 });
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    const data = await request.json();
    if (!data.title || !data.basePrice) {
      return NextResponse.json({ error: 'Title and Base Price are required' }, { status: 400 });
    }

    const product = await createProduct(data);
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
