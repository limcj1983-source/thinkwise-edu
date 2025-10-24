"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Problem {
  id: string;
  type: string;
  difficulty: string;
  title: string;
  content: string;
  correctAnswer: string;
  explanation: string;
  subject: string;
  grade: number;
  aiModel: string;
  createdAt: string;
  steps?: {
    stepNumber: number;
    instruction: string;
    hint: string;
  }[];
}

export default function ReviewPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/problems?reviewed=false");
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

  const handleApprove = async (problemId: string) => {
    try {
      const response = await fetch(`/api/admin/problems/${problemId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        alert("문제가 승인되어 활성화되었습니다!");
        setSelectedProblem(null);
        fetchProblems();
      } else {
        alert("승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleReject = async (problemId: string) => {
    if (!confirm("이 문제를 거부하시겠습니까? (삭제됩니다)")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/problems/${problemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("문제가 삭제되었습니다.");
        setSelectedProblem(null);
        fetchProblems();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("오류가 발생했습니다.");
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

  const typeLabels = {
    AI_VERIFICATION: "AI 검증",
    PROBLEM_DECOMPOSITION: "문제 분해",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/admin" className="flex items-center gap-2 w-fit text-gray-600 hover:text-gray-900">
            ← 관리자 대시보드
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            문제 검토 📋
          </h1>
          <p className="text-gray-600">
            AI가 생성한 문제를 검토하고 승인하세요.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">문제를 불러오는 중...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              검토할 문제가 없습니다!
            </h3>
            <p className="text-gray-600 mb-4">
              모든 문제가 검토되었습니다.
            </p>
            <Link
              href="/admin"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              대시보드로 돌아가기
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 문제 목록 */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">
                검토 대기 중 ({problems.length}개)
              </h2>
              {problems.map((problem) => (
                <div
                  key={problem.id}
                  onClick={() => setSelectedProblem(problem)}
                  className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition ${
                    selectedProblem?.id === problem.id
                      ? "border-2 border-blue-500"
                      : "border-2 border-transparent hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        difficultyColors[problem.difficulty as keyof typeof difficultyColors]
                      }`}
                    >
                      {difficultyLabels[problem.difficulty as keyof typeof difficultyLabels]}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {typeLabels[problem.type as keyof typeof typeLabels]}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {problem.grade}학년
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {problem.content}
                  </p>
                </div>
              ))}
            </div>

            {/* 문제 상세 */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              {selectedProblem ? (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        difficultyColors[selectedProblem.difficulty as keyof typeof difficultyColors]
                      }`}
                    >
                      {difficultyLabels[selectedProblem.difficulty as keyof typeof difficultyLabels]}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {typeLabels[selectedProblem.type as keyof typeof typeLabels]}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {selectedProblem.grade}학년 - {selectedProblem.subject}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {selectedProblem.title}
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        📖 문제 내용
                      </h3>
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {selectedProblem.content}
                        </p>
                      </div>
                    </div>

                    {selectedProblem.type === "PROBLEM_DECOMPOSITION" &&
                      selectedProblem.steps && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            🧩 단계별 지침
                          </h3>
                          {selectedProblem.steps.map((step) => (
                            <div
                              key={step.stepNumber}
                              className="bg-gray-50 rounded-lg p-4 mb-2"
                            >
                              <div className="font-medium text-gray-900 mb-1">
                                단계 {step.stepNumber}: {step.instruction}
                              </div>
                              <div className="text-sm text-gray-600">
                                💡 힌트: {step.hint}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        ✅ 정답
                      </h3>
                      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                        <p className="text-gray-800">
                          {selectedProblem.correctAnswer}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        💬 해설
                      </h3>
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                        <p className="text-gray-800">
                          {selectedProblem.explanation}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      생성 모델: {selectedProblem.aiModel || "unknown"} •{" "}
                      {new Date(selectedProblem.createdAt).toLocaleDateString(
                        "ko-KR"
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleReject(selectedProblem.id)}
                      className="flex-1 px-6 py-3 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition"
                    >
                      ❌ 거부
                    </button>
                    <button
                      onClick={() => handleApprove(selectedProblem.id)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
                    >
                      ✅ 승인
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-gray-600">
                    왼쪽에서 검토할 문제를 선택하세요
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
