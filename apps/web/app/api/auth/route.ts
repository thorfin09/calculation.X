import { NextRequest, NextResponse } from 'next/server';
import { DB } from '../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || password === undefined) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const authResult = await DB.authenticateUser(username, password);

    if (authResult.success) {
      return NextResponse.json({ success: true, username: username.trim() });
    } else {
      return NextResponse.json({ success: false, error: authResult.error || 'Authentication failed' }, { status: 401 });
    }
  } catch (error) {
    console.error('Failed during authentication route execution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
