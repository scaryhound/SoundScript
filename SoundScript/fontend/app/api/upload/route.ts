import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log("POST request received");  // Debug log
    
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
        console.error("No file uploaded");  // Debug log
        return NextResponse.json({ success: false, message: 'No file uploaded' });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the directory exists
    const FILE_DIR = "../audio-uploads";
    await mkdir(FILE_DIR, { recursive: true });  // Create folder if missing

    // Save the file locally
    const FILE_URL = `${FILE_DIR}/${file.name}`;
    await writeFile(FILE_URL, buffer);
    console.log(`File saved locally at ${FILE_URL}`);

    try {
        // Send only the file name to Flask
        const response = await fetch('http://127.0.0.1:5000/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_name: file.name }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from Flask backend:', errorText);
            return NextResponse.json({ success: false, error: errorText });
        }

        // Parse and process the response from Flask
        const result = await response.json();
        console.log('Received transcription from Flask:', result.transcripts);

        // Handle the returned transcription chunks
        const transcriptionChunks = result.transcripts.map((chunk: { chunk: number, transcript: string }) => chunk.transcript);
        const fullTranscription = transcriptionChunks.join(" ");  // Concatenate chunks into one full transcription

        return NextResponse.json({
            success: true,
            transcriptionChunks: result.transcripts,  // Return chunks separately if needed
            fullTranscription: fullTranscription,     // Return concatenated full transcription
        });
    } catch (error) {
        console.error('Error forwarding to Flask:', error);
        return NextResponse.json({ success: false, error: 'An unexpected error occurred' });
    }
}
