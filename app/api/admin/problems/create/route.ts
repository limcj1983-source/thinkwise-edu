import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { type, difficulty, title, content, correctAnswer, explanation, subject, grade, steps } = body;

    // 문제 생성
    const problem = await prisma.problem.create({
      data: {
        type,
        difficulty,
        title,
        content,
        correctAnswer,
        explanation,
        subject,
        grade,
        generatedBy: 'TEACHER',
        reviewed: true, // 교사가 직접 입력한 문제는 바로 승인
        active: true,
      },
    });

    // 문제 분해 타입인 경우 단계 정보 저장
    if (type === 'PROBLEM_DECOMPOSITION' && steps && Array.isArray(steps)) {
      for (const step of steps) {
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

    return NextResponse.json({
      message: '문제가 생성되었습니다',
      problem,
    });

  } catch (error) {
    console.error('Create problem error:', error);
    return NextResponse.json(
      { error: '문제 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
