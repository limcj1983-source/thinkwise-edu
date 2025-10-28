import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { ProblemType, Difficulty } from '@prisma/client';
import { generateText } from '@/lib/gemini';

// AI 검증 문제 생성 프롬프트
function createAIVerificationPrompt(params: {
  grade: number;
  difficulty: Difficulty;
  subject: string;
}): string {
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

  const gradeGuidelines: Record<number, string> = {
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

**학년 수준**: ${params.grade}학년 - ${gradeGuidelines[params.grade] || "학년별 맞춤"}
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

// 문제 분해 프롬프트
function createProblemDecompositionPrompt(params: {
  grade: number;
  difficulty: Difficulty;
  subject: string;
  category?: string; // 주제 카테고리
}): string {
  // 카테고리별 예시 정의
  const categoryExamples: Record<string, Array<{name: string; example: string}>> = {
    DAILY_LIFE: [
      {
        name: "생일 파티 계획",
        example: `"민지는 다음 주 토요일에 친구 10명을 초대해서 생일 파티를 열기로 했어요. 엄마는 '네가 직접 계획을 세워보렴'이라고 하셨어요. 민지는 어떻게 해야 성공적인 파티를 열 수 있을까요?"`
      },
      {
        name: "시간 관리",
        example: `"수호는 매일 아침 학교 가기 전에 시간이 부족해서 엄마에게 혼나요. 일어나서 학교 가기까지 해야 할 일이 많은데, 자꾸 지각을 하게 됩니다. 수호가 시간을 지키려면 어떻게 해야 할까요?"`
      },
      {
        name: "프로젝트 계획",
        example: `"4학년 환경 동아리에서 '교실 재활용 캠페인'을 진행하기로 했습니다. 한 달 동안 우리 반 재활용률을 2배로 높이는 것이 목표입니다. 어떻게 계획을 세워야 할까요?"`
      }
    ],
    TEXT_SUMMARY: [
      {
        name: "이야기 요약",
        example: `"선생님께서 '흥부와 놀부' 이야기를 읽고 핵심 내용을 정리해서 발표하라고 하셨어요. 긴 이야기를 3분 안에 발표할 수 있도록 요약하려면 어떻게 해야 할까요?"`
      },
      {
        name: "뉴스 기사 정리",
        example: `"사회 시간에 환경 보호에 관한 신문 기사를 읽고 반 친구들에게 설명해야 해요. 어려운 용어도 많고 내용도 길어서 어떻게 정리해야 할지 막막합니다. 어떤 순서로 정리하면 좋을까요?"`
      },
      {
        name: "책 내용 정리",
        example: `"독서 감상문을 쓰기 위해 읽은 책의 내용을 먼저 정리하고 싶어요. 300페이지가 넘는 책인데, 중요한 부분을 찾아서 체계적으로 정리하려면 어떻게 해야 할까요?"`
      }
    ],
    MATH: [
      {
        name: "예산 계획",
        example: `"지훈이네 반에서 학급 문고를 운영하고 있어요. 한 학기 동안 30,000원의 예산으로 새 책을 사려고 합니다. 동화책은 권당 3,500원, 과학책은 권당 5,000원, 역사책은 권당 4,500원이에요. 학생들이 선호하는 분야별 비율을 고려해서 예산 안에서 최대한 다양하게 책을 구매하려면 어떻게 계획해야 할까요?"`
      },
      {
        name: "최적화 문제",
        example: `"학교 운동회에서 우리 반이 400미터 계주를 하게 되었어요. 6명의 선수가 각각 다른 속도로 달릴 수 있는데, 전체 기록을 가장 빠르게 하려면 어떤 순서로 배치해야 할까요? 각 구간의 특성도 고려해야 합니다."`
      },
      {
        name: "비율과 분배",
        example: `"미술 시간에 3명이 한 팀을 이루어 벽화를 그리기로 했어요. 6미터 길이의 벽을 각자의 실력과 시간에 맞춰 공정하게 나누고, 물감도 적절히 분배하려면 어떻게 계획해야 할까요?"`
      }
    ],
    SCIENCE: [
      {
        name: "식물 실험",
        example: `"5학년 과학 시간에 '식물의 성장 조건'을 주제로 실험을 진행하기로 했습니다. 물, 햇빛, 흙의 종류 중에서 어떤 조건이 식물 성장에 가장 큰 영향을 미치는지 알아보려고 해요. 2주 동안 실험을 진행할 계획인데, 어떻게 실험을 설계하고 진행해야 할까요?"`
      },
      {
        name: "물의 성질 탐구",
        example: `"물의 온도에 따라 설탕이 녹는 속도가 어떻게 달라지는지 알아보는 실험을 하려고 해요. 공정한 실험 결과를 얻으려면 어떤 점들을 고려해서 실험을 설계해야 할까요?"`
      },
      {
        name: "자연 현상 관찰",
        example: `"우리 동네 공원의 새들이 계절에 따라 어떻게 변하는지 관찰 일기를 쓰기로 했어요. 4계절 동안 체계적으로 관찰하고 기록하려면 어떤 계획을 세워야 할까요?"`
      }
    ]
  };

  // 카테고리에 맞는 예시 선택 (없으면 일상생활 예시 사용)
  const examples = categoryExamples[params.category || 'DAILY_LIFE'] || categoryExamples.DAILY_LIFE;
  const randomStyle = examples[Math.floor(Math.random() * examples.length)];

  const gradeGuidelines: Record<number, string> = {
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

**학년 수준**: ${params.grade}학년 - ${gradeGuidelines[params.grade] || "학년별 맞춤"}
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

// 객관식 문제 생성 프롬프트
function createMultipleChoicePrompt(params: {
  grade: number;
  difficulty: Difficulty;
  subject: string;
  language: string;
}): string {
  const isEnglish = params.language === 'en';

  if (isEnglish) {
    return `You are an experienced teacher creating educational content for elementary grade ${params.grade} students.

**Goal**: Create a multiple-choice question that tests critical thinking and knowledge.

**Grade Level**: Grade ${params.grade}
**Difficulty**: ${params.difficulty === 'EASY' ? 'Easy' : params.difficulty === 'MEDIUM' ? 'Medium' : 'Hard'}
**Subject**: ${params.subject}

**Requirements**:
1. Create a clear, age-appropriate question
2. Provide 4 answer choices (A, B, C, D)
3. Only ONE correct answer
4. Make incorrect options plausible but clearly wrong
5. Question should be 100-200 characters
6. Each option should be 30-80 characters

**Respond ONLY with this JSON format**:
{
  "title": "Question title (max 50 chars)",
  "content": "The question text asking what students need to determine",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctAnswer": "A" or "B" or "C" or "D",
  "explanation": "Why this answer is correct and others are wrong (max 200 chars)"
}

**Important**: Return ONLY valid JSON, no markdown or explanations.`;
  }

  return `당신은 초등학교 ${params.grade}학년 학생들을 위한 교육 콘텐츠를 만드는 베테랑 교사입니다.

**목표**: 비판적 사고력과 지식을 테스트하는 객관식 문제를 만들어주세요.

**학년 수준**: ${params.grade}학년
**난이도**: ${params.difficulty === 'EASY' ? '쉬움' : params.difficulty === 'MEDIUM' ? '보통' : '어려움'}
**주제**: ${params.subject}

**핵심 요구사항**:
1. 명확하고 학년 수준에 맞는 질문 작성
2. 4개의 선택지 제공 (A, B, C, D)
3. 정답은 1개만
4. 오답은 그럴듯하지만 명확히 틀린 내용
5. 질문은 100-200자
6. 각 선택지는 30-80자

**다음 JSON 형식으로만 응답하세요**:
{
  "title": "문제 제목 (50자 이내)",
  "content": "학생들이 판단해야 할 내용을 묻는 질문 본문",
  "options": ["선택지 A 내용", "선택지 B 내용", "선택지 C 내용", "선택지 D 내용"],
  "correctAnswer": "A" 또는 "B" 또는 "C" 또는 "D",
  "explanation": "왜 이 답이 정답이고 다른 것들은 오답인지 설명 (200자 이내)"
}

**중요**: JSON만 응답하고 다른 설명이나 마크다운은 포함하지 마세요.`;
}

// OX 퀴즈 생성 프롬프트
function createTrueFalsePrompt(params: {
  grade: number;
  difficulty: Difficulty;
  subject: string;
  language: string;
}): string {
  const isEnglish = params.language === 'en';

  if (isEnglish) {
    return `You are an experienced teacher creating educational content for elementary grade ${params.grade} students.

**Goal**: Create a True/False question that tests knowledge and critical thinking.

**Grade Level**: Grade ${params.grade}
**Difficulty**: ${params.difficulty === 'EASY' ? 'Easy' : params.difficulty === 'MEDIUM' ? 'Medium' : 'Hard'}
**Subject**: ${params.subject}

**Requirements**:
1. Create a clear statement that is definitely true or false
2. Statement should be 100-250 characters
3. Avoid ambiguous statements
4. Test actual knowledge, not trick questions

**Respond ONLY with this JSON format**:
{
  "title": "Question title (max 50 chars)",
  "content": "A clear statement that is either true or false",
  "correctAnswer": "True" or "False",
  "explanation": "Why the statement is true/false with accurate information (max 200 chars)"
}

**Important**: Return ONLY valid JSON, no markdown or explanations.`;
  }

  return `당신은 초등학교 ${params.grade}학년 학생들을 위한 교육 콘텐츠를 만드는 베테랑 교사입니다.

**목표**: 지식과 비판적 사고력을 테스트하는 OX 퀴즈를 만들어주세요.

**학년 수준**: ${params.grade}학년
**난이도**: ${params.difficulty === 'EASY' ? '쉬움' : params.difficulty === 'MEDIUM' ? '보통' : '어려움'}
**주제**: ${params.subject}

**핵심 요구사항**:
1. 명확하게 참 또는 거짓으로 판단할 수 있는 진술 작성
2. 진술은 100-250자
3. 애매한 표현 피하기
4. 실제 지식을 테스트하는 문제 (트릭 문제 X)

**다음 JSON 형식으로만 응답하세요**:
{
  "title": "문제 제목 (50자 이내)",
  "content": "참 또는 거짓으로 판단해야 할 명확한 진술",
  "correctAnswer": "O" 또는 "X",
  "explanation": "왜 이 진술이 참/거짓인지 정확한 정보와 함께 설명 (200자 이내)"
}

**중요**: JSON만 응답하고 다른 설명이나 마크다운은 포함하지 마세요.`;
}

// JSON 응답 정리
function cleanJSONResponse(text: string): string {
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  cleaned = cleaned.trim();
  return cleaned;
}

// AnswerFormat 타입 추가
type AnswerFormat = 'SHORT_ANSWER' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

// AI 문제 생성 함수
async function generateProblemWithAI(params: {
  type: ProblemType;
  answerFormat: AnswerFormat;
  difficulty: Difficulty;
  grade: number;
  subject?: string;
  language?: string;
  decompositionCategory?: string;
}): Promise<any> {
  const language = params.language || 'ko';

  // 주제가 없으면 랜덤 선택 (문제 카테고리에 따라)
  const subjects = params.subject
    ? [params.subject]
    : params.type === 'AI_VERIFICATION'
    ? (language === 'en'
        ? ['Animals', 'Plants', 'Space', 'History', 'Science', 'Geography', 'Environment', 'Health', 'Technology', 'Culture']
        : ['동물', '식물', '우주', '역사', '과학', '지리', '환경', '건강', '기술', '문화'])
    : (language === 'en'
        ? ['School Life', 'Friendship', 'Family Trip', 'Money Management', 'Time Management', 'Homework Planning', 'Club Activities', 'Volunteer Work']
        : ['학교생활', '친구관계', '가족여행', '용돈관리', '시간관리', '숙제계획', '동아리활동', '봉사활동']);

  const subject = params.subject || subjects[Math.floor(Math.random() * subjects.length)];

  // 프롬프트 생성: 문제 카테고리 + 답변 형식 조합
  let prompt: string;

  // 먼저 기본 문제 프롬프트를 가져옴
  let basePrompt: string;
  if (params.type === 'AI_VERIFICATION') {
    basePrompt = createAIVerificationPrompt({ grade: params.grade, difficulty: params.difficulty, subject });
  } else {
    basePrompt = createProblemDecompositionPrompt({
      grade: params.grade,
      difficulty: params.difficulty,
      subject,
      category: params.decompositionCategory
    });
  }

  // 답변 형식에 따라 프롬프트 수정
  if (params.answerFormat === 'MULTIPLE_CHOICE') {
    // 객관식
    if (params.type === 'PROBLEM_DECOMPOSITION') {
      // 문제 분해 + 객관식: 각 단계마다 선택지 필요
      prompt = basePrompt.replace(
        '**다음 JSON 형식으로만 응답하세요**:',
        '**답변 형식**: 각 단계마다 4지선다 객관식 (A, B, C, D)\n\n**다음 JSON 형식으로만 응답하세요**:'
      ).replace(
        '"hint": "이 단계를 수행할 때 도움이 되는 구체적인 팁이나 질문"',
        '"hint": "이 단계를 수행할 때 도움이 되는 구체적인 팁이나 질문",\n      "options": ["선택지 A (30-60자)", "선택지 B", "선택지 C", "선택지 D"],\n      "correctAnswer": "A, B, C, D 중 정답 (예: \\"A\\")"'
      );
    } else {
      // AI 검증 + 객관식
      prompt = basePrompt.replace(
        '**다음 JSON 형식으로만 응답하세요**:',
        '**답변 형식**: 4지선다 객관식 (A, B, C, D)\n\n**다음 JSON 형식으로만 응답하세요**:'
      ).replace(
        '"correctAnswer": "찾아야 할 오류를 구체적으로 설명',
        '"options": ["선택지 A 내용 (30-80자)", "선택지 B 내용", "선택지 C 내용", "선택지 D 내용"],\n  "correctAnswer": "A, B, C, D 중 정답 (예: \\"A\\")'
      );
    }
  } else if (params.answerFormat === 'TRUE_FALSE') {
    // OX 퀴즈
    if (params.type === 'PROBLEM_DECOMPOSITION') {
      // 문제 분해 + OX: 각 단계마다 O/X 정답 필요
      prompt = basePrompt.replace(
        '**다음 JSON 형식으로만 응답하세요**:',
        '**답변 형식**: 각 단계마다 OX 퀴즈 (참 또는 거짓)\n\n**다음 JSON 형식으로만 응답하세요**:'
      ).replace(
        '"hint": "이 단계를 수행할 때 도움이 되는 구체적인 팁이나 질문"',
        '"hint": "이 단계를 수행할 때 도움이 되는 구체적인 팁이나 질문",\n      "correctAnswer": "O 또는 X"'
      );
    } else {
      // AI 검증 + OX
      prompt = basePrompt.replace(
        '**다음 JSON 형식으로만 응답하세요**:',
        '**답변 형식**: OX 퀴즈 (참 또는 거짓)\n\n**다음 JSON 형식으로만 응답하세요**:'
      ).replace(
        '"correctAnswer": "찾아야 할 오류를 구체적으로 설명',
        '"correctAnswer": "O 또는 X"'
      );
    }
  } else {
    // 주관식: 기본 프롬프트 그대로 사용
    prompt = basePrompt;
  }

  // Gemini API 호출
  const response = await generateText(prompt);
  const cleanedResponse = cleanJSONResponse(response);

  try {
    const problem = JSON.parse(cleanedResponse);
    return {
      ...problem,
      subject,
      language,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', cleanedResponse);
    throw new Error('AI가 올바른 형식의 응답을 생성하지 못했습니다');
  }
}

export async function POST(request: Request) {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { type, answerFormat, difficulty, grade, subject, count, language, decompositionCategory } = body;

    if (!type || !answerFormat || !difficulty || !grade || !count) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다' },
        { status: 400 }
      );
    }

    if (count > 10) {
      return NextResponse.json(
        { error: '한 번에 최대 10개까지 생성할 수 있습니다' },
        { status: 400 }
      );
    }

    // GEMINI_API_KEY 확인
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Gemini API 키가 설정되지 않았습니다. 관리자에게 문의하세요.' },
        { status: 500 }
      );
    }

    console.log('Starting AI problem generation:', { type, answerFormat, difficulty, grade, subject, count });

    const createdProblems = [];
    const failedProblems = [];

    // 여러 개 생성
    for (let i = 0; i < count; i++) {
      try {
        // AI로 문제 생성
        const generated = await generateProblemWithAI({
          type,
          answerFormat,
          difficulty,
          grade,
          subject,
          language: language || 'ko',
          decompositionCategory,
        });

        // 데이터베이스에 저장
        const problem = await prisma.problem.create({
          data: {
            type,
            answerFormat, // 답변 형식 추가
            difficulty,
            title: generated.title,
            content: generated.content,
            correctAnswer: generated.correctAnswer,
            explanation: generated.explanation,
            subject: generated.subject,
            grade,
            options: generated.options || null, // 객관식 선택지
            language: generated.language || 'ko', // 언어
            generatedBy: 'AI',
            aiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
            reviewed: false, // AI 생성 문제는 검토 필요
            active: false,
          },
        });

        // 문제 분해 타입인 경우 단계 정보 저장
        if (type === 'PROBLEM_DECOMPOSITION' && generated.steps) {
          for (const step of generated.steps) {
            await prisma.problemStep.create({
              data: {
                problemId: problem.id,
                stepNumber: step.stepNumber,
                title: step.title,
                description: step.description,
                hint: step.hint || '',
                options: step.options || null, // 객관식 선택지 (각 단계별)
                correctAnswer: step.correctAnswer || null, // 정답 (각 단계별)
              },
            });
          }
        }

        // AI 생성 로그 기록
        await prisma.aIGenerationLog.create({
          data: {
            promptType: type,
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
            success: true,
            problemId: problem.id,
          },
        });

        createdProblems.push(problem);

        // API 호출 제한을 피하기 위해 잠시 대기 (실제 AI 사용 시)
        if (i < count - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Failed to generate problem ${i + 1}:`, errorMessage);
        console.error('Error details:', err);

        failedProblems.push({
          index: i + 1,
          error: errorMessage
        });

        // 실패 로그 기록
        await prisma.aIGenerationLog.create({
          data: {
            promptType: type,
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
            success: false,
            errorMessage: errorMessage,
          },
        });
      }
    }

    console.log('AI problem generation completed:', {
      successCount: createdProblems.length,
      failedCount: failedProblems.length,
      total: count
    });

    // 모든 문제 생성이 실패한 경우
    if (createdProblems.length === 0) {
      return NextResponse.json({
        error: 'AI 문제 생성에 실패했습니다',
        message: '모든 문제 생성이 실패했습니다. 다시 시도해주세요.',
        details: failedProblems,
        count: 0
      }, { status: 500 });
    }

    // 일부만 성공한 경우
    const response: any = {
      message: `${createdProblems.length}개의 문제가 생성되었습니다`,
      count: createdProblems.length,
      problems: createdProblems,
    };

    if (failedProblems.length > 0) {
      response.warning = `${failedProblems.length}개의 문제 생성이 실패했습니다`;
      response.failedDetails = failedProblems;
    }

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Generate problems error:', errorMessage);
    console.error('Error stack:', error);
    return NextResponse.json(
      {
        error: 'AI 문제 생성 중 오류가 발생했습니다',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
