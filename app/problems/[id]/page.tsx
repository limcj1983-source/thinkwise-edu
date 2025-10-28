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
  options?: string[]; // 객관식 선택지 (각 단계별)
  correctAnswer?: string; // 정답 (각 단계별)
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
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [stepResults, setStepResults] = useState<any[]>([]);

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
        setFeedback(data.feedback || data.message);
        setScore(data.score || (data.isCorrect ? 100 : 0));
        setStepResults(data.stepResults || []);
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

            {/* 문제 분해 - 단계별 입력 */}
            {problem.type === "PROBLEM_DECOMPOSITION" && problem.steps ? (
              <div className="space-y-6">
                {problem.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50"
                  >
                    {/* 단계 헤더 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                            단계 {step.stepNumber}
                          </span>
                          {stepAnswers[step.stepNumber] && (
                            <span className="text-green-600 text-sm">✓ 완료</span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          이 단계에 맞는 답변을 작성해주세요
                        </p>
                      </div>
                    </div>

                    {/* 선택한 답변 표시 */}
                    {stepAnswers[step.stepNumber] && problem.answerFormat !== "SHORT_ANSWER" && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-blue-700">선택한 답변:</span>
                            <span className="text-sm text-blue-900 font-bold">
                              {problem.answerFormat === "MULTIPLE_CHOICE"
                                ? `${stepAnswers[step.stepNumber]} - ${step.options?.[stepAnswers[step.stepNumber].charCodeAt(0) - 65]}`
                                : stepAnswers[step.stepNumber] === "O" ? "⭕ 참" : "❌ 거짓"}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const newAnswers = { ...stepAnswers };
                              delete newAnswers[step.stepNumber];
                              setStepAnswers(newAnswers);
                            }}
                            className="text-xs text-red-600 hover:text-red-700 underline"
                          >
                            수정하기
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 답변 입력 UI */}
                    {problem.answerFormat === "SHORT_ANSWER" ? (
                      /* 주관식 - 항상 표시 */
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
                    ) : !step.options ? (
                      /* 객관식/OX인데 선택지가 없는 경우 - 에러 표시 */
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">
                          ⚠️ 이 문제는 {problem.answerFormat === "MULTIPLE_CHOICE" ? "객관식" : "OX"} 형식이지만 선택지가 없습니다.
                          <br />
                          <span className="text-xs text-orange-600">
                            (이전 버전에서 생성된 문제일 수 있습니다. 새로운 문제를 생성해주세요.)
                          </span>
                        </p>
                      </div>
                    ) : !stepAnswers[step.stepNumber] && (
                      /* 객관식/OX는 선택 전에만 표시 */
                      <>
                        {problem.answerFormat === "MULTIPLE_CHOICE" && step.options ? (
                          <div className="space-y-2">
                            {step.options.map((option, optIndex) => {
                              const label = String.fromCharCode(65 + optIndex);
                              return (
                                <button
                                  key={optIndex}
                                  onClick={() =>
                                    setStepAnswers((prev) => ({
                                      ...prev,
                                      [step.stepNumber]: label,
                                    }))
                                  }
                                  className="w-full flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition text-left"
                                >
                                  <span className="font-semibold text-gray-700 min-w-[24px]">{label}.</span>
                                  <span className="flex-1 text-gray-800">{option}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : problem.answerFormat === "TRUE_FALSE" ? (
                          <div className="space-y-2">
                            <button
                              onClick={() =>
                                setStepAnswers((prev) => ({
                                  ...prev,
                                  [step.stepNumber]: "O",
                                }))
                              }
                              className="w-full flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition"
                            >
                              <span className="text-2xl">⭕</span>
                              <span className="flex-1 text-gray-800 font-semibold">참 (O)</span>
                            </button>
                            <button
                              onClick={() =>
                                setStepAnswers((prev) => ({
                                  ...prev,
                                  [step.stepNumber]: "X",
                                }))
                              }
                              className="w-full flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition"
                            >
                              <span className="text-2xl">❌</span>
                              <span className="flex-1 text-gray-800 font-semibold">거짓 (X)</span>
                            </button>
                          </div>
                        ) : null}
                      </>
                    )}
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

              {/* 점수 표시 (주관식일 때만) */}
              {problem.answerFormat === "SHORT_ANSWER" && score > 0 && (
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-bold text-lg mb-3">
                  {score}점 / 100점
                </div>
              )}
            </div>

            {/* AI 피드백 */}
            {feedback && (
              <div className={`border-l-4 p-4 rounded mb-6 ${
                isCorrect
                  ? "bg-green-50 border-green-500"
                  : score >= 60
                  ? "bg-blue-50 border-blue-500"
                  : "bg-orange-50 border-orange-500"
              }`}>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span>🤖</span>
                  <span>AI 선생님의 피드백</span>
                </h3>
                <p className="text-gray-800">{feedback}</p>
              </div>
            )}

            {/* 단계별 채점 결과 (문제 분해일 때) */}
            {stepResults.length > 0 && (
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mb-6">
                <h3 className="font-bold text-gray-900 mb-4">📝 단계별 채점 결과</h3>
                <div className="space-y-3">
                  {stepResults.map((result: any) => (
                    <div
                      key={result.stepNumber}
                      className={`p-4 rounded-lg border-2 ${
                        result.isCorrect
                          ? "bg-green-50 border-green-300"
                          : result.score >= 60
                          ? "bg-blue-50 border-blue-300"
                          : "bg-orange-50 border-orange-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-700">
                            단계 {result.stepNumber}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              result.isCorrect
                                ? "text-green-600"
                                : result.score >= 60
                                ? "text-blue-600"
                                : "text-orange-600"
                            }`}
                          >
                            {result.score}점
                          </span>
                        </div>
                        <span className="text-2xl">
                          {result.isCorrect ? "✅" : result.score >= 60 ? "🔵" : "⚠️"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mb-2">
                        <span className="font-semibold">당신의 답변: </span>
                        {result.userAnswer}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">피드백: </span>
                        {result.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
              <h3 className="font-bold text-gray-900 mb-2">✅ 정답 및 해설</h3>
              <p className="text-gray-800 mb-3">{problem.correctAnswer}</p>
              <p className="text-gray-700 text-sm">{problem.explanation}</p>
            </div>

            {/* 문제 분해 모범 단계 */}
            {problem.type === "PROBLEM_DECOMPOSITION" && problem.steps && (
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mb-6">
                <h3 className="font-bold text-gray-900 mb-4">📋 모범 단계별 해결 과정</h3>
                <div className="space-y-4">
                  {problem.steps.map((step) => (
                    <div key={step.id} className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {step.stepNumber}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{step.title}</h4>
                          <p className="text-sm text-gray-700 mb-2">{step.description}</p>
                          {step.correctAnswer && (
                            <div className="bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">
                              <span className="font-semibold text-green-700">모범 답안: </span>
                              <span className="text-gray-800">{step.correctAnswer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
