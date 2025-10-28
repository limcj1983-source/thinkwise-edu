import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not set' }, { status: 500 });
  }

  try {
    // List all available models via REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({
        error: 'Failed to fetch models',
        status: response.status,
        details: error
      }, { status: response.status });
    }

    const data = await response.json();

    // Extract model names and their supported methods
    const models = data.models?.map((model: any) => ({
      name: model.name,
      displayName: model.displayName,
      supportedGenerationMethods: model.supportedGenerationMethods,
      version: model.version
    })) || [];

    // Filter models that support generateContent
    const generateContentModels = models.filter((m: any) =>
      m.supportedGenerationMethods?.includes('generateContent')
    );

    return NextResponse.json({
      success: true,
      totalModels: models.length,
      generateContentModels: generateContentModels.length,
      models: generateContentModels
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Exception occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
