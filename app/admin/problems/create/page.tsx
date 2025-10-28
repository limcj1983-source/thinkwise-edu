"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProblemType = "AI_VERIFICATION" | "PROBLEM_DECOMPOSITION";
type AnswerFormat = "SHORT_ANSWER" | "MULTIPLE_CHOICE" | "TRUE_FALSE";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface ProblemStep {
  stepNumber: number;
  title: string;
  description: string;
  hint: string;
}

export default function CreateProblemPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");
  const [loading, setLoading] = useState(false);

  // 수동 입력 폼 상태
  const [formData, setFormData] = useState({
    type: "AI_VERIFICATION" as ProblemType,
    answerFormat: "SHORT_ANSWER" as AnswerFormat,
    difficulty: "MEDIUM" as Difficulty,
    title: "",
    content: "",
    correctAnswer: "",
    explanation: "",
    subject: "",
    grade: 3,
    options: [] as string[], // 객관식 선택지
  });

  const [steps, setSteps] = useState<ProblemStep[]>([]);

  // AI 생성 폼 상태
  const [aiFormData, setAiFormData] = useState({
    type: "AI_VERIFICATION" as ProblemType,
    answerFormat: "SHORT_ANSWER" as AnswerFormat,
    difficulty: "MEDIUM" as Difficulty,
    subject: "",
    grade: 3,
    count: 1,
    language: "ko",
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/problems/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          options: formData.answerFormat === "MULTIPLE_CHOICE" ? formData.options : null,
          steps: formData.type === "PROBLEM_DECOMPOSITION" ? steps : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("문제가 생성되었습니다!");
        router.push("/admin/problems");
      } else {
        alert(data.error || "문제 생성에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to create problem:", error);
      alert("문제 생성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/problems/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiFormData),
      });

      const data = await response.json();

      if (response.ok) {
        let message = `${data.count}개의 문제가 생성되었습니다! 검토 페이지에서 확인하세요.`;

        // 일부 실패한 경우 경고 표시
        if (data.warning) {
          message += `\n\n⚠️ ${data.warning}`;
        }

        alert(message);
        router.push("/admin/review");
      } else {
        // 에러 메시지 구성
        let errorMessage = data.error || "AI 문제 생성에 실패했습니다";

        if (data.message) {
          errorMessage += `\n\n${data.message}`;
        }

        if (data.details) {
          if (typeof data.details === 'string') {
            errorMessage += `\n\n상세: ${data.details}`;
          } else if (Array.isArray(data.details)) {
            const errors = data.details.map((d: any) => `문제 ${d.index}: ${d.error}`).join('\n');
            errorMessage += `\n\n${errors}`;
          }
        }

        console.error("AI generation error:", data);
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Failed to generate problems:", error);
      alert("AI 문제 생성 중 네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        stepNumber: steps.length + 1,
        title: "",
        description: "",
        hint: "",
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof ProblemStep, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← 돌아가기
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">문제 생성</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "manual"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            ✍️ 수동 입력
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "ai"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            🤖 AI 생성
          </button>
        </div>

        {/* 수동 입력 탭 */}
        {activeTab === "manual" && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleManualSubmit}>
              <div className="space-y-6">
                {/* 문제 카테고리 & 답변 형식 */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      문제 카테고리 *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as ProblemType })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="AI_VERIFICATION">🔍 AI 정보 검증</option>
                      <option value="PROBLEM_DECOMPOSITION">🧩 문제 분해</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      문제의 주제/내용 유형을 선택하세요
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      답변 형식 *
                    </label>
                    <select
                      value={formData.answerFormat}
                      onChange={(e) =>
                        setFormData({ ...formData, answerFormat: e.target.value as AnswerFormat })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="SHORT_ANSWER">✍️ 주관식 (서술형)</option>
                      <option value="MULTIPLE_CHOICE">📝 객관식 (4지선다)</option>
                      <option value="TRUE_FALSE">⭕ OX 퀴즈 (참/거짓)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      학생이 답변하는 방식을 선택하세요
                    </p>
                  </div>
                </div>

                {/* 난이도 & 학년 */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      난이도 *
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData({ ...formData, difficulty: e.target.value as Difficulty })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="EASY">쉬움</option>
                      <option value="MEDIUM">보통</option>
                      <option value="HARD">어려움</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      대상 학년 *
                    </label>
                    <select
                      value={formData.grade}
                      onChange={(e) =>
                        setFormData({ ...formData, grade: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {[1, 2, 3, 4, 5, 6].map((grade) => (
                        <option key={grade} value={grade}>
                          초등 {grade}학년
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 주제 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    주제 *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="예: 과학, 역사, 수학"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* 제목 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    문제 제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="간단명료한 제목"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* 문제 내용 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    문제 내용 *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="학생들에게 제시할 문제 상황을 작성하세요"
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* 객관식 선택지 (MULTIPLE_CHOICE인 경우만) */}
                {formData.answerFormat === "MULTIPLE_CHOICE" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      객관식 선택지 (4개) *
                    </label>
                    <div className="space-y-2">
                      {["A", "B", "C", "D"].map((label, index) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 w-8">{label}.</span>
                          <input
                            type="text"
                            value={formData.options[index] || ""}
                            onChange={(e) => {
                              const newOptions = [...formData.options];
                              newOptions[index] = e.target.value;
                              setFormData({ ...formData, options: newOptions });
                            }}
                            placeholder={`선택지 ${label} 내용`}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 정답 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    정답 *
                  </label>
                  {formData.answerFormat === "MULTIPLE_CHOICE" ? (
                    <select
                      value={formData.correctAnswer}
                      onChange={(e) =>
                        setFormData({ ...formData, correctAnswer: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">정답 선택</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  ) : formData.answerFormat === "TRUE_FALSE" ? (
                    <select
                      value={formData.correctAnswer}
                      onChange={(e) =>
                        setFormData({ ...formData, correctAnswer: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">정답 선택</option>
                      <option value="O">O (참)</option>
                      <option value="X">X (거짓)</option>
                    </select>
                  ) : (
                    <textarea
                      value={formData.correctAnswer}
                      onChange={(e) =>
                        setFormData({ ...formData, correctAnswer: e.target.value })
                      }
                      placeholder="키워드 중심으로 작성 (자동 채점에 사용됨)"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  )}
                </div>

                {/* 해설 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    해설 *
                  </label>
                  <textarea
                    value={formData.explanation}
                    onChange={(e) =>
                      setFormData({ ...formData, explanation: e.target.value })
                    }
                    placeholder="정답에 대한 설명"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* 문제 분해 단계 (PROBLEM_DECOMPOSITION인 경우만) */}
                {formData.type === "PROBLEM_DECOMPOSITION" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-gray-700">
                        문제 해결 단계
                      </label>
                      <button
                        type="button"
                        onClick={addStep}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        + 단계 추가
                      </button>
                    </div>

                    {steps.map((step, index) => (
                      <div
                        key={index}
                        className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            단계 {step.stepNumber}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            삭제
                          </button>
                        </div>

                        <div className="space-y-3">
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateStep(index, "title", e.target.value)}
                            placeholder="단계 제목"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            required
                          />
                          <textarea
                            value={step.description}
                            onChange={(e) => updateStep(index, "description", e.target.value)}
                            placeholder="단계 설명"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            required
                          />
                          <input
                            type="text"
                            value={step.hint}
                            onChange={(e) => updateStep(index, "hint", e.target.value)}
                            placeholder="힌트 (선택사항)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 제출 버튼 */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400"
                  >
                    {loading ? "생성 중..." : "문제 생성하기"}
                  </button>
                  <Link
                    href="/admin/problems"
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-center"
                  >
                    취소
                  </Link>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* AI 생성 탭 */}
        {activeTab === "ai" && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                AI 자동 문제 생성 🤖
              </h2>
              <p className="text-gray-600">
                Google Gemini AI가 교육용 문제를 자동으로 생성합니다.
              </p>
            </div>

            <form onSubmit={handleAIGenerate}>
              <div className="space-y-6">
                {/* 문제 카테고리 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    문제 카테고리 *
                  </label>
                  <select
                    value={aiFormData.type}
                    onChange={(e) =>
                      setAiFormData({ ...aiFormData, type: e.target.value as ProblemType })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="AI_VERIFICATION">AI 정보 검증</option>
                    <option value="PROBLEM_DECOMPOSITION">문제 분해</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    문제의 주제와 내용 유형을 선택하세요
                  </p>
                </div>

                {/* 답변 형식 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    답변 형식 *
                  </label>
                  <select
                    value={aiFormData.answerFormat}
                    onChange={(e) =>
                      setAiFormData({ ...aiFormData, answerFormat: e.target.value as AnswerFormat })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="SHORT_ANSWER">주관식 (서술형)</option>
                    <option value="MULTIPLE_CHOICE">객관식 (4지선다)</option>
                    <option value="TRUE_FALSE">OX 퀴즈 (참/거짓)</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    학생이 답변하는 방식을 선택하세요
                  </p>
                </div>

                {/* 난이도 & 학년 */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      난이도 *
                    </label>
                    <select
                      value={aiFormData.difficulty}
                      onChange={(e) =>
                        setAiFormData({ ...aiFormData, difficulty: e.target.value as Difficulty })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="EASY">쉬움</option>
                      <option value="MEDIUM">보통</option>
                      <option value="HARD">어려움</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      대상 학년 *
                    </label>
                    <select
                      value={aiFormData.grade}
                      onChange={(e) =>
                        setAiFormData({ ...aiFormData, grade: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      {[1, 2, 3, 4, 5, 6].map((grade) => (
                        <option key={grade} value={grade}>
                          초등 {grade}학년
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 주제 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    주제 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={aiFormData.subject}
                    onChange={(e) => setAiFormData({ ...aiFormData, subject: e.target.value })}
                    placeholder="예: 과학, 역사 (비워두면 AI가 랜덤 선택)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* 언어 선택 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    언어 선택 *
                  </label>
                  <select
                    value={aiFormData.language}
                    onChange={(e) =>
                      setAiFormData({ ...aiFormData, language: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="ko">🇰🇷 한국어</option>
                    <option value="en">🇺🇸 English</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    문제가 선택한 언어로 생성됩니다
                  </p>
                </div>

                {/* 생성 개수 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    생성할 문제 개수 *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={aiFormData.count}
                    onChange={(e) =>
                      setAiFormData({ ...aiFormData, count: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">최대 10개까지 생성 가능</p>
                </div>

                {/* 안내 메시지 */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="mb-3">
                    <p className="text-sm text-purple-800 font-semibold mb-2">
                      💡 <strong>문제 카테고리:</strong>
                    </p>
                    <ul className="text-sm text-purple-800 space-y-1 ml-4 list-disc">
                      <li><strong>AI 정보 검증:</strong> AI가 제공한 정보에서 오류 찾기</li>
                      <li><strong>문제 분해:</strong> 복잡한 문제를 단계별로 해결하기</li>
                    </ul>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-purple-800 font-semibold mb-2">
                      📝 <strong>답변 형식:</strong>
                    </p>
                    <ul className="text-sm text-purple-800 space-y-1 ml-4 list-disc">
                      <li><strong>주관식:</strong> 학생이 직접 답을 서술</li>
                      <li><strong>객관식:</strong> 4개 선택지 중 정답 선택</li>
                      <li><strong>OX:</strong> 참/거짓 판단</li>
                    </ul>
                  </div>
                  <p className="text-sm text-purple-800">
                    ✨ 예: "AI 정보 검증 + 객관식" = AI가 제공한 정보를 객관식으로 판단
                  </p>
                  <p className="text-sm text-purple-800 mt-2">
                    📋 생성된 문제는 자동으로 "검토 대기" 상태가 되며, 관리자 검토 후 활성화됩니다.
                  </p>
                </div>

                {/* 제출 버튼 */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:bg-gray-400"
                  >
                    {loading ? "AI 생성 중..." : "AI로 문제 생성하기"}
                  </button>
                  <Link
                    href="/admin/problems"
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-center"
                  >
                    취소
                  </Link>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
