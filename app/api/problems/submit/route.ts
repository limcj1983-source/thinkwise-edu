import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { gradeAnswerWithAI } from '@/lib/ai-grading';

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

    // 문제 조회 (단계 포함)
    const problem = await prisma.problem.findUnique({
      where: { id: validatedData.problemId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    if (!problem) {
      return NextResponse.json(
        { error: '문제를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    let gradingResult;
    let isCorrect;
    let stepResults: any[] = [];

    // 문제 분해 타입이면 단계별 채점
    if (problem.type === 'PROBLEM_DECOMPOSITION' && problem.steps.length > 0) {
      try {
        const stepAnswers = JSON.parse(validatedData.answer);

        // 각 단계별로 AI 채점
        for (const step of problem.steps) {
          const userStepAnswer = stepAnswers[step.stepNumber] || '';

          const stepGrading = await gradeAnswerWithAI(
            `${step.title}\n${step.description}`,
            step.correctAnswer || '',
            userStepAnswer,
            problem.answerFormat
          );

          stepResults.push({
            stepNumber: step.stepNumber,
            title: step.title,
            userAnswer: userStepAnswer,
            isCorrect: stepGrading.isCorrect,
            score: stepGrading.score,
            feedback: stepGrading.feedback,
          });
        }

        // 전체 평균 점수 계산
        const avgScore = stepResults.reduce((sum, r) => sum + r.score, 0) / stepResults.length;
        const correctSteps = stepResults.filter(r => r.isCorrect).length;

        isCorrect = avgScore >= 60; // 평균 60점 이상이면 정답
        gradingResult = {
          isCorrect,
          score: Math.round(avgScore),
          feedback: `${correctSteps}/${stepResults.length} 단계를 정확히 완료했습니다. ${
            isCorrect
              ? '문제 분해 능력이 훌륭해요!'
              : '조금 더 체계적으로 단계를 나눠보세요.'
          }`,
          reasoning: '단계별 점수 평균으로 채점',
        };

      } catch (error) {
        console.error('Step grading error:', error);
        // JSON 파싱 실패 시 폴백
        gradingResult = {
          isCorrect: false,
          score: 0,
          feedback: '답안 형식이 올바르지 않습니다.',
          reasoning: 'Parse error',
        };
        isCorrect = false;
      }
    } else {
      // 일반 문제는 기존 방식으로 채점
      gradingResult = await gradeAnswerWithAI(
        problem.content,
        problem.correctAnswer,
        validatedData.answer,
        problem.answerFormat
      );
      isCorrect = gradingResult.isCorrect;
    }

    // 답안 제출 기록 (AI 피드백 포함)
    const attempt = await prisma.attempt.create({
      data: {
        userId,
        problemId: problem.id,
        answer: validatedData.answer,
        isCorrect,
        hintUsed: validatedData.hintUsed,
        timeSpent: validatedData.timeSpent,
        feedback: gradingResult.feedback, // AI 피드백 저장
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
      score: gradingResult.score,
      message: gradingResult.feedback,
      feedback: gradingResult.feedback,
      reasoning: gradingResult.reasoning,
      stepResults: stepResults.length > 0 ? stepResults : undefined,
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
