import { NextResponse } from 'next/server';
import { dbInstance } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT t.id, t.file_name, t.date, s.keywords
      FROM transcriptions t
      LEFT JOIN summarization s ON t.id = s.id
      ORDER BY t.date DESC
    `;
    const statement = dbInstance?.prepare(query);
    const transcriptions = statement?.all();

    return NextResponse.json(transcriptions, { status: 200 });
  } catch (error) {
    console.error("Error fetching transcriptions:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
