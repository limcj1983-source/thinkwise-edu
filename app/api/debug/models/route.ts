import { NextResponse } from 'next/server';
import { listAvailableModels } from '@/lib/gemini';

export async function GET() {
  try {
    const models = await listAvailableModels();

    return NextResponse.json({
      success: true,
      models,
      count: models.length,
      apiKey: process.env.GEMINI_API_KEY ? 'Set' : 'Not Set'
    });
  } catch (error) {
    console.error('Error listing models:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
