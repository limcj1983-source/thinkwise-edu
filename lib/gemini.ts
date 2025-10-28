// REST API 직접 호출 방식으로 변경
// SDK에서 계속 404 에러가 발생하므로 REST API를 직접 사용

export async function generateText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  // 사용할 모델 (환경변수로 변경 가능)
  const model = process.env.GEMINI_MODEL || 'gemini-pro';

  console.log('Calling Gemini REST API with model:', model);
  console.log('API Key prefix:', apiKey.substring(0, 10) + '...');

  try {
    // REST API 직접 호출
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      console.error('Status:', response.status);

      throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // 응답에서 텍스트 추출
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Unexpected response format:', JSON.stringify(data));
      throw new Error('Gemini API returned unexpected response format');
    }

    console.log('Gemini API response received, length:', text.length);
    return text;

  } catch (error) {
    console.error('Gemini API error:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);

      // API 키 관련 에러
      if (error.message.includes('API key') || error.message.includes('API_KEY') || error.message.includes('401')) {
        throw new Error('Gemini API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.');
      }

      // Rate limit 에러
      if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error('Gemini API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.');
      }

      // Model not found 에러
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error(`모델 '${model}'을 찾을 수 없습니다. GEMINI_MODEL 환경변수를 확인하세요. 에러: ${error.message}`);
      }

      throw new Error(`Gemini API 오류: ${error.message}`);
    }

    throw new Error('Failed to generate content from Gemini API');
  }
}
