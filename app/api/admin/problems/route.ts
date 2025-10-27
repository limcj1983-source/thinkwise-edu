import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { generateText } from '@/lib/gemini';
import { ProblemType, Difficulty } from '@prisma/client';

export async function GET(request: Request) {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const reviewed = searchParams.get('reviewed');

    const where = reviewed !== null
      ? { reviewed: reviewed === 'true' }
      : {};

    const problems = await prisma.problem.findMany({
      where,
      include: {
        steps: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      problems,
      total: problems.length,
    });

  } catch (error) {
    console.error('Get admin problems error:', error);
    return NextResponse.json(
      { error: '문제 목록을 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}

// 문제 생성 API
export async function POST(request: Request) {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { type, difficulty, grade, subject } = body;

    // 유효성 검사
    if (!type || !difficulty || !grade || !subject) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    // AI 프롬프트 생성
    const prompt = createPrompt({ type, difficulty, grade, subject });

    // Gemini API 호출
    const response = await generateText(prompt);
    const cleanedResponse = cleanJSONResponse(response);

    let generatedProblem;
    try {
      generatedProblem = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', cleanedResponse);
      return NextResponse.json(
        { error: 'AI 응답을 파싱할 수 없습니다' },
        { status: 500 }
      );
    }

    // 데이터베이스에 저장
    const problem = await prisma.problem.create({
      data: {
        type,
        difficulty,
        title: generatedProblem.title,
        content: generatedProblem.content,
        correctAnswer: generatedProblem.correctAnswer,
        explanation: generatedProblem.explanation,
        subject,
        grade: parseInt(grade),
        generatedBy: 'AI',
        aiModel: 'gemini-1.5-flash',
        reviewed: false,
        active: false,
      },
    });

    // 문제 분해 타입인 경우 단계 정보도 저장
    if (type === 'PROBLEM_DECOMPOSITION' && generatedProblem.steps) {
      for (const step of generatedProblem.steps) {
        await prisma.problemStep.create({
          data: {
            problemId: problem.id,
            stepNumber: step.stepNumber,
            title: step.title,
            description: step.description,
            hint: step.hint || '',
          },
        });
      }
    }

    // AI 생성 로그 기록
    await prisma.aIGenerationLog.create({
      data: {
        promptType: type,
        model: 'gemini-1.5-flash',
        success: true,
        problemId: problem.id,
      },
    });

    return NextResponse.json({
      success: true,
      problem,
    });

  } catch (error) {
    console.error('Create problem error:', error);

    // 실패 로그 기록
    try {
      const body = await request.json();
      await prisma.aIGenerationLog.create({
        data: {
          promptType: body.type || 'AI_VERIFICATION',
          model: 'gemini-1.5-flash',
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { error: '문제 생성에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// JSON 응답 정리
function cleanJSONResponse(text: string): string {
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  cleaned = cleaned.trim();
  return cleaned;
}

// 프롬프트 생성
function createPrompt(params: {
  type: ProblemType;
  grade: number;
  difficulty: Difficulty;
  subject: string;
}): string {
  if (params.type === 'AI_VERIFICATION') {
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
  "content": "다음은 AI가 작성한 ${params.subject}에 관한 글입니다. 이 글에서 잘못된 정보를 찾아보세요.\\n\\n[여기에 오류가 포함된 실제 내용을 작성 - 100-200자]",
  "correctAnswer": "찾아야 할 오류 설명 (50자 이내)",
  "explanation": "왜 이것이 오류인지, 올바른 정보는 무엇인지 설명 (100자 이내)"
}

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;
  } else {
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
    },
    {
      "stepNumber": 3,
      "title": "세 번째 단계 제목",
      "description": "세 번째 단계에서 할 일 설명",
      "hint": "이 단계를 위한 힌트"
    }
  ]
}

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;
  }
}
