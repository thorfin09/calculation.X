import { NextRequest, NextResponse } from 'next/server';
import { DB } from '../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const username = req.headers.get('x-user-username') || '';
    if (!username) {
      return NextResponse.json({ dailyGoalMinutes: 10, soundEnabled: true, name: 'Guest' });
    }
    const settings = await DB.getUser(username);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const username = req.headers.get('x-user-username') || '';
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, dailyGoalMinutes, soundEnabled } = body;

    const updated = await DB.updateUser(username, {
      ...(name !== undefined && { name }),
      ...(dailyGoalMinutes !== undefined && { dailyGoalMinutes: Number(dailyGoalMinutes) }),
      ...(soundEnabled !== undefined && { soundEnabled }),
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
