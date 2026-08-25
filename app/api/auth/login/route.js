import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import { seedMongoIfEmpty } from '@/lib/seed-mongo';

export async function POST(request) {
  try {
    await seedMongoIfEmpty();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = bcrypt.compareSync(password, user.passwordHash || user.password || '');
    if (!valid && password !== user.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName || user.name,
      role: user.role || 'customer',
    });

    const userPayload = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName || user.name,
      role: user.role || 'customer',
      phone: user.phone,
      loyaltyPoints: user.loyaltyPoints || 0,
    };

    const response = NextResponse.json({ user: userPayload });
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
