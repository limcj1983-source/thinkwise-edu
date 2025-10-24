/**
 * AI 문제 생성 스크립트
 *
 * 사용법:
 * npx tsx scripts/generate-problems.ts --type AI_VERIFICATION --count 10 --grade 3
 * npx tsx scripts/generate-problems.ts --type PROBLEM_DECOMPOSITION --count 5 --grade 5
 */

import { PrismaClient, ProblemType, Difficulty } from '@prisma/client';
import { generateText } from '../lib/gemini';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const prisma = new PrismaClient();

interface ProblemGenerationParams {
  type: ProblemType;
  grade: number;
  difficulty: Difficulty;
  subject: string;
}

interface GeneratedProblem {
  title: string;
  content: string;
  correctAnswer: string;
  explanation: string;
  steps?: {
    stepNumber: number;
    title: string;
    description: string;
    hint: string;
  }[];
}

// AI 검증 문제 생성을 위한 프롬프트
function createAIVerificationPrompt(params: ProblemGenerationParams): string {
  return `당신은 초등학교 ${params.grade}학년 학생들을 위한 교육 콘텐츠를 만드는 전문가입니다.

**목표**: AI가 생성한 정보에서 오류를 찾는 비판적 사고력 문제를 만들어주세요.

**난이도**: ${params.difficulty === 'EASY' ? '쉬움' : params.difficulty === 'MEDIUM' ? '보통' : '어려움'}
**주제**: ${params.subject}

**요구사항**:
1. ${params.grade}학년 수준에 맞는 주제와 어휘를 사용하세요
2. AI가 작성한 것처럼 보이는 짧은 글을 만들되, 의도적으로 1-2개의 사실적 오류를 포함시키세요
3. 오류는 명확하지만 학생들이 주의 깊게 읽어야 찾을 수 있어야 합니다
4. 실생활과 관련된 주제를 선택하세요 (과학, 역사, 일상생활 등)

**다음 JSON 형식으로만 응답하세요**:
{
  "title": "문제 제목 (20자 이내)",
  "content": "AI가 생성한 것처럼 보이는 본문 (오류 포함, 100-200자)",
  "correctAnswer": "찾아야 할 오류 설명 (50자 이내)",
  "explanation": "왜 이것이 오류인지, 올바른 정보는 무엇인지 설명 (100자 이내)"
}

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;
}

// 문제 분해 문제 생성을 위한 프롬프트
function createProblemDecompositionPrompt(params: ProblemGenerationParams): string {
  return `당신은 초등학교 ${params.grade}학년 학생들을 위한 교육 콘텐츠를 만드는 전문가입니다.

**목표**: 복잡한 실생활 문제를 논리적 단계로 분해하는 사고력 문제를 만들어주세요.

**난이도**: ${params.difficulty === 'EASY' ? '쉬움' : params.difficulty === 'MEDIUM' ? '보통' : '어려움'}
**주제**: ${params.subject}

**요구사항**:
1. ${params.grade}학년 학생이 경험할 법한 실생활 문제를 제시하세요
2. 문제 해결을 위해 3-5단계로 나눌 수 있어야 합니다
3. 각 단계는 논리적으로 연결되어야 합니다
4. 학생들이 스스로 생각할 수 있도록 유도하세요

**다음 JSON 형식으로만 응답하세요**:
{
  "title": "문제 제목 (20자 이내)",
  "content": "해결해야 할 실생활 문제 상황 설명 (100-200자)",
  "correctAnswer": "문제 해결의 핵심 포인트 요약 (50자 이내)",
  "explanation": "이 문제를 이렇게 분해해야 하는 이유 (100자 이내)",
  "steps": [
    {
      "stepNumber": 1,
      "title": "첫 번째 단계 제목",
      "description": "첫 번째 단계에서 할 일 설명",
      "hint": "이 단계를 위한 힌트"
    },
    {
      "stepNumber": 2,
      "title": "두 번째 단계 제목",
      "description": "두 번째 단계에서 할 일 설명",
      "hint": "이 단계를 위한 힌트"
    }
  ]
}

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;
}

