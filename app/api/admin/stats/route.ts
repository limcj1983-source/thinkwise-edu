import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET() {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    const [
      totalProblems,
      pendingReview,
      activeProblems,
      totalStudents,
      totalAttempts,
    ] = await Promise.all([
      prisma.problem.count(),
      prisma.problem.count({
        where: { reviewed: false },
      }),
      prisma.problem.count({
        where: { active: true, reviewed: true },
      }),
      prisma.user.count({
        where: { role: 'STUDENT' },
      }),
      prisma.attempt.count(),
    ]);

    return NextResponse.json({
      stats: {
        totalProblems,
        pendingReview,
        activeProblems,
        totalStudents,
        totalAttempts,
      },
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { error: '통계를 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}
