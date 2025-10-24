import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

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
