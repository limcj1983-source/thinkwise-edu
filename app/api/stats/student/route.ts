import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const userId = session!.user.id;

    // 1. 전체 통계
    const totalAttempts = await prisma.attempt.count({
      where: { userId },
    });

    const correctAttempts = await prisma.attempt.count({
      where: { userId, isCorrect: true },
    });

    const totalTimeSpent = await prisma.attempt.aggregate({
      where: { userId },
      _sum: { timeSpent: true },
    });

    // 2. 최근 7일 학습 진도
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentProgress = await prisma.attempt.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
      _sum: { isCorrect: true },
    });

    // 날짜별로 집계
    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];

      const dayAttempts = recentProgress.filter(p =>
        p.createdAt.toISOString().split('T')[0] === dateStr
      );

      const total = dayAttempts.reduce((sum, p) => sum + p._count.id, 0);
      const correct = dayAttempts.reduce((sum, p) => sum + (p._sum.isCorrect || 0), 0);

      return {
        date: dateStr,
        total,
        correct,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      };
    });

    // 3. 문제 유형별 통계
    const attemptsByType = await prisma.attempt.findMany({
      where: { userId },
      include: { problem: { select: { type: true, answerFormat: true } } },
    });

    const typeStats = attemptsByType.reduce((acc: any, attempt) => {
      const type = attempt.problem.type;
      if (!acc[type]) {
        acc[type] = { total: 0, correct: 0 };
      }
      acc[type].total++;
      if (attempt.isCorrect) acc[type].correct++;
      return acc;
    }, {});

    // 4. 연속 학습 일수
    const allAttempts = await prisma.attempt.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    let streak = 0;
    if (allAttempts.length > 0) {
      const uniqueDates = [...new Set(allAttempts.map(a =>
        a.createdAt.toISOString().split('T')[0]
      ))];

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i - 1]);
          const currDate = new Date(uniqueDates[i]);
          const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);

          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // 5. 최근 진도 (Progress 테이블)
    const latestProgress = await prisma.progress.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      overview: {
        totalAttempts,
        correctAttempts,
        accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
        totalTimeSpent: Math.floor((totalTimeSpent._sum.timeSpent || 0) / 60), // 분 단위
        streak,
      },
      dailyStats,
      typeStats: Object.entries(typeStats).map(([type, stats]: [string, any]) => ({
        type,
        total: stats.total,
        correct: stats.correct,
        accuracy: Math.round((stats.correct / stats.total) * 100),
      })),
      latestProgress: latestProgress ? {
        problemsSolved: latestProgress.problemsSolved,
        correctAnswers: latestProgress.correctAnswers,
        totalTime: Math.floor(latestProgress.totalTime / 60),
      } : null,
    });

  } catch (error) {
    console.error('Student stats error:', error);
    return NextResponse.json(
      { error: '통계를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
