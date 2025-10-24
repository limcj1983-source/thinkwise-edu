"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface TodayStats {
  problemsSolved: number;
  correctAnswers: number;
  correctRate: number;
  dailyLimit: number | null;
  remainingProblems: number | null;
  totalTime: number;
  subscription: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = session?.user;

  const [stats, setStats] = useState<TodayStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTodayStats();
    }
  }, [user]);

  const fetchTodayStats = async () => {
    try {
      const response = await fetch("/api/stats/today");
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              T
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ThinkWise
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name}님 {user.grade && `(${user.grade}학년)`}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 환영 메시지 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            안녕하세요, {user.name}님! 👋
          </h1>
          <p className="text-gray-600">
            오늘도 재미있게 생각하는 힘을 키워봐요!
          </p>
        </div>

        {/* 문제 타입 선택 카드 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* AI 검증 문제 */}
          <Link href="/problems?type=AI_VERIFICATION">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-blue-500">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4">
                🔍
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                AI 정보 검증
              </h2>
              <p className="text-gray-600 mb-4">
                AI가 만든 정보에서 틀린 부분을 찾아보세요!
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                문제 풀러 가기
                <span>→</span>
              </div>
            </div>
          </Link>

          {/* 문제 분해 */}
          <Link href="/problems?type=PROBLEM_DECOMPOSITION">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-purple-500">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4">
                🧩
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                문제 분해하기
              </h2>
              <p className="text-gray-600 mb-4">
                복잡한 문제를 단계별로 나누어 해결해봐요!
              </p>
              <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                문제 풀러 가기
                <span>→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 오늘의 통계 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            오늘의 학습 📊
          </h3>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {stats?.problemsSolved || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">푼 문제</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {stats?.correctRate || 0}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">정답률</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {user.subscription === "FREE"
                      ? stats?.remainingProblems || 0
                      : "∞"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">남은 문제</div>
                </div>
              </div>

              {/* 무료 사용자 제한 알림 */}
              {user.subscription === "FREE" &&
                stats?.remainingProblems !== null &&
                stats.remainingProblems === 0 && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800 font-medium">
                      ⚠️ 오늘의 무료 문제를 모두 풀었어요!
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      내일 다시 3문제를 풀 수 있어요. 또는 프리미엄으로
                      업그레이드하면 무제한으로 풀 수 있습니다!
                    </p>
                  </div>
                )}

              {/* 무료 사용자 1개 남음 알림 */}
              {user.subscription === "FREE" &&
                stats?.remainingProblems === 1 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">
                      💡 오늘 1문제만 더 풀 수 있어요!
                    </p>
                  </div>
                )}
            </>
          )}
        </div>

        {/* 무료 사용자 업그레이드 안내 */}
        {user.subscription === "FREE" && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-2">
              프리미엄으로 업그레이드하세요! ✨
            </h3>
            <p className="mb-4 opacity-90">
              무제한 문제 풀이 + AI 상세 피드백 + 학습 분석 대시보드
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-lg transition"
              >
                월 ₩9,900으로 시작하기
              </Link>
              <span className="text-sm opacity-75">
                첫 달 50% 할인 진행중!
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
