import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET() {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    // 1. 전체 사용자 통계
    const totalUsers = await prisma.user.count();
    const studentCount = await prisma.user.count({
      where: { role: 'STUDENT' },
    });
    const teacherCount = await prisma.user.count({
      where: { role: 'TEACHER' },
    });
    const premiumCount = await prisma.user.count({
      where: { subscription: 'PREMIUM' },
    });

    // 2. 전체 문제 통계
    const totalProblems = await prisma.problem.count();
    const activeProblems = await prisma.problem.count({
      where: { active: true },
    });
    const reviewedProblems = await prisma.problem.count({
      where: { reviewed: true },
    });

    // 문제 유형별 개수
    const problemsByType = await prisma.problem.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    // 문제 답변 형식별 개수
    const problemsByFormat = await prisma.problem.groupBy({
      by: ['answerFormat'],
      _count: { id: true },
    });

    // 난이도별 개수
    const problemsByDifficulty = await prisma.problem.groupBy({
      by: ['difficulty'],
      _count: { id: true },
    });

    // 3. 전체 풀이 시도 통계
    const totalAttempts = await prisma.attempt.count();
    const correctAttempts = await prisma.attempt.count({
      where: { isCorrect: true },
    });

    const avgAccuracy = totalAttempts > 0
      ? Math.round((correctAttempts / totalAttempts) * 100)
      : 0;

    // 평균 소요 시간
    const avgTimeResult = await prisma.attempt.aggregate({
      _avg: { timeSpent: true },
    });
    const avgTimeSpent = Math.floor((avgTimeResult._avg.timeSpent || 0) / 60); // 분 단위

    // 4. 최근 7일 활동
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAttempts = await prisma.attempt.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        isCorrect: true,
      },
    });

    // 날짜별로 집계
    const dailyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];

      const dayAttempts = recentAttempts.filter(a =>
        a.createdAt.toISOString().split('T')[0] === dateStr
      );

      const total = dayAttempts.length;
      const correct = dayAttempts.filter(a => a.isCorrect).length;

      return {
        date: dateStr,
        total,
        correct,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      };
    });

    // 5. 문제별 통계 (정답률 상위/하위)
    const allProblems = await prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        difficulty: true,
        totalAttempts: true,
        correctRate: true,
      },
      orderBy: { totalAttempts: 'desc' },
      take: 100,
    });

    const topProblems = allProblems
      .filter(p => p.totalAttempts >= 5)
      .sort((a, b) => b.correctRate - a.correctRate)
      .slice(0, 5);

    const bottomProblems = allProblems
      .filter(p => p.totalAttempts >= 5)
      .sort((a, b) => a.correctRate - b.correctRate)
      .slice(0, 5);

    // 6. 학생별 통계 (상위 학생들)
    const topStudents = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        attempts: {
          select: {
            isCorrect: true,
            timeSpent: true,
          },
        },
      },
      take: 100,
    });

    const studentStats = topStudents
      .map(student => {
        const totalAttempts = student.attempts.length;
        const correctAttempts = student.attempts.filter(a => a.isCorrect).length;
        const accuracy = totalAttempts > 0
          ? Math.round((correctAttempts / totalAttempts) * 100)
          : 0;
        const totalTime = student.attempts.reduce((sum, a) => sum + a.timeSpent, 0);

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          grade: student.grade,
          totalAttempts,
          correctAttempts,
          accuracy,
          totalTime: Math.floor(totalTime / 60), // 분 단위
        };
      })
      .filter(s => s.totalAttempts > 0)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 10);

    // 7. AI 생성 로그 통계
    const totalGenerations = await prisma.aIGenerationLog.count();
    const successfulGenerations = await prisma.aIGenerationLog.count({
      where: { success: true },
    });
    const failedGenerations = totalGenerations - successfulGenerations;

    const generationsByType = await prisma.aIGenerationLog.groupBy({
      by: ['promptType'],
      _count: { id: true },
    });

    const totalCost = await prisma.aIGenerationLog.aggregate({
      _sum: { cost: true },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        students: studentCount,
        teachers: teacherCount,
        premium: premiumCount,
      },
      problems: {
        total: totalProblems,
        active: activeProblems,
        reviewed: reviewedProblems,
        byType: problemsByType.map(p => ({
          type: p.type,
          count: p._count.id,
        })),
        byFormat: problemsByFormat.map(p => ({
          format: p.answerFormat,
          count: p._count.id,
        })),
        byDifficulty: problemsByDifficulty.map(p => ({
          difficulty: p.difficulty,
          count: p._count.id,
        })),
      },
      attempts: {
        total: totalAttempts,
        correct: correctAttempts,
        accuracy: avgAccuracy,
        avgTimeSpent,
      },
      dailyActivity,
      topProblems: topProblems.map(p => ({
        id: p.id,
        title: p.title,
        type: p.type,
        difficulty: p.difficulty,
        attempts: p.totalAttempts,
        correctRate: Math.round(p.correctRate),
      })),
      bottomProblems: bottomProblems.map(p => ({
        id: p.id,
        title: p.title,
        type: p.type,
        difficulty: p.difficulty,
        attempts: p.totalAttempts,
        correctRate: Math.round(p.correctRate),
      })),
      topStudents: studentStats,
      aiGeneration: {
        total: totalGenerations,
        successful: successfulGenerations,
        failed: failedGenerations,
        byType: generationsByType.map(g => ({
          type: g.promptType,
          count: g._count.id,
        })),
        totalCost: totalCost._sum.cost || 0,
      },
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: '통계를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
