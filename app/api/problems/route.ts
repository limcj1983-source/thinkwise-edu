import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProblemType, Difficulty } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ProblemType || 'AI_VERIFICATION';
    const difficulty = searchParams.get('difficulty') as Difficulty | null;
    const grade = searchParams.get('grade');

    // 필터 조건
    const where = {
      type,
      active: true, // 활성화된 문제만
      reviewed: true, // 검토 완료된 문제만
      ...(difficulty && { difficulty }),
      ...(grade && { grade: parseInt(grade) }),
    };

    const problems = await prisma.problem.findMany({
      where,
      select: {
        id: true,
        type: true,
        difficulty: true,
        title: true,
        subject: true,
        totalAttempts: true,
        correctRate: true,
        createdAt: true,
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
    console.error('Get problems error:', error);
    return NextResponse.json(
      { error: '문제 목록을 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}
