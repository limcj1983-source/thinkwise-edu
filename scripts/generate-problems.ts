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
  const styleExamples = [
    {
      name: "스토리형",
      example: `"철수는 AI 검색으로 '공룡은 언제 멸종했나요?'를 물어봤어요. AI는 '공룡은 약 6500만 년 전에 멸종했으며, 주요 원인은 화산 폭발이었습니다. 티라노사우르스는 초식 공룡이었고, 가장 큰 공룡은 브라키오사우르스입니다.'라고 답했어요. 철수는 이 정보를 그대로 과학 숙제에 썼습니다."`
    },
    {
      name: "뉴스 기사형",
      example: `"[어린이 과학 뉴스] 최근 연구에 따르면 식물은 밤에 이산화탄소를 흡수하고 산소를 방출한다고 합니다. 연구팀은 '식물은 24시간 광합성을 하며, 특히 밤에 더 활발하다'고 발표했습니다. 이에 따라 침실에 식물을 두면 밤새 신선한 공기를 마실 수 있습니다."`
    },
    {
      name: "학술형",
      example: `"물의 순환 과정: 물은 태양 에너지로 증발하여 구름이 되고, 구름이 무거워지면 비나 눈으로 내립니다. 증발한 물은 바로 비가 되어 땅으로 떨어지며, 이 과정은 약 2-3일 정도 걸립니다. 지구상의 모든 물은 이렇게 순환하며, 지하수는 이 순환에 포함되지 않습니다."`
    },
    {
      name: "대화형",
      example: `"학생: 선생님, 지구는 왜 둥근가요?
AI 선생님: 좋은 질문이에요! 지구는 자전하면서 원심력 때문에 완벽한 구 모양이 되었어요. 지구는 정확히 동그란 공처럼 생겼고, 어디를 가도 똑같이 평평합니다. 그래서 옛날 사람들도 지구가 둥글다는 것을 쉽게 알 수 있었답니다."`
    }
  ];

  const gradeGuidelines = {
    1: "한글 단어 위주, 짧은 문장, 그림이나 캐릭터 활용",
    2: "쉬운 어휘, 일상 경험 중심",
    3: "기본 과학/사회 개념, 학교 생활 연관",
    4: "교과서 내용 연계, 약간의 전문 용어",
    5: "심화 개념, 비판적 사고 요구",
    6: "복합적 주제, 논리적 추론 필요"
  };

  const randomStyle = styleExamples[Math.floor(Math.random() * styleExamples.length)];

  return `당신은 초등학교 ${params.grade}학년 학생들을 위한 교육 콘텐츠를 만드는 베테랑 교사입니다.

**목표**: AI가 생성한 정보에서 오류를 찾는 비판적 사고력 문제를 만들어주세요.

**학년 수준**: ${params.grade}학년 - ${gradeGuidelines[params.grade as keyof typeof gradeGuidelines]}
**난이도**: ${params.difficulty === 'EASY' ? '쉬움 (1개의 명확한 오류)' : params.difficulty === 'MEDIUM' ? '보통 (1-2개의 오류)' : '어려움 (2개의 미묘한 오류)'}
**주제**: ${params.subject}
**스타일**: ${randomStyle.name}

**핵심 요구사항**:
1. 문제 형식은 "${randomStyle.name}" 스타일로 작성하세요
2. 내용 길이는 300-500자로 충분히 길게 작성하세요
3. ${params.grade}학년이 이해할 수 있는 구체적인 상황이나 사례를 포함하세요
4. 오류는 사실 관계(팩트)에 대한 것이어야 합니다 (예: 숫자, 날짜, 과학적 사실, 역사적 사건 등)
5. 의견이나 가치 판단이 아닌 명확한 사실 오류를 포함하세요

**좋은 예시 참고** (${randomStyle.name} 스타일):
${randomStyle.example}

**피해야 할 오류 유형**:
- 애매한 표현이나 의견
- 너무 쉽게 보이는 오류
- 학년 수준에 맞지 않는 어려운 용어

**다음 JSON 형식으로만 응답하세요**:
{
  "title": "문제 제목 (예: AI가 알려준 공룡 정보, 과학 뉴스 확인하기 등, 30자 이내)",
  "content": "AI가 생성한 것처럼 보이는 본문. 반드시 ${randomStyle.name} 스타일로 작성. 300-500자 분량으로 충분한 맥락과 함께 오류를 자연스럽게 포함하세요.",
  "correctAnswer": "찾아야 할 오류를 구체적으로 설명 (예: 티라노사우르스는 육식 공룡인데 초식 공룡이라고 잘못 설명함, 80자 이내)",
  "explanation": "왜 이것이 오류인지, 올바른 정보는 무엇인지 ${params.grade}학년이 이해할 수 있게 쉽게 설명 (150자 이내)"
}

**중요**: JSON만 응답하고 다른 설명이나 마크다운은 포함하지 마세요.`;
}

