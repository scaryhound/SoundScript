import { NextRequest, NextResponse } from 'next/server';
import { dbInstance } from '@/lib/db'; // Adjust the path if needed

// POST method handler for saving the transcription
export async function POST(request: NextRequest) {
  // Ensure the dbInstance is initialized before using it
  if (!dbInstance) {
    return NextResponse.json({ success: false, message: 'Database is not initialized' }, { status: 500 });
  }

  try {
    let { file_name, transcript } = await request.json();

    if (!file_name || !transcript) {
      return NextResponse.json({ success: false, message: 'Missing file_name or transcript' }, { status: 400 });
    }

    // Remove any extension (like ".mp3") from the file name
    file_name = file_name.replace(/\.[^/.]+$/, "");

    // Save to the database
    const stmt = dbInstance.prepare(`
      INSERT INTO transcriptions (file_name, transcript)
      VALUES (?, ?)
    `);

    const result = stmt.run(file_name, transcript);

    // Return a success response
    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error("Error saving transcription:", error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
