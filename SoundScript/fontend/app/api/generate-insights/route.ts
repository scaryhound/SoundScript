import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.API_KEY;

if (!apiKey) {
  throw new Error("API_KEY is not defined");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// API Endpoint for generating notes
export async function POST(request: NextRequest) {
  try {
    const { transcription } = await request.json();

    if (!transcription) {
      return NextResponse.json({ error: 'Transcription is required' }, { status: 400 });
    }

    // Generate content from AI
    const contentPrompt = `Based on the following transcription, generate a detailed content description.
    Transcription: ${transcription}`;

    const contentResult = await model.generateContent(contentPrompt);
    const contentResponse = await contentResult.response;
    const contentText = await contentResponse?.text();

    if (!contentText) {
      throw new Error("Failed to generate content description.");
    }

    // Generate concise summary from AI (4-5 lines)
    const summaryPrompt = `Based on the following content description, generate a concise summary in 4-5 lines.
    Content: ${contentText}`;

    const summaryResult = await model.generateContent(summaryPrompt);
    const summaryResponse = await summaryResult.response;
    const summaryText = await summaryResponse?.text();

    if (!summaryText) {
      throw new Error("Failed to generate summary.");
    }

    // Generate main keywords (limit to 3-4)
    const keywordsPrompt = `From the following content, identify only the 3-4 most relevant keywords. Respond with only the keywords, separated by commas.
    Content: ${contentText}`;

    const keywordsResult = await model.generateContent(keywordsPrompt);
    const keywordsResponse = await keywordsResult.response;
    let keywordsText = await keywordsResponse?.text();

    // Process keywords to remove commas and extra spaces
    if (keywordsText) {
      keywordsText = keywordsText.split(',').map(word => word.trim()).join(' ');
    } else {
      throw new Error("Failed to generate keywords.");
    }

    console.log('Generated Summary:', summaryText.trim());
    console.log('Generated Keywords:', keywordsText.trim());

    return NextResponse.json({
      success: true,
      summary: summaryText.trim(),
      keywords: keywordsText.trim()
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
