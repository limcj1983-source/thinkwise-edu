"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Problem {
  id: string;
  type: string;
  difficulty: string;
  title: string;
  content: string;
  subject: string;
  grade: number;
  reviewed: boolean;
  active: boolean;
  totalAttempts: number;
  correctRate: number;
  createdAt: string;
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: "ALL",
    grade: "ALL",
    difficulty: "ALL",
    status: "ALL", // ALL, ACTIVE, INACTIVE, REVIEWED, PENDING
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: "AI_VERIFICATION",
    difficulty: "EASY",
    grade: "3",
    subject: "",
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/problems");
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

  const handleToggleActive = async (problemId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/problems/${problemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (response.ok) {
        fetchProblems();
      } else {
        alert("활성 상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to toggle active:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleDelete = async (problemId: string) => {
    if (!confirm("이 문제를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/problems/${problemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("문제가 삭제되었습니다.");
        fetchProblems();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleCreateProblem = async () => {
    if (!createForm.subject.trim()) {
      alert("주제를 입력해주세요!");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (response.ok) {
        alert("문제가 생성되었습니다!");
        setShowCreateModal(false);
        setCreateForm({
          type: "AI_VERIFICATION",
          difficulty: "EASY",
          grade: "3",
          subject: "",
        });
        fetchProblems();
      } else {
        alert(data.error || "문제 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create problem:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  // 필터링된 문제 목록
  const filteredProblems = problems.filter((problem) => {
    // 검색어 필터
    if (searchTerm && !problem.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // 타입 필터
    if (filter.type !== "ALL" && problem.type !== filter.type) {
      return false;
    }

    // 학년 필터
    if (filter.grade !== "ALL" && problem.grade.toString() !== filter.grade) {
      return false;
    }

    // 난이도 필터
    if (filter.difficulty !== "ALL" && problem.difficulty !== filter.difficulty) {
      return false;
    }

    // 상태 필터
    if (filter.status === "ACTIVE" && !problem.active) return false;
    if (filter.status === "INACTIVE" && problem.active) return false;
    if (filter.status === "REVIEWED" && !problem.reviewed) return false;
    if (filter.status === "PENDING" && problem.reviewed) return false;

    return true;
  });

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

  const stats = {
    total: problems.length,
    active: problems.filter((p) => p.active).length,
    inactive: problems.filter((p) => !p.active).length,
    reviewed: problems.filter((p) => p.reviewed).length,
    pending: problems.filter((p) => !p.reviewed).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 w-fit text-gray-600 hover:text-gray-900"
          >
            ← 관리자 대시보드
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 제목 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              문제 관리 📚
            </h1>
            <p className="text-gray-600">
              모든 문제를 확인하고 관리하세요.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            ➕ 새 문제 생성
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">전체 문제</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 border-2 border-green-200">
            <div className="text-sm text-green-700 mb-1 font-medium">활성</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow p-4 border-2 border-gray-200">
            <div className="text-sm text-gray-700 mb-1 font-medium">비활성</div>
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 border-2 border-blue-200">
            <div className="text-sm text-blue-700 mb-1 font-medium">검토 완료</div>
            <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4 border-2 border-orange-200">
            <div className="text-sm text-orange-700 mb-1 font-medium">검토 대기</div>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </div>
        </div>

        {/* 필터 & 검색 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-5 gap-4 mb-4">
            {/* 검색 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <input
                type="text"
                placeholder="문제 제목 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 문제 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문제 유형
              </label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">전체</option>
                <option value="AI_VERIFICATION">AI 검증</option>
                <option value="PROBLEM_DECOMPOSITION">문제 분해</option>
              </select>
            </div>

            {/* 학년 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학년
              </label>
              <select
                value={filter.grade}
                onChange={(e) => setFilter({ ...filter, grade: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">전체</option>
                {[1, 2, 3, 4, 5, 6].map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}학년
                  </option>
                ))}
              </select>
            </div>

            {/* 난이도 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                난이도
              </label>
              <select
                value={filter.difficulty}
                onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">전체</option>
                <option value="EASY">쉬움</option>
                <option value="MEDIUM">보통</option>
                <option value="HARD">어려움</option>
              </select>
            </div>
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "ALL", label: "전체", color: "gray" },
                { value: "ACTIVE", label: "활성", color: "green" },
                { value: "INACTIVE", label: "비활성", color: "gray" },
                { value: "REVIEWED", label: "검토 완료", color: "blue" },
                { value: "PENDING", label: "검토 대기", color: "orange" },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setFilter({ ...filter, status: status.value })}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter.status === status.value
                      ? `bg-${status.color}-600 text-white`
                      : `bg-${status.color}-50 text-${status.color}-700 hover:bg-${status.color}-100`
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 문제 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">문제를 불러오는 중...</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              문제를 찾을 수 없습니다
            </h3>
            <p className="text-gray-600">
              필터를 변경하거나 검색어를 확인해주세요.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-2">
              {filteredProblems.length}개의 문제
            </div>
            {filteredProblems.map((problem) => (
              <div
                key={problem.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 뱃지들 */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
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
                        {problem.grade}학년 - {problem.subject}
                      </span>
                      {problem.active ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          ✓ 활성
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          ✗ 비활성
                        </span>
                      )}
                      {!problem.reviewed && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          ⚠ 검토 대기
                        </span>
                      )}
                    </div>

                    {/* 제목 & 내용 */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {problem.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {problem.content}
                    </p>

                    {/* 통계 */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>시도: {problem.totalAttempts}회</span>
                      <span>
                        정답률:{" "}
                        {problem.totalAttempts > 0
                          ? `${(problem.correctRate * 100).toFixed(1)}%`
                          : "데이터 없음"}
                      </span>
                      <span>
                        생성일:{" "}
                        {new Date(problem.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(problem.id, problem.active)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        problem.active
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {problem.active ? "비활성화" : "활성화"}
                    </button>
                    <button
                      onClick={() => handleDelete(problem.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm hover:bg-red-200 transition"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 문제 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                새 문제 생성 🎯
              </h2>

              <div className="space-y-4">
                {/* 문제 유형 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    문제 유형
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={creating}
                  >
                    <option value="AI_VERIFICATION">AI 검증</option>
                    <option value="PROBLEM_DECOMPOSITION">문제 분해</option>
                  </select>
                </div>

                {/* 학년 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학년
                  </label>
                  <select
                    value={createForm.grade}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, grade: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={creating}
                  >
                    {[1, 2, 3, 4, 5, 6].map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}학년
                      </option>
                    ))}
                  </select>
                </div>

                {/* 난이도 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    난이도
                  </label>
                  <select
                    value={createForm.difficulty}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, difficulty: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={creating}
                  >
                    <option value="EASY">쉬움</option>
                    <option value="MEDIUM">보통</option>
                    <option value="HARD">어려움</option>
                  </select>
                </div>

                {/* 주제 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주제
                  </label>
                  <input
                    type="text"
                    value={createForm.subject}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, subject: e.target.value })
                    }
                    placeholder="예: 동물, 역사, 과학 등"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateProblem}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
                >
                  {creating ? "생성 중..." : "생성하기"}
                </button>
              </div>

              {creating && (
                <p className="mt-4 text-sm text-gray-600 text-center">
                  AI가 문제를 생성하고 있습니다... 잠시만 기다려주세요.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
