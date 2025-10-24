"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Stats {
  totalProblems: number;
  pendingReview: number;
  activeProblems: number;
  totalStudents: number;
  totalAttempts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProblems: 0,
    pendingReview: 0,
    activeProblems: 0,
    totalStudents: 0,
    totalAttempts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              T
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ThinkWise Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
              target="_blank"
            >
              사이트 보기
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              로그아웃
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 환영 메시지 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            관리자 대시보드 👨‍🏫
          </h1>
          <p className="text-gray-600">
            AI가 생성한 문제를 검토하고 플랫폼을 관리하세요.
          </p>
        </div>

        {/* 통계 카드 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-sm text-gray-600 mb-2">총 문제 수</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalProblems}
              </div>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl shadow-md p-6">
              <div className="text-sm text-orange-700 mb-2 font-medium">
                검토 대기 ⚠️
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {stats.pendingReview}
              </div>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-xl shadow-md p-6">
              <div className="text-sm text-green-700 mb-2 font-medium">
                활성 문제 ✅
              </div>
              <div className="text-3xl font-bold text-green-600">
                {stats.activeProblems}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-sm text-gray-600 mb-2">총 학생 수</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalStudents}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-sm text-gray-600 mb-2">총 시도 횟수</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalAttempts}
              </div>
            </div>
          </div>
        )}

        {/* 주요 메뉴 */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* 문제 검토 */}
          <Link href="/admin/review">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-orange-500">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4">
                📋
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                문제 검토
              </h2>
              <p className="text-gray-600 mb-4">
                AI가 생성한 문제를 검토하고 승인하세요
              </p>
              {stats.pendingReview > 0 && (
                <div className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                  {stats.pendingReview}개 대기 중
                </div>
              )}
            </div>
          </Link>

          {/* 문제 관리 */}
          <Link href="/admin/problems">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-blue-500">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4">
                📚
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                문제 관리
              </h2>
              <p className="text-gray-600 mb-4">
                모든 문제를 보고 편집하거나 삭제하세요
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                문제 관리하기
                <span>→</span>
              </div>
            </div>
          </Link>

          {/* 통계 */}
          <Link href="/admin/statistics">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-purple-500">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4">
                📊
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                통계 및 분석
              </h2>
              <p className="text-gray-600 mb-4">
                학생 활동과 문제별 통계를 확인하세요
              </p>
              <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                통계 보기
                <span>→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* AI 생성 실행 */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-2">AI 문제 생성 🤖</h3>
          <p className="mb-4 opacity-90">
            새로운 문제를 AI로 생성합니다. 터미널에서 실행하세요:
          </p>
          <div className="bg-black bg-opacity-30 rounded-lg p-4 font-mono text-sm">
            <div className="mb-2">
              # AI 검증 문제 생성 (3학년, 10개)
            </div>
            <div className="text-blue-200">
              pnpm gen:problems -- --type=AI_VERIFICATION --count=10 --grade=3
            </div>
            <div className="mt-3 mb-2">
              # 문제 분해 문제 생성 (5학년, 5개)
            </div>
            <div className="text-purple-200">
              pnpm gen:problems -- --type=PROBLEM_DECOMPOSITION --count=5
              --grade=5
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
