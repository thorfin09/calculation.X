import { NextRequest, NextResponse } from 'next/server';
import { DB } from '../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const username = req.headers.get('x-user-username') || '';
    
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized: Missing username context' }, { status: 401 });
    }

    const body = await req.json();
    const { durationSeconds, operation, correctCount, totalQuestions, averageTimePerQuestionMs, mistakes, localDate } = body;

    // Validate request
    if (
      durationSeconds === undefined ||
      !operation ||
      correctCount === undefined ||
      totalQuestions === undefined ||
      averageTimePerQuestionMs === undefined
    ) {
      return NextResponse.json({ error: 'Missing required session parameters' }, { status: 400 });
    }

    // Add session
    const session = await DB.addSession(username, {
      durationSeconds,
      operation,
      correctCount,
      totalQuestions,
      averageTimePerQuestionMs,
    }, localDate);

    // Add mistakes if any
    if (Array.isArray(mistakes) && mistakes.length > 0) {
      await DB.addMistakes(username, mistakes);
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Failed to log session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
