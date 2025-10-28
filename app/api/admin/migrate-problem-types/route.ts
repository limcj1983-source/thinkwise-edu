/**
 * 일회성 마이그레이션 API 엔드포인트
 *
 * 기존 문제 타입을 새로운 구조로 변환:
 * - MULTIPLE_CHOICE → AI_VERIFICATION + answerFormat: MULTIPLE_CHOICE
 * - TRUE_FALSE → AI_VERIFICATION + answerFormat: TRUE_FALSE
 *
 * ⚠️ 이 API는 한 번만 실행해야 합니다!
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    console.log('🔄 문제 타입 마이그레이션 시작...');

    // 1. 현재 통계
    const totalProblems = await prisma.problem.count();
    console.log(`📊 전체 문제 수: ${totalProblems}`);

    if (totalProblems === 0) {
      return NextResponse.json({
        success: true,
        message: '마이그레이션할 문제가 없습니다.',
        stats: { total: 0, converted: 0 }
      });
    }

    // 2. 변환 작업
    let convertedCount = 0;

    // MULTIPLE_CHOICE → AI_VERIFICATION + MULTIPLE_CHOICE
    const multipleChoiceProblems = await prisma.problem.findMany({
      where: { type: 'MULTIPLE_CHOICE' as any }
    });

    for (const problem of multipleChoiceProblems) {
      await prisma.problem.update({
        where: { id: problem.id },
        data: {
          type: 'AI_VERIFICATION',
          answerFormat: 'MULTIPLE_CHOICE'
        }
      });
      convertedCount++;
    }

    console.log(`✅ MULTIPLE_CHOICE 변환: ${multipleChoiceProblems.length}개`);

    // TRUE_FALSE → AI_VERIFICATION + TRUE_FALSE
    const trueFalseProblems = await prisma.problem.findMany({
      where: { type: 'TRUE_FALSE' as any }
    });

    for (const problem of trueFalseProblems) {
      await prisma.problem.update({
        where: { id: problem.id },
        data: {
          type: 'AI_VERIFICATION',
          answerFormat: 'TRUE_FALSE'
        }
      });
      convertedCount++;
    }

    console.log(`✅ TRUE_FALSE 변환: ${trueFalseProblems.length}개`);

    // 3. 변환 후 통계
    const aiVerificationCount = await prisma.problem.count({
      where: { type: 'AI_VERIFICATION' }
    });

    const problemDecompositionCount = await prisma.problem.count({
      where: { type: 'PROBLEM_DECOMPOSITION' }
    });

    const answerFormatStats = await prisma.problem.groupBy({
      by: ['answerFormat'],
      _count: true
    });

    return NextResponse.json({
      success: true,
      message: `마이그레이션 완료! ${convertedCount}개 문제 변환됨`,
      stats: {
        total: totalProblems,
        converted: convertedCount,
        byType: {
          AI_VERIFICATION: aiVerificationCount,
          PROBLEM_DECOMPOSITION: problemDecompositionCount
        },
        byFormat: answerFormatStats.reduce((acc: any, stat) => {
          acc[stat.answerFormat] = stat._count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '마이그레이션 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
