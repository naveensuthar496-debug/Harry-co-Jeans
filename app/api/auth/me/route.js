import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ user: null });

    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.id) });
    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName || user.name,
        role: user.role || 'customer',
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints || 0,
      }
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
