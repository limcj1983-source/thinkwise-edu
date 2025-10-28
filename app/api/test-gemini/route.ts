import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: 'API key not set',
      message: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.'
    }, { status: 500 });
  }

  try {
    console.log('Fetching available models from Gemini API...');
    console.log('API Key prefix:', apiKey.substring(0, 10) + '...');

    // List all available models via REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', error);
      return NextResponse.json({
        error: 'Failed to fetch models',
        status: response.status,
        details: error,
        apiKeyPrefix: apiKey.substring(0, 10) + '...'
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Total models found:', data.models?.length || 0);

    // Extract model names and their supported methods
    const models = data.models?.map((model: any) => ({
      name: model.name,
      displayName: model.displayName,
      supportedGenerationMethods: model.supportedGenerationMethods,
      version: model.version,
      description: model.description
    })) || [];

    // Filter models that support generateContent
    const generateContentModels = models.filter((m: any) =>
      m.supportedGenerationMethods?.includes('generateContent')
    );

    console.log('Models supporting generateContent:', generateContentModels.length);

    // Extract just the model names for easy copying
    const modelNames = generateContentModels.map((m: any) => {
      // Remove "models/" prefix for easier use
      return m.name.replace('models/', '');
    });

    return NextResponse.json({
      success: true,
      totalModels: models.length,
      generateContentModels: generateContentModels.length,
      message: 'Use one of these model names in GEMINI_MODEL environment variable',
      modelNames: modelNames,
      modelsDetail: generateContentModels
    });
  } catch (error) {
    console.error('Exception:', error);
    return NextResponse.json({
      error: 'Exception occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
