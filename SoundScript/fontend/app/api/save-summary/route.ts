import { NextRequest, NextResponse } from 'next/server';
import { saveSummary } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      console.log("Received body:", body);  // Debug log to inspect request body
  
      const { transcriptionId, summary, keywords } = body;
  
      if (!transcriptionId || !summary || !keywords) {
        console.error("Missing required fields");
        return NextResponse.json({ error: 'Missing required fields: transcriptionId, summary, keywords' }, { status: 400 });
      }
  
      // Save the summary and keywords
      const isSaved = saveSummary(transcriptionId, summary, keywords);
      console.log("Save result:", isSaved);  // Debug log to check save status
  
      if (!isSaved) {
        throw new Error('Failed to save summary and keywords');
      }
  
      return NextResponse.json({ success: true, message: 'Summary and keywords saved successfully' });
    } catch (error) {
      console.error('Error in POST /api/save-summary:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  