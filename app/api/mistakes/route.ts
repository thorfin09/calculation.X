import { NextRequest, NextResponse } from 'next/server';
import { DB } from '../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const username = req.headers.get('x-user-username') || '';
    if (!username) {
      return NextResponse.json([]);
    }
    const mistakes = await DB.getMistakes(username);
    return NextResponse.json(mistakes);
  } catch (error) {
    console.error('Failed to fetch mistakes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const username = req.headers.get('x-user-username') || '';
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await DB.removeMistake(username, id);
      return NextResponse.json({ success: true, message: `Mistake ${id} removed` });
    } else {
      await DB.clearMistakes(username);
      return NextResponse.json({ success: true, message: 'All mistakes cleared' });
    }
  } catch (error) {
    console.error('Failed to delete mistake(s):', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
