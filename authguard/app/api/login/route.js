import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
  }

  try {
    await connectDB();

    const user = await User.findOne({
      $or: [{ username }, { email: username.toLowerCase() }]
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const name = user.firstName ? `${user.firstName} ${user.lastName}` : user.username;
    return NextResponse.json({ success: true, message: `Welcome back, ${name}!` });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
