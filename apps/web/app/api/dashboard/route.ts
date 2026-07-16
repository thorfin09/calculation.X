import { NextRequest, NextResponse } from 'next/server';
import { DB } from '../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const username = req.headers.get('x-user-username') || '';
    const { searchParams } = new URL(req.url);
    const localDate = searchParams.get('localDate') || '';

    const stats = await DB.getDashboardStats(username, localDate);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