// JSON 응답에서 코드 블록 제거
function cleanJSONResponse(text: string): string {
  // ```json ... ``` 형태의 코드 블록 제거
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  // 앞뒤 공백 제거
  cleaned = cleaned.trim();
  return cleaned;
}

// AI를 사용하여 문제 생성
async function generateProblem(params: ProblemGenerationParams): Promise<GeneratedProblem> {
  const prompt = params.type === 'AI_VERIFICATION'
    ? createAIVerificationPrompt(params)
    : createProblemDecompositionPrompt(params);

  console.log(`📝 Generating ${params.type} problem for grade ${params.grade}...`);

  const response = await generateText(prompt);
  const cleanedResponse = cleanJSONResponse(response);

  try {
    const problem: GeneratedProblem = JSON.parse(cleanedResponse);
    return problem;
  } catch (error) {
    console.error('Failed to parse AI response:', cleanedResponse);
    throw new Error('Invalid JSON response from AI');
  }
}

// 데이터베이스에 문제 저장
async function saveProblem(
  params: ProblemGenerationParams,
  generated: GeneratedProblem
): Promise<void> {
  const problem = await prisma.problem.create({
    data: {
      type: params.type,
      difficulty: params.difficulty,
      title: generated.title,
      content: generated.content,
      correctAnswer: generated.correctAnswer,
      explanation: generated.explanation,
      subject: params.subject,
      grade: params.grade,
      generatedBy: 'AI',
      aiModel: 'gemini-1.5-flash',
      reviewed: false,
      active: false, // 검토 전까지는 비활성
    },
  });

  // 문제 분해 타입인 경우 단계 정보도 저장
  if (params.type === 'PROBLEM_DECOMPOSITION' && generated.steps) {
    for (const step of generated.steps) {
      await prisma.problemStep.create({
        data: {
          problemId: problem.id,
          stepNumber: step.stepNumber,
          title: step.title,
          description: step.description,
          hint: step.hint,
        },
      });
    }
  }

  // AI 생성 로그 기록
  await prisma.aIGenerationLog.create({
    data: {
      problemType: params.type,
      model: 'gemini-1.5-flash',
      prompt: params.type === 'AI_VERIFICATION'
        ? createAIVerificationPrompt(params).substring(0, 500)
        : createProblemDecompositionPrompt(params).substring(0, 500),
      response: JSON.stringify(generated).substring(0, 1000),
      success: true,
    },
  });

  console.log(`✅ Saved problem: ${generated.title}`);
}

// 주제 목록
const SUBJECTS = {
  AI_VERIFICATION: [
    '동물', '식물', '우주', '역사', '과학', '지리',
    '환경', '건강', '기술', '문화', '스포츠', '음식'
  ],
  PROBLEM_DECOMPOSITION: [
    '학교생활', '친구관계', '가족여행', '용돈관리', '시간관리',
    '숙제계획', '동아리활동', '봉사활동', '생일파티', '운동회'
  ],
};

// 메인 실행 함수
async function main() {
  const args = process.argv.slice(2);

  // 명령줄 인수 파싱
  const typeArg = args.find(arg => arg.startsWith('--type='))?.split('=')[1] as ProblemType || 'AI_VERIFICATION';
  const countArg = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '5');
  const gradeArg = parseInt(args.find(arg => arg.startsWith('--grade='))?.split('=')[1] || '3');

  console.log('🚀 Starting problem generation...');
  console.log(`Type: ${typeArg}, Count: ${countArg}, Grade: ${gradeArg}\n`);

  const subjects = SUBJECTS[typeArg];
  const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

  for (let i = 0; i < countArg; i++) {
    try {
      // 무작위로 주제와 난이도 선택
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

      const params: ProblemGenerationParams = {
        type: typeArg,
        grade: gradeArg,
        difficulty,
        subject,
      };

      const generated = await generateProblem(params);
      await saveProblem(params, generated);

      // API 호출 제한을 피하기 위해 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Error generating problem ${i + 1}:`, error);

      // 실패 로그 기록
      await prisma.aIGenerationLog.create({
        data: {
          problemType: typeArg,
          model: 'gemini-1.5-flash',
          prompt: 'Generation failed before prompt creation',
          response: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        },
      });
    }
  }

  console.log('\n✨ Problem generation completed!');
}

// 스크립트 실행
main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
