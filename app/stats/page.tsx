"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface OverviewStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  totalTimeSpent: number;
  streak: number;
}

interface DailyStat {
  date: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface TypeStat {
  type: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface LatestProgress {
  problemsSolved: number;
  correctAnswers: number;
  totalTime: number;
}

interface StatsData {
  overview: OverviewStats;
  dailyStats: DailyStat[];
  typeStats: TypeStat[];
  latestProgress: LatestProgress | null;
}

export default function StudentStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stats/student");

      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "통계를 불러오는데 실패했습니다");
      }

      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      AI_VERIFICATION: "🔍 AI 정보 검증",
      PROBLEM_DECOMPOSITION: "🧩 문제 분해",
      MULTIPLE_CHOICE: "📝 객관식",
      TRUE_FALSE: "⭕ OX 퀴즈",
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">통계를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { overview, dailyStats, typeStats, latestProgress } = stats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📊 나의 학습 통계
          </h1>
          <p className="text-gray-600">
            학습 진도와 성과를 한눈에 확인하세요
          </p>
        </div>

        {/* 전체 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">총 문제 수</span>
              <span className="text-2xl">📝</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {overview.totalAttempts}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              정답: {overview.correctAttempts}개
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">정답률</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {overview.accuracy}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              평균 정확도
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">연속 학습</span>
              <span className="text-2xl">🔥</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {overview.streak}일
            </div>
            <div className="text-sm text-gray-500 mt-1">
              연속 학습 일수
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">학습 시간</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {overview.totalTimeSpent}분
            </div>
            <div className="text-sm text-gray-500 mt-1">
              총 학습 시간
            </div>
          </div>
        </div>

        {/* 최근 7일 학습 진도 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📈 최근 7일 학습 진도
          </h2>

          {dailyStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              아직 학습 기록이 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {dailyStats.map((day) => (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-gray-600">
                    {formatDate(day.date)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full flex items-center justify-end pr-2 text-white text-xs font-bold"
                          style={{
                            width: day.total > 0 ? `${Math.max((day.accuracy / 100) * 100, 10)}%` : "0%",
                          }}
                        >
                          {day.total > 0 && `${day.accuracy}%`}
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm text-gray-600">
                        {day.correct}/{day.total}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 문제 유형별 통계 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📚 문제 유형별 통계
          </h2>

          {typeStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              아직 풀이한 문제가 없습니다
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {typeStats.map((typeStat) => (
                <div
                  key={typeStat.type}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">
                      {getTypeLabel(typeStat.type)}
                    </h3>
                    <span className="text-lg font-bold text-blue-600">
                      {typeStat.accuracy}%
                    </span>
                  </div>

                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-full"
                      style={{ width: `${typeStat.accuracy}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>총 {typeStat.total}문제</span>
                    <span>정답 {typeStat.correct}개</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 진도 */}
        {latestProgress && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🎓 최근 진도
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {latestProgress.problemsSolved}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  해결한 문제
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {latestProgress.correctAnswers}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  정답 수
                </div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {latestProgress.totalTime}분
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  학습 시간
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
