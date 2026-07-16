import { NextRequest, NextResponse } from 'next/server';
import { DB } from '../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username, email, phone, password, loginInput } = body;

    if (!action) {
      return NextResponse.json({ error: 'Auth action (login or signup) is required' }, { status: 400 });
    }

    if (action === 'signup') {
      if (!username || !email || !phone || !password) {
        return NextResponse.json({ error: 'Username, Email, Phone, and Password are all required for registration' }, { status: 400 });
      }

      const regResult = await DB.registerUser(username, email, phone, password);
      
      if (regResult.success) {
        return NextResponse.json({ success: true, message: 'Account registered successfully! You can now log in.' });
      } else {
        return NextResponse.json({ success: false, error: regResult.error || 'Registration failed' }, { status: 400 });
      }
    } 
    
    if (action === 'login') {
      const identity = loginInput || username; // Support legacy query parameters
      
      if (!identity || !password) {
        return NextResponse.json({ error: 'Login input and password are required' }, { status: 400 });
      }

      const authResult = await DB.authenticateUser(identity, password);

      if (authResult.success && authResult.username) {
        return NextResponse.json({ success: true, username: authResult.username });
      } else {
        return NextResponse.json({ success: false, error: authResult.error || 'Authentication failed' }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    console.error('Failed during authentication route execution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
