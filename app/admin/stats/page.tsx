"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserStats {
  total: number;
  students: number;
  teachers: number;
  premium: number;
}

interface ProblemStats {
  total: number;
  active: number;
  reviewed: number;
  byType: { type: string; count: number }[];
  byFormat: { format: string; count: number }[];
  byDifficulty: { difficulty: string; count: number }[];
}

interface AttemptStats {
  total: number;
  correct: number;
  accuracy: number;
  avgTimeSpent: number;
}

interface DailyActivity {
  date: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface ProblemRanking {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  attempts: number;
  correctRate: number;
}

interface StudentRanking {
  id: string;
  name: string;
  email: string;
  grade: number | null;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  totalTime: number;
}

interface AIGenerationStats {
  total: number;
  successful: number;
  failed: number;
  byType: { type: string; count: number }[];
  totalCost: number;
}

interface AdminStatsData {
  users: UserStats;
  problems: ProblemStats;
  attempts: AttemptStats;
  dailyActivity: DailyActivity[];
  topProblems: ProblemRanking[];
  bottomProblems: ProblemRanking[];
  topStudents: StudentRanking[];
  aiGeneration: AIGenerationStats;
}

export default function AdminStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stats/admin");

      if (res.status === 401 || res.status === 403) {
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
      AI_VERIFICATION: "🔍 AI 검증",
      PROBLEM_DECOMPOSITION: "🧩 문제 분해",
      MULTIPLE_CHOICE: "📝 객관식",
      TRUE_FALSE: "⭕ OX",
    };
    return labels[type] || type;
  };

  const getFormatLabel = (format: string) => {
    const labels: Record<string, string> = {
      SHORT_ANSWER: "✍️ 주관식",
      MULTIPLE_CHOICE: "📝 객관식",
      TRUE_FALSE: "⭕ OX",
    };
    return labels[format] || format;
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      EASY: "😊 쉬움",
      MEDIUM: "🤔 보통",
      HARD: "😤 어려움",
    };
    return labels[difficulty] || difficulty;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📊 관리자 통계 대시보드
            </h1>
            <p className="text-gray-600">
              플랫폼 전체의 데이터와 성과를 확인하세요
            </p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            관리자 홈
          </button>
        </div>

        {/* 사용자 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">👥 사용자 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">전체 사용자</div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.users.total}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">학생</div>
              <div className="text-3xl font-bold text-green-600">
                {stats.users.students}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">교사</div>
              <div className="text-3xl font-bold text-purple-600">
                {stats.users.teachers}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">프리미엄</div>
              <div className="text-3xl font-bold text-orange-600">
                {stats.users.premium}
              </div>
            </div>
          </div>
        </div>

        {/* 문제 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📚 문제 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">전체 문제</div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.problems.total}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">활성 문제</div>
              <div className="text-3xl font-bold text-green-600">
                {stats.problems.active}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">검토 완료</div>
              <div className="text-3xl font-bold text-purple-600">
                {stats.problems.reviewed}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 유형별 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-800 mb-3">문제 유형</h3>
              <div className="space-y-2">
                {stats.problems.byType.map((item) => (
                  <div key={item.type} className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {getTypeLabel(item.type)}
                    </span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 형식별 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-800 mb-3">답변 형식</h3>
              <div className="space-y-2">
                {stats.problems.byFormat.map((item) => (
                  <div key={item.format} className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {getFormatLabel(item.format)}
                    </span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 난이도별 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-800 mb-3">난이도</h3>
              <div className="space-y-2">
                {stats.problems.byDifficulty.map((item) => (
                  <div key={item.difficulty} className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {getDifficultyLabel(item.difficulty)}
                    </span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 풀이 시도 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">✍️ 풀이 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">총 시도</div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.attempts.total}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">정답</div>
              <div className="text-3xl font-bold text-green-600">
                {stats.attempts.correct}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">평균 정답률</div>
              <div className="text-3xl font-bold text-purple-600">
                {stats.attempts.accuracy}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">평균 소요시간</div>
              <div className="text-3xl font-bold text-orange-600">
                {stats.attempts.avgTimeSpent}분
              </div>
            </div>
          </div>
        </div>

        {/* 최근 7일 활동 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📈 최근 7일 활동
          </h2>
          <div className="space-y-3">
            {stats.dailyActivity.map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600">
                  {formatDate(day.date)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
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
                    <div className="w-24 text-right text-sm text-gray-600">
                      {day.correct}/{day.total} ({day.total}시도)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 문제 순위 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* 정답률 높은 문제 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🏆 정답률 높은 문제 Top 5
            </h2>
            {stats.topProblems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">데이터 없음</p>
            ) : (
              <div className="space-y-3">
                {stats.topProblems.map((problem, index) => (
                  <div
                    key={problem.id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl font-bold text-blue-600">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 mb-1">
                          {problem.title}
                        </div>
                        <div className="flex gap-2 text-xs text-gray-600">
                          <span>{getTypeLabel(problem.type)}</span>
                          <span>•</span>
                          <span>{getDifficultyLabel(problem.difficulty)}</span>
                          <span>•</span>
                          <span>{problem.attempts}시도</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {problem.correctRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 정답률 낮은 문제 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              ⚠️ 정답률 낮은 문제 Top 5
            </h2>
            {stats.bottomProblems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">데이터 없음</p>
            ) : (
              <div className="space-y-3">
                {stats.bottomProblems.map((problem, index) => (
                  <div
                    key={problem.id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl font-bold text-red-600">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 mb-1">
                          {problem.title}
                        </div>
                        <div className="flex gap-2 text-xs text-gray-600">
                          <span>{getTypeLabel(problem.type)}</span>
                          <span>•</span>
                          <span>{getDifficultyLabel(problem.difficulty)}</span>
                          <span>•</span>
                          <span>{problem.attempts}시도</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-red-600">
                        {problem.correctRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 우수 학생 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🌟 우수 학생 Top 10
          </h2>
          {stats.topStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">데이터 없음</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3">순위</th>
                    <th className="text-left py-2 px-3">이름</th>
                    <th className="text-left py-2 px-3">이메일</th>
                    <th className="text-center py-2 px-3">학년</th>
                    <th className="text-center py-2 px-3">총 시도</th>
                    <th className="text-center py-2 px-3">정답</th>
                    <th className="text-center py-2 px-3">정답률</th>
                    <th className="text-center py-2 px-3">학습시간</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topStudents.map((student, index) => (
                    <tr key={student.id} className="border-b border-gray-100">
                      <td className="py-3 px-3">
                        <span className="font-bold text-blue-600">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">{student.name}</td>
                      <td className="py-3 px-3 text-sm text-gray-600">
                        {student.email}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {student.grade || "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {student.totalAttempts}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {student.correctAttempts}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-green-600">
                          {student.accuracy}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {student.totalTime}분
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI 생성 통계 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🤖 AI 문제 생성 통계
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.aiGeneration.total}
              </div>
              <div className="text-sm text-gray-600 mt-1">총 생성</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.aiGeneration.successful}
              </div>
              <div className="text-sm text-gray-600 mt-1">성공</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {stats.aiGeneration.failed}
              </div>
              <div className="text-sm text-gray-600 mt-1">실패</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ${stats.aiGeneration.totalCost.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">총 비용</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">유형별 생성</h3>
            {stats.aiGeneration.byType.map((item) => (
              <div key={item.type} className="flex justify-between items-center">
                <span className="text-gray-600">{getTypeLabel(item.type)}</span>
                <span className="font-semibold">{item.count}개</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
