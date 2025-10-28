// 로컬 Gemini API 테스트 스크립트
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('=== Gemini API 테스트 ===\n');

  const apiKey = process.env.GEMINI_API_KEY;
  console.log('1. API 키 확인:', apiKey ? '✓ 설정됨' : '✗ 없음');
  console.log('   API 키 앞 10자:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
  console.log('');

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY가 .env 파일에 설정되지 않았습니다!');
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('2. GoogleGenerativeAI 클라이언트 생성: ✓');
    console.log('');

    // 테스트할 모델 목록
    const modelsToTest = [
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.0-pro'
    ];

    console.log('3. 모델 테스트 시작...\n');

    for (const modelName of modelsToTest) {
      try {
        console.log(`   테스트 중: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent('Say "Hello"');
        const response = await result.response;
        const text = response.text();

        console.log(`   ✓ ${modelName} 성공!`);
        console.log(`     응답: ${text.substring(0, 50)}...\n`);

        // 첫 번째 성공한 모델 발견 시 종료
        console.log(`\n🎉 성공! 사용 가능한 모델: ${modelName}`);
        console.log(`\n이 모델을 코드에 적용하세요!`);
        break;

      } catch (error) {
        console.log(`   ✗ ${modelName} 실패`);
        console.log(`     에러: ${error.message.substring(0, 100)}...\n`);
      }
    }

  } catch (error) {
    console.error('\n❌ 테스트 실패:');
    console.error('에러:', error.message);
    console.error('\n상세:', error);
  }
}

testGemini();
