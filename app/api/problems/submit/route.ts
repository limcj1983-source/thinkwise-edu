import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';

const submitSchema = z.object({
  problemId: z.string(),
  answer: z.string(),
  hintUsed: z.boolean().default(false),
  timeSpent: z.number().default(0), // 소요 시간 (초)
});

export async function POST(request: Request) {
  try {
    // 세션 검증
    const { error, session } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const validatedData = submitSchema.parse(body);

    const userId = session!.user.id;
    const subscription = session!.user.subscription;

    // 무료 사용자 일일 제한 체크
    if (subscription === 'FREE') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayProgress = await prisma.progress.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      });

      const problemsSolvedToday = todayProgress?.problemsSolved || 0;

      if (problemsSolvedToday >= 3) {
        return NextResponse.json(
          {
            error: '오늘의 무료 문제를 모두 풀었습니다. 내일 다시 도전하거나 프리미엄으로 업그레이드하세요!',
            limitReached: true,
          },
          { status: 403 }
        );
      }
    }

    // 문제 조회
    const problem = await prisma.problem.findUnique({
      where: { id: validatedData.problemId },
    });

    if (!problem) {
      return NextResponse.json(
        { error: '문제를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 간단한 정답 체크 (실제로는 더 정교한 로직 필요)
    const userAnswer = validatedData.answer.toLowerCase().trim();
    const correctAnswer = problem.correctAnswer.toLowerCase().trim();

    // 키워드 기반 체크 (간단한 버전)
    const isCorrect = correctAnswer.split(' ').some(keyword =>
      userAnswer.includes(keyword.trim())
    );

    // 답안 제출 기록
    const attempt = await prisma.attempt.create({
      data: {
        userId,
        problemId: problem.id,
        answer: validatedData.answer,
        isCorrect,
        hintUsed: validatedData.hintUsed,
        timeSpent: validatedData.timeSpent,
      },
    });

    // 문제 통계 업데이트
    const totalAttempts = await prisma.attempt.count({
      where: { problemId: problem.id },
    });

    const correctAttempts = await prisma.attempt.count({
      where: {
        problemId: problem.id,
        isCorrect: true,
      },
    });

    const correctRate = totalAttempts > 0
      ? Math.round((correctAttempts / totalAttempts) * 100)
      : 0;

    await prisma.problem.update({
      where: { id: problem.id },
      data: {
        totalAttempts,
        correctRate,
      },
    });

    // 오늘 날짜의 학습 진도 업데이트
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingProgress = await prisma.progress.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (existingProgress) {
      await prisma.progress.update({
        where: { id: existingProgress.id },
        data: {
          problemsSolved: existingProgress.problemsSolved + 1,
          correctAnswers: isCorrect
            ? existingProgress.correctAnswers + 1
            : existingProgress.correctAnswers,
          totalTime: existingProgress.totalTime + validatedData.timeSpent,
        },
      });
    } else {
      await prisma.progress.create({
        data: {
          userId,
          date: today,
          problemsSolved: 1,
          correctAnswers: isCorrect ? 1 : 0,
          totalTime: validatedData.timeSpent,
        },
      });
    }

    return NextResponse.json({
      isCorrect,
      message: isCorrect ? '정답입니다!' : '다시 한 번 생각해보세요!',
      attemptId: attempt.id,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Submit problem error:', error);
    return NextResponse.json(
      { error: '제출 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
