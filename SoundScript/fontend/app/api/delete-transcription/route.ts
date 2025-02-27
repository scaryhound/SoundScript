import { NextResponse } from 'next/server';
import { deleteTranscription } from '@/lib/db';

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Transcription ID is required' }, { status: 400 });
    }

    const success = deleteTranscription(id);

    if (success) {
      return NextResponse.json({ message: 'Transcription deleted successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Transcription not found' }, { status: 404 });
    }
  } catch (error) {
    console.error("Error deleting transcription:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
