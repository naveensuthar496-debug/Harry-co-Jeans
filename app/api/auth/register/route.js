import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password, fullName, phone } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection('users').findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: 'Account with that email already exists' }, { status: 409 });
    }

    const newUser = {
      fullName: fullName || 'Valued Member',
      email: email.toLowerCase().trim(),
      passwordHash: bcrypt.hashSync(password, 10),
      role: 'customer',
      phone: phone || null,
      loyaltyPoints: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newUser);

    const userPayload = {
      id: result.insertedId.toString(),
      email: newUser.email,
      fullName: newUser.fullName,
      role: 'customer',
      phone: newUser.phone,
      loyaltyPoints: 100,
    };

    const token = signToken(userPayload);
    const response = NextResponse.json({ user: userPayload }, { status: 201 });
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
