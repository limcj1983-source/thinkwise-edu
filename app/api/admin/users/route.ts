import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    // 관리자 권한 체크
    const { error, session } = await requireAdmin();
    if (error) return error;

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const role = searchParams.get('role'); // 'STUDENT', 'TEACHER', 'ADMIN'
    const subscription = searchParams.get('subscription'); // 'FREE', 'PREMIUM'
    const search = searchParams.get('search'); // 이름 또는 이메일 검색

    // 필터 조건 구성
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (subscription) {
      where.subscription = subscription;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 총 사용자 수
    const totalUsers = await prisma.user.count({ where });

    // 사용자 목록 조회 (페이지네이션)
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        grade: true,
        subscription: true,
        createdAt: true,
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 각 사용자의 상세 통계 계산
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // 정답 수 계산
        const correctAttempts = await prisma.attempt.count({
          where: {
            userId: user.id,
            isCorrect: true,
          },
        });

        // 마지막 활동 날짜
        const lastAttempt = await prisma.attempt.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        // 총 학습 시간
        const totalTime = await prisma.attempt.aggregate({
          where: { userId: user.id },
          _sum: { timeSpent: true },
        });

        const totalAttempts = user._count.attempts;
        const accuracy = totalAttempts > 0
          ? Math.round((correctAttempts / totalAttempts) * 100)
          : 0;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          grade: user.grade,
          subscription: user.subscription,
          createdAt: user.createdAt,
          stats: {
            totalAttempts,
            correctAttempts,
            accuracy,
            totalTime: Math.floor((totalTime._sum.timeSpent || 0) / 60), // 분 단위
            lastActivity: lastAttempt?.createdAt || null,
          },
        };
      })
    );

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: '사용자 목록을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
