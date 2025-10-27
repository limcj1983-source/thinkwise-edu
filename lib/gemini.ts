import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization to avoid build-time errors
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return genAI;
}

export function getGeminiModel() {
  return getGeminiClient().getGenerativeModel({
    model: 'gemini-1.5-flash'
  });
}

export async function generateText(prompt: string): Promise<string> {
  try {
    console.log('Calling Gemini API...');
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini API response received, length:', text.length);
    return text;
  } catch (error) {
    console.error('Gemini API error:', error);

    // 더 자세한 에러 메시지
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      // API 키 관련 에러인 경우
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        throw new Error('Gemini API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.');
      }

      // Rate limit 에러
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new Error('Gemini API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.');
      }

      throw new Error(`Gemini API 오류: ${error.message}`);
    }

    throw new Error('Failed to generate content from Gemini API');
  }
}
