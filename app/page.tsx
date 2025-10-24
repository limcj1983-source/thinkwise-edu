import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              T
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ThinkWise
            </span>
          </div>
          <nav className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-700 hover:text-blue-600 transition"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
            >
              시작하기
            </Link>
          </nav>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI 시대,
            </span>
            <br />
            <span className="text-gray-900">
              생각하는 힘을 키워요
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            초등학생을 위한 비판적 사고 교육 플랫폼
            <br />
            AI 정보를 검증하고, 문제를 논리적으로 해결하는 능력을 길러요
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:shadow-xl transition transform hover:-translate-y-1"
            >
              무료로 시작하기
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition"
            >
              자세히 알아보기
            </Link>
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
          두 가지 핵심 학습
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* AI 정보 검증 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              AI 정보 검증
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              AI가 만든 정보에 숨겨진 오류를 찾아내세요.
              무비판적으로 받아들이지 않고, 스스로 판단하는 능력을 키웁니다.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>단계별 난이도 (초급/중급/고급)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>다양한 주제 (과학, 사회, 역사 등)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>상세한 해설과 피드백</span>
              </li>
            </ul>
          </div>

          {/* 문제 분해 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              문제 분해 학습
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              복잡한 실생활 문제를 논리적으로 쪼개어 해결하세요.
              단계별 사고 과정을 통해 문제 해결 능력을 향상시킵니다.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>실생활 중심 문제</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>단계별 힌트 제공</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>논리적 사고력 강화</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 가격 안내 */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
          요금제
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* 무료 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
            <h3 className="text-2xl font-bold mb-2">무료</h3>
            <p className="text-gray-600 mb-6">시작하기에 완벽해요</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">₩0</span>
              <span className="text-gray-600">/월</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>하루 3문제</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>기본 피드백</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>학습 기록</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg text-center font-semibold hover:border-blue-600 hover:text-blue-600 transition"
            >
              무료 시작
            </Link>
          </div>

          {/* 프리미엄 */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
              인기
            </div>
            <h3 className="text-2xl font-bold mb-2">프리미엄</h3>
            <p className="text-blue-100 mb-6">완전한 학습 경험</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">₩9,900</span>
              <span className="text-blue-100">/월</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <span>✓</span>
                <span>무제한 문제 풀이</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span>
                <span>AI 상세 피드백</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span>
                <span>학습 분석 대시보드</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span>
                <span>개인 맞춤 문제</span>
              </li>
            </ul>
            <Link
              href="/signup?plan=premium"
              className="block w-full px-6 py-3 bg-white text-blue-600 rounded-lg text-center font-semibold hover:bg-blue-50 transition"
            >
              프리미엄 시작
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">© 2025 ThinkWise. All rights reserved.</p>
            <p className="text-sm">초등교사가 만든 교육 플랫폼</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