// 문제 분해 문제 생성을 위한 프롬프트
function createProblemDecompositionPrompt(params: ProblemGenerationParams): string {
  const styleExamples = [
    {
      name: "스토리 중심",
      example: `"민지는 다음 주 토요일에 친구 10명을 초대해서 생일 파티를 열기로 했어요. 엄마는 '네가 직접 계획을 세워보렴'이라고 하셨어요. 민지는 어떻게 해야 성공적인 파티를 열 수 있을까요?"`
    },
    {
      name: "프로젝트형",
      example: `"4학년 환경 동아리에서 '교실 재활용 캠페인'을 진행하기로 했습니다. 한 달 동안 우리 반 재활용률을 2배로 높이는 것이 목표입니다. 어떻게 계획을 세워야 할까요?"`
    },
    {
      name: "실생활 문제 해결",
      example: `"수호는 매일 아침 학교 가기 전에 시간이 부족해서 엄마에게 혼나요. 일어나서 학교 가기까지 해야 할 일이 많은데, 자꾸 지각을 하게 됩니다. 수호가 시간을 지키려면 어떻게 해야 할까요?"`
    },
    {
      name: "대화/토론형",
      example: `"우리 반 친구들이 체육 시간에 할 운동을 투표로 정하기로 했어요. 하지만 의견이 너무 다양해서 결정하기 어렵습니다. 공정하고 모두가 만족할 수 있는 방법으로 결정하려면 어떻게 해야 할까요?"`
    }
  ];

  const gradeGuidelines = {
    1: "한 번에 한 가지씩, 매우 간단한 2-3단계",
    2: "구체적이고 순차적인 3단계",
    3: "약간의 계획이 필요한 3-4단계",
    4: "우선순위 판단이 필요한 4단계",
    5: "복합적 고려사항이 있는 4-5단계",
    6: "창의적 해결책이 필요한 5단계"
  };

  const randomStyle = styleExamples[Math.floor(Math.random() * styleExamples.length)];

  const stepCount = params.difficulty === 'EASY' ? 3 : params.difficulty === 'MEDIUM' ? 4 : 5;

  return `당신은 초등학교 ${params.grade}학년 학생들을 위한 교육 콘텐츠를 만드는 베테랑 교사입니다.

**목표**: 복잡한 실생활 문제를 논리적 단계로 분해하여 해결하는 사고력 문제를 만들어주세요.

**학년 수준**: ${params.grade}학년 - ${gradeGuidelines[params.grade as keyof typeof gradeGuidelines]}
**난이도**: ${params.difficulty === 'EASY' ? '쉬움 (3단계)' : params.difficulty === 'MEDIUM' ? '보통 (4단계)' : '어려움 (5단계)'}
**주제**: ${params.subject}
**스타일**: ${randomStyle.name}

**핵심 요구사항**:
1. 문제는 "${randomStyle.name}" 스타일로 작성하세요
2. ${params.grade}학년 학생이 실제로 경험할 법한 구체적이고 현실적인 상황이어야 합니다
3. 문제 상황 설명은 300-500자로 충분한 배경과 맥락을 포함하세요
4. 정확히 ${stepCount}개의 단계로 분해하세요
5. 각 단계는 이전 단계를 바탕으로 논리적으로 이어져야 합니다
6. 단계별로 구체적인 행동이나 결정이 필요해야 합니다

**좋은 예시 참고** (${randomStyle.name} 스타일):
${randomStyle.example}

**각 단계의 구성 요소**:
- title: 해당 단계의 핵심을 한 문장으로 (예: "파티 날짜와 시간 정하기")
- description: 이 단계에서 구체적으로 해야 할 일 (100-150자)
- hint: 학생이 막힐 때 도움이 되는 구체적인 힌트 (80자 이내)

**다음 JSON 형식으로만 응답하세요**:
{
  "title": "문제 제목 (예: 생일 파티 계획 세우기, 재활용 캠페인 준비하기 등, 30자 이내)",
  "content": "${randomStyle.name} 스타일로 작성된 문제 상황. 300-500자 분량으로 학생이 상황을 충분히 이해하고 공감할 수 있도록 구체적으로 서술하세요. 인물, 배경, 목표, 제약조건 등을 포함하세요.",
  "correctAnswer": "문제 해결의 핵심 접근 방법 요약 (예: 계획을 단계별로 나누고 우선순위를 정해서 진행한다, 100자 이내)",
  "explanation": "왜 이 문제를 단계별로 나누어 해결해야 하는지, 이러한 접근이 왜 효과적인지 ${params.grade}학년이 이해할 수 있게 설명 (150자 이내)",
  "steps": [
    {
      "stepNumber": 1,
      "title": "첫 번째 단계 이름 (간결하게)",
      "description": "이 단계에서 구체적으로 무엇을 해야 하는지 설명",
      "hint": "이 단계를 수행할 때 도움이 되는 구체적인 팁이나 질문"
    }
    // ... ${stepCount}개 단계를 모두 작성하세요
  ]
}

**중요**:
- 정확히 ${stepCount}개의 단계를 포함하세요
- JSON만 응답하고 다른 설명이나 마크다운은 포함하지 마세요`;
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
      promptType: params.type,
      model: 'gemini-1.5-flash',
      success: true,
      problemId: problem.id,
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
          promptType: typeArg,
          model: 'gemini-1.5-flash',
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
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
