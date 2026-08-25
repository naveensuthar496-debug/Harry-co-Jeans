import { NextResponse } from 'next/server';
import { getProductBySlugOrId } from '@/lib/models';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const product = await getProductBySlugOrId(slug);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
