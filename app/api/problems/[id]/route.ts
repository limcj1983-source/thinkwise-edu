import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
    });

    if (!problem) {
      return NextResponse.json(
        { error: '문제를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 비활성화되거나 검토되지 않은 문제는 접근 불가
    if (!problem.active || !problem.reviewed) {
      return NextResponse.json(
        { error: '이 문제는 현재 사용할 수 없습니다' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      problem,
    });

  } catch (error) {
    console.error('Get problem error:', error);
    return NextResponse.json(
      { error: '문제를 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}
