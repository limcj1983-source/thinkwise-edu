import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { ProblemType, Difficulty } from '@prisma/client';

// AI 문제 생성 함수들을 import (나중에 구현)
async function generateProblemWithAI(params: {
  type: ProblemType;
  difficulty: Difficulty;
  grade: number;
  subject?: string;
}): Promise<any> {
  // TODO: Gemini API 연동
  // 현재는 더미 데이터 반환
  const subjects = params.subject
    ? [params.subject]
    : params.type === 'AI_VERIFICATION'
    ? ['과학', '역사', '지리', '환경']
    : ['학교생활', '친구관계', '가족여행', '용돈관리'];

  const subject = params.subject || subjects[Math.floor(Math.random() * subjects.length)];

  if (params.type === 'AI_VERIFICATION') {
    return {
      title: `${subject}: AI 정보 검증 문제`,
      content: `다음은 AI가 작성한 ${subject}에 관한 글입니다. 이 글에서 잘못된 정보를 찾아보세요.\\n\\n[AI가 생성한 내용이 여기에 표시됩니다]`,
      correctAnswer: '오류 내용',
      explanation: '왜 이것이 오류인지 설명',
      subject,
    };
  } else {
    return {
      title: `${subject}: 문제 해결하기`,
      content: `${subject}와 관련된 실생활 문제를 단계별로 해결해봅시다.`,
      correctAnswer: '문제 해결 방법',
      explanation: '단계별로 문제를 해결하는 방법',
      subject,
      steps: [
        {
          stepNumber: 1,
          title: '첫 번째 단계',
          description: '문제를 분석합니다',
          hint: '천천히 생각해보세요',
        },
        {
          stepNumber: 2,
          title: '두 번째 단계',
          description: '해결 방법을 찾습니다',
          hint: '다양한 방법을 고려해보세요',
        },
      ],
    };
  }
}

export async function POST(request: Request) {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { type, difficulty, grade, subject, count } = body;

    if (!type || !difficulty || !grade || !count) {
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

    const createdProblems = [];

    // 여러 개 생성
    for (let i = 0; i < count; i++) {
      try {
        // AI로 문제 생성
        const generated = await generateProblemWithAI({
          type,
          difficulty,
          grade,
          subject,
        });

        // 데이터베이스에 저장
        const problem = await prisma.problem.create({
          data: {
            type,
            difficulty,
            title: generated.title,
            content: generated.content,
            correctAnswer: generated.correctAnswer,
            explanation: generated.explanation,
            subject: generated.subject,
            grade,
            generatedBy: 'AI',
            aiModel: 'gemini-1.5-flash',
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

        createdProblems.push(problem);

        // API 호출 제한을 피하기 위해 잠시 대기 (실제 AI 사용 시)
        if (i < count - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (err) {
        console.error(`Failed to generate problem ${i + 1}:`, err);

        // 실패 로그 기록
        await prisma.aIGenerationLog.create({
          data: {
            promptType: type,
            model: 'gemini-1.5-flash',
            success: false,
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
          },
        });
      }
    }

    return NextResponse.json({
      message: `${createdProblems.length}개의 문제가 생성되었습니다`,
      count: createdProblems.length,
      problems: createdProblems,
    });
  } catch (error) {
    console.error('Generate problems error:', error);
    return NextResponse.json(
      { error: 'AI 문제 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
