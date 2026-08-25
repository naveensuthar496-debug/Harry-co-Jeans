import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    const db = await getDb();
    const customers = await db.collection('users').find({}).project({ passwordHash: 0, password: 0 }).toArray();

    return NextResponse.json({
      customers: customers.map(c => ({
        ...c,
        id: c._id.toString(),
        _id: c._id.toString(),
      }))
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
