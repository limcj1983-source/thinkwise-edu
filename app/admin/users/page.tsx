"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  totalTime: number;
  lastActivity: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  grade: number | null;
  subscription: string;
  createdAt: string;
  stats: UserStats;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 필터 상태
  const [roleFilter, setRoleFilter] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, subscriptionFilter, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (roleFilter) params.append("role", roleFilter);
      if (subscriptionFilter) params.append("subscription", subscriptionFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/users?${params}`);

      if (res.status === 401 || res.status === 403) {
        router.push("/auth/signin");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "사용자 목록을 불러오는데 실패했습니다");
      }

      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPagination({ ...pagination, page: 1 });
  };

  const handleResetFilters = () => {
    setRoleFilter("");
    setSubscriptionFilter("");
    setSearchQuery("");
    setSearchInput("");
    setPagination({ ...pagination, page: 1 });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      STUDENT: "👨‍🎓 학생",
      TEACHER: "👨‍🏫 교사",
      ADMIN: "👑 관리자",
    };
    return labels[role] || role;
  };

  const getSubscriptionLabel = (subscription: string) => {
    const labels: Record<string, string> = {
      FREE: "🆓 무료",
      PREMIUM: "⭐ 프리미엄",
    };
    return labels[subscription] || subscription;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityStatus = (lastActivity: string | null) => {
    if (!lastActivity) {
      return { text: "활동 없음", color: "text-gray-500" };
    }

    const now = new Date();
    const last = new Date(lastActivity);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: "오늘 활동", color: "text-green-600" };
    if (diffDays === 1) return { text: "어제 활동", color: "text-blue-600" };
    if (diffDays <= 7) return { text: `${diffDays}일 전`, color: "text-gray-600" };
    if (diffDays <= 30) return { text: `${diffDays}일 전`, color: "text-orange-600" };
    return { text: "오래 전", color: "text-red-600" };
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">사용자 목록을 불러오는 중...</p>
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
            onClick={fetchUsers}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              👥 가입자 관리
            </h1>
            <p className="text-gray-600">
              총 {pagination.total}명의 사용자가 등록되어 있습니다
            </p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            관리자 홈
          </button>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 역할 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                역할
              </label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="STUDENT">학생</option>
                <option value="TEACHER">교사</option>
                <option value="ADMIN">관리자</option>
              </select>
            </div>

            {/* 구독 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                구독
              </label>
              <select
                value={subscriptionFilter}
                onChange={(e) => {
                  setSubscriptionFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="FREE">무료</option>
                <option value="PREMIUM">프리미엄</option>
              </select>
            </div>

            {/* 검색 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색 (이름 또는 이메일)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="이름 또는 이메일 입력..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  검색
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 목록 테이블 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    이름
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    이메일
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    역할
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    학년
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    구독
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    문제 풀이
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    정답률
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    학습시간
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    마지막 활동
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-500">
                      조건에 맞는 사용자가 없습니다
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const activity = getActivityStatus(user.stats.lastActivity);
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {user.name}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-center text-sm">
                          {getRoleLabel(user.role)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {user.grade || "-"}
                        </td>
                        <td className="py-3 px-4 text-center text-sm">
                          {getSubscriptionLabel(user.subscription)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold">
                            {user.stats.totalAttempts}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">문제</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-semibold ${
                              user.stats.accuracy >= 80
                                ? "text-green-600"
                                : user.stats.accuracy >= 60
                                ? "text-blue-600"
                                : "text-orange-600"
                            }`}
                          >
                            {user.stats.accuracy}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold">
                            {user.stats.totalTime}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">분</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-sm ${activity.color}`}>
                            {activity.text}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {pagination.total}명 중 {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}명 표시
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  이전
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.page) <= 2
                    )
                    .map((page, index, arr) => {
                      if (index > 0 && arr[index - 1] !== page - 1) {
                        return (
                          <span
                            key={`ellipsis-${page}`}
                            className="px-3 py-2 text-gray-500"
                          >
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setPagination({ ...pagination, page })}
                          className={`px-4 py-2 rounded-lg ${
                            pagination.page === page
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                </div>

                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
