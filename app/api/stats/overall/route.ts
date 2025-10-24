import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * 사용자의 전체 학습 통계 조회
 */
export async function GET() {
  try {
    // 세션 검증
    const { error, session } = await requireAuth();
    if (error) return error;

    const userId = session!.user.id;

    // 전체 통계
    const [
      totalAttempts,
      totalCorrect,
      totalProblems,
      progressRecords,
    ] = await Promise.all([
      // 총 시도 횟수
      prisma.attempt.count({
        where: { userId },
      }),
      // 총 정답 수
      prisma.attempt.count({
        where: { userId, isCorrect: true },
      }),
      // 완료한 고유 문제 수
      prisma.attempt.findMany({
        where: { userId },
        distinct: ['problemId'],
        select: { problemId: true },
      }),
      // 학습 기록 (최근 7일)
      prisma.progress.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 7,
      }),
    ]);

    const uniqueProblemsSolved = totalProblems.length;
    const overallCorrectRate = totalAttempts > 0
      ? Math.round((totalCorrect / totalAttempts) * 100)
      : 0;

    // 연속 학습 일수 계산
    let streak = 0;
    const sortedProgress = progressRecords.sort((a, b) =>
      b.date.getTime() - a.date.getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedProgress.length; i++) {
      const progressDate = new Date(sortedProgress[i].date);
      progressDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (progressDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    // 문제 유형별 통계
    const attemptsByType = await prisma.attempt.groupBy({
      by: ['problemId'],
      where: { userId },
      _count: true,
    });

    const problemIds = attemptsByType.map(a => a.problemId);
    const problems = await prisma.problem.findMany({
      where: { id: { in: problemIds } },
      select: { id: true, type: true },
    });

    const typeStats = problems.reduce((acc, problem) => {
      if (!acc[problem.type]) {
        acc[problem.type] = 0;
      }
      acc[problem.type]++;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      overall: {
        totalAttempts,
        totalCorrect,
        uniqueProblemsSolved,
        overallCorrectRate,
        streak,
      },
      byType: {
        AI_VERIFICATION: typeStats.AI_VERIFICATION || 0,
        PROBLEM_DECOMPOSITION: typeStats.PROBLEM_DECOMPOSITION || 0,
      },
      recentProgress: progressRecords.slice(0, 7).map(p => ({
        date: p.date,
        problemsSolved: p.problemsSolved,
        correctAnswers: p.correctAnswers,
        correctRate: p.problemsSolved > 0
          ? Math.round((p.correctAnswers / p.problemsSolved) * 100)
          : 0,
      })),
    });

  } catch (error) {
    console.error('Get overall stats error:', error);
    return NextResponse.json(
      { error: '통계를 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}
