import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/models';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const fit = searchParams.get('fit') || undefined;
    const gender = searchParams.get('gender') || undefined;
    const productType = searchParams.get('productType') || undefined;
    const sort = searchParams.get('sort') || 'default';

    const products = await getProducts({ q, fit, gender, productType, sort, status: 'active' });
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
