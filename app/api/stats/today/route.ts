import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * 사용자의 오늘 학습 통계 조회
 */
export async function GET() {
  try {
    // 세션 검증
    const { error, session } = await requireAuth();
    if (error) return error;

    const userId = session!.user.id;
    const subscription = session!.user.subscription;

    // 오늘 날짜 (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 오늘의 Progress 레코드 조회
    const todayProgress = await prisma.progress.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    // 통계 계산
    const problemsSolved = todayProgress?.problemsSolved || 0;
    const correctAnswers = todayProgress?.correctAnswers || 0;
    const correctRate = problemsSolved > 0
      ? Math.round((correctAnswers / problemsSolved) * 100)
      : 0;

    // 무료 사용자는 하루 3문제 제한
    const dailyLimit = subscription === 'FREE' ? 3 : Infinity;
    const remainingProblems = subscription === 'FREE'
      ? Math.max(0, dailyLimit - problemsSolved)
      : Infinity;

    // 오늘 푼 문제 목록 (최근 5개)
    const recentAttempts = await prisma.attempt.findMany({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            type: true,
            difficulty: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return NextResponse.json({
      stats: {
        problemsSolved,
        correctAnswers,
        correctRate,
        dailyLimit: subscription === 'FREE' ? dailyLimit : null,
        remainingProblems: subscription === 'FREE' ? remainingProblems : null,
        totalTime: todayProgress?.totalTime || 0,
        subscription,
      },
      recentAttempts: recentAttempts.map(attempt => ({
        id: attempt.id,
        problemTitle: attempt.problem.title,
        problemType: attempt.problem.type,
        difficulty: attempt.problem.difficulty,
        isCorrect: attempt.isCorrect,
        createdAt: attempt.createdAt,
      })),
    });

  } catch (error) {
    console.error('Get today stats error:', error);
    return NextResponse.json(
      { error: '통계를 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}
