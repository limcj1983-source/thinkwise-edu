"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface ProblemStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  hint: string;
}

interface Problem {
  id: string;
  type: string;
  answerFormat: string; // SHORT_ANSWER, MULTIPLE_CHOICE, TRUE_FALSE
  difficulty: string;
  title: string;
  content: string;
  correctAnswer: string;
  explanation: string;
  subject: string;
  options?: string[]; // 객관식 선택지
  steps?: ProblemStep[];
}

export default function ProblemSolvePage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState("");
  const [stepAnswers, setStepAnswers] = useState<{ [key: number]: string }>({});
  const [showHints, setShowHints] = useState<{ [key: number]: boolean }>({});
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    fetchProblem();
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      const response = await fetch(`/api/problems/${problemId}`);
      const data = await response.json();

      if (response.ok) {
        setProblem(data.problem);
      } else {
        alert("문제를 불러올 수 없습니다.");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch problem:", error);
      alert("오류가 발생했습니다.");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem) return;

    // 답변 검증
    if (problem.type === "PROBLEM_DECOMPOSITION") {
      const allStepsFilled = problem.steps?.every(
        (step) => stepAnswers[step.stepNumber]?.trim()
      );
      if (!allStepsFilled) {
        alert("모든 단계를 작성해주세요!");
        return;
      }
    } else {
      // AI_VERIFICATION: answerFormat에 따라 검증
      if (!userAnswer.trim()) {
        alert("답변을 선택하거나 입력해주세요!");
        return;
      }
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/problems/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          answer:
            problem.type === "PROBLEM_DECOMPOSITION"
              ? JSON.stringify(stepAnswers)
              : userAnswer,
          hintUsed: Object.values(showHints).some((used) => used),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCorrect(data.isCorrect);
        setSubmitted(true);
      } else {
        if (data.limitReached) {
          setLimitReached(true);
        }
        alert(data.error || "제출에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to submit:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHint = (stepNumber: number) => {
    setShowHints((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!problem) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href={`/problems?type=${problem.type}`}
            className="flex items-center gap-2 w-fit text-gray-600 hover:text-gray-900"
          >
            ← 문제 목록으로
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 문제 정보 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                difficultyColors[problem.difficulty as keyof typeof difficultyColors]
              }`}
            >
              {difficultyLabels[problem.difficulty as keyof typeof difficultyLabels]}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {problem.subject}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {problem.title}
          </h1>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {problem.content}
            </p>
          </div>
        </div>

        {/* 무료 사용자 제한 도달 알림 */}
        {limitReached && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-orange-900 mb-2">
                오늘의 무료 문제를 모두 풀었어요!
              </h2>
              <p className="text-orange-800 mb-6">
                내일 다시 3문제를 풀 수 있어요. 또는 프리미엄으로 업그레이드하면
                무제한으로 풀 수 있습니다!
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  대시보드로
                </Link>
                <Link
                  href="/pricing"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  프리미엄 시작하기
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 답변 입력 */}
        {!submitted && !limitReached ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {problem.type === "AI_VERIFICATION"
                ? "🔍 어떤 부분이 틀렸나요?"
                : "🧩 단계별로 문제를 해결해봐요!"}
            </h2>

            {/* 문제 분해 단계 (주관식인 경우만) */}
            {problem.type === "PROBLEM_DECOMPOSITION" && problem.answerFormat === "SHORT_ANSWER" && problem.steps ? (
              <div className="space-y-6">
                {problem.steps.map((step) => (
                  <div
                    key={step.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">
                          단계 {step.stepNumber}: {step.title}
                        </h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                      <button
                        onClick={() => toggleHint(step.stepNumber)}
                        className="text-sm text-blue-600 hover:text-blue-700 ml-4"
                      >
                        {showHints[step.stepNumber] ? "힌트 숨기기" : "💡 힌트 보기"}
                      </button>
                    </div>

                    {showHints[step.stepNumber] && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3 text-sm text-gray-700">
                        💡 {step.hint}
                      </div>
                    )}

                    <textarea
                      value={stepAnswers[step.stepNumber] || ""}
                      onChange={(e) =>
                        setStepAnswers((prev) => ({
                          ...prev,
                          [step.stepNumber]: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                      placeholder="이 단계에서 할 일을 적어보세요..."
                      rows={3}
                      disabled={submitting}
                    />
                  </div>
                ))}
              </div>
            ) : problem.answerFormat === "MULTIPLE_CHOICE" && problem.options ? (
              /* 객관식 */
                  <div className="space-y-3">
                    {problem.options.map((option, index) => {
                      const label = String.fromCharCode(65 + index); // A, B, C, D
                      return (
                        <label
                          key={index}
                          className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                            userAnswer === label
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="answer"
                            value={label}
                            checked={userAnswer === label}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            disabled={submitting}
                            className="w-5 h-5 text-blue-600"
                          />
                          <span className="font-semibold text-gray-700">{label}.</span>
                          <span className="flex-1 text-gray-800">{option}</span>
                        </label>
                      );
                    })}
                  </div>
            ) : problem.answerFormat === "TRUE_FALSE" ? (
              /* OX 퀴즈 */
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                    userAnswer === "O"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-green-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value="O"
                    checked={userAnswer === "O"}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={submitting}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="text-2xl">⭕</span>
                  <span className="flex-1 text-gray-800 font-semibold">참 (O)</span>
                </label>
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                    userAnswer === "X"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 hover:border-red-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value="X"
                    checked={userAnswer === "X"}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={submitting}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="text-2xl">❌</span>
                  <span className="flex-1 text-gray-800 font-semibold">거짓 (X)</span>
                </label>
              </div>
            ) : (
              /* 주관식 (AI 검증용) */
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition min-h-[150px]"
                placeholder="틀린 부분과 이유를 자세히 설명해주세요..."
                disabled={submitting}
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "제출 중..." : "제출하기"}
            </button>
          </div>
        ) : (
          /* 결과 표시 */
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div
              className={`text-center mb-6 ${
                isCorrect ? "text-green-600" : "text-orange-600"
              }`}
            >
              <div className="text-6xl mb-4">
                {isCorrect ? "🎉" : "💪"}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isCorrect ? "정답입니다!" : "아쉬워요!"}
              </h2>
              <p className="text-gray-600">
                {isCorrect
                  ? "훌륭한 분석이에요! 계속 이런 실력을 키워나가세요."
                  : "괜찮아요! 다시 한 번 생각해볼까요?"}
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
              <h3 className="font-bold text-gray-900 mb-2">✅ 정답 및 해설</h3>
              <p className="text-gray-800 mb-3">{problem.correctAnswer}</p>
              <p className="text-gray-700 text-sm">{problem.explanation}</p>
            </div>

            <div className="flex gap-4">
              <Link
                href={`/problems?type=${problem.type}`}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold text-center hover:bg-gray-200 transition"
              >
                문제 목록으로
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-center hover:shadow-lg transition"
              >
                대시보드로
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
