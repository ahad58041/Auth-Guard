import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(request) {
  const { firstName, lastName, email, password, confirmPassword } = await request.json();

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ success: false, message: 'Passwords do not match' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
  }

  try {
    await connectDB();

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json({ success: false, message: 'Email is already registered' }, { status: 409 });
    }

    let username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    const taken   = await User.findOne({ username });
    if (taken) username = username + Math.floor(Math.random() * 9000 + 1000);

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ firstName, lastName, email, username, password: hashed });

    return NextResponse.json({ success: true, message: 'Account created! Redirecting to sign in...' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
