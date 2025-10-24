import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const problem = await prisma.problem.update({
      where: { id },
      data: {
        reviewed: true,
        active: true,
      },
    });

    return NextResponse.json({
      message: '문제가 승인되었습니다',
      problem,
    });

  } catch (error) {
    console.error('Approve problem error:', error);
    return NextResponse.json(
      { error: '문제 승인 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
