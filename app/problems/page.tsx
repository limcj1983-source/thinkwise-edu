"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

interface Problem {
  id: string;
  type: string;
  difficulty: string;
  title: string;
  subject: string;
  totalAttempts: number;
  correctRate: number;
}

function ProblemsContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "AI_VERIFICATION";

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");

  useEffect(() => {
    fetchProblems();
  }, [type, selectedDifficulty]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        ...(selectedDifficulty !== "ALL" && { difficulty: selectedDifficulty }),
      });

      const response = await fetch(`/api/problems?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProblems(data.problems || []);
      }
    } catch (error) {
      console.error("Failed to fetch problems:", error);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors = {
    EASY: "bg-green-100 text-green-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HARD: "bg-red-100 text-red-700",
  };

  const difficultyLabels = {
    EASY: "쉬움",
    MEDIUM: "보통",
    HARD: "어려움",
  };

  const typeInfo = {
    AI_VERIFICATION: {
      title: "AI 정보 검증",
      icon: "🔍",
      color: "blue",
      description: "AI가 만든 정보에서 틀린 부분을 찾아보세요!",
    },
    PROBLEM_DECOMPOSITION: {
      title: "문제 분해하기",
      icon: "🧩",
      color: "purple",
      description: "복잡한 문제를 단계별로 나누어 해결해봐요!",
    },
  };

  const currentType = typeInfo[type as keyof typeof typeInfo];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 w-fit">
            <span className="text-gray-600 hover:text-gray-900">← 대시보드로</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{currentType.icon}</span>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentType.title}
            </h1>
          </div>
          <p className="text-gray-600">{currentType.description}</p>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">난이도:</span>
            {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedDifficulty === diff
                    ? `bg-${currentType.color}-600 text-white`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {diff === "ALL" ? "전체" : difficultyLabels[diff as keyof typeof difficultyLabels]}
              </button>
            ))}
          </div>
        </div>

        {/* 문제 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">문제를 불러오는 중...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              아직 준비된 문제가 없어요
            </h3>
            <p className="text-gray-600">
              선생님이 곧 새로운 문제를 추가할 거예요!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {problems.map((problem) => (
              <Link
                key={problem.id}
                href={`/problems/${problem.id}`}
                className="block"
              >
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            difficultyColors[
                              problem.difficulty as keyof typeof difficultyColors
                            ]
                          }`}
                        >
                          {difficultyLabels[problem.difficulty as keyof typeof difficultyLabels]}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {problem.subject}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {problem.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>도전 {problem.totalAttempts}회</span>
                        <span>•</span>
                        <span>정답률 {problem.correctRate}%</span>
                      </div>
                    </div>
                    <div className="text-blue-600 font-semibold">
                      풀기 →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    }>
      <ProblemsContent />
    </Suspense>
  );
}
