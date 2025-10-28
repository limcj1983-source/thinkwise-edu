import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

// 문제 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    // 관련된 데이터들 먼저 삭제
    // 1. 풀이 시도 기록 삭제
    await prisma.attempt.deleteMany({
      where: { problemId: id },
    });

    // 2. 문제 분해 단계 삭제
    await prisma.problemStep.deleteMany({
      where: { problemId: id },
    });

    // 3. 문제 삭제
    await prisma.problem.delete({
      where: { id },
    });

    return NextResponse.json({
      message: '문제가 삭제되었습니다',
    });

  } catch (error) {
    console.error('Delete problem error:', error);
    return NextResponse.json(
      { error: '문제 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 문제 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    const updatedProblem = await prisma.problem.update({
      where: { id },
      data: {
        ...body,
        steps: undefined, // steps는 별도로 처리
      },
    });

    return NextResponse.json({
      message: '문제가 수정되었습니다',
      problem: updatedProblem,
    });

  } catch (error) {
    console.error('Update problem error:', error);
    return NextResponse.json(
      { error: '문제 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
