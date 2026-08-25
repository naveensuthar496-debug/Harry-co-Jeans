import { NextResponse } from 'next/server';
import { getProductBySlugOrId, updateProduct, deleteProduct } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    const { id } = await params;
    const product = await getProductBySlugOrId(id);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    const product = await updateProduct(id, data);

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    const { id } = await params;
    const deleted = await deleteProduct(id);
    return NextResponse.json({ ok: deleted });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
