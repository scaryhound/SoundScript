// app/api/get-transcription/[id]/route.ts

import { NextResponse } from 'next/server';
import { dbInstance } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Ensure the ID parameter is available
    if (!params?.id) {
      return NextResponse.json({ error: 'Transcription ID is required' }, { status: 400 });
    }

    // Query to join transcriptions and summarization tables
    const query = `
      SELECT 
        t.id AS transcription_id,
        t.file_name,
        t.date,
        t.transcript,
        s.summary,
        s.keywords
      FROM 
        transcriptions t
      LEFT JOIN 
        summarization s ON t.id = s.transcription_id
      WHERE 
        t.id = ?
    `;
    const statement = dbInstance?.prepare(query);
    const result = statement?.get(params.id); // Fetch transcription and summary by ID

    if (!result) {
      return NextResponse.json({ error: 'Transcription not found' }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching transcription and summary:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
