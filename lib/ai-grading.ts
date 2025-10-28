/**
 * AI 기반 주관식 답안 채점 시스템
 * Gemini API를 사용하여 학생 답안을 의미적으로 평가합니다.
 */

interface GradingResult {
  isCorrect: boolean;
  score: number; // 0-100점
  feedback: string; // 학생에게 제공할 피드백
  reasoning: string; // 채점 근거
}

/**
 * 주관식 답안을 AI로 채점합니다
 * @param question 문제 내용
 * @param correctAnswer 정답 (모범 답안)
 * @param userAnswer 학생 답안
 * @param answerFormat 답변 형식 (SHORT_ANSWER만 AI 채점)
 * @returns 채점 결과
 */
export async function gradeAnswerWithAI(
  question: string,
  correctAnswer: string,
  userAnswer: string,
  answerFormat: string
): Promise<GradingResult> {
  // 객관식이나 OX는 정확한 매칭으로 처리
  if (answerFormat === 'MULTIPLE_CHOICE' || answerFormat === 'TRUE_FALSE') {
    const isCorrect = userAnswer.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      feedback: isCorrect ? '정답입니다!' : '오답입니다. 다시 생각해보세요.',
      reasoning: '객관식 문제는 정확한 선택지 매칭으로 채점됩니다.',
    };
  }

  // 주관식만 AI 채점
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다');
  }

  const prompt = `당신은 초등학생의 답안을 채점하는 친절한 선생님입니다.

다음 문제에 대한 학생의 답안을 평가해주세요:

**문제:**
${question}

**모범 답안:**
${correctAnswer}

**학생 답안:**
${userAnswer}

다음 기준으로 평가해주세요:
1. 핵심 개념을 이해하고 있는가?
2. 답변이 논리적이고 타당한가?
3. 모범 답안과 의미가 같거나 유사한가?

**채점 기준:**
- 100점: 모범 답안과 의미가 완전히 일치하거나 더 좋은 답변
- 80-90점: 핵심 내용은 맞지만 일부 부족하거나 표현이 다름
- 60-70점: 부분적으로 맞지만 중요한 내용이 빠짐
- 40-50점: 일부만 맞고 많은 부분이 틀림
- 0-30점: 대부분 틀렸거나 관련 없는 답변

아래 JSON 형식으로만 답변해주세요:
{
  "score": 점수(0-100),
  "isCorrect": 60점 이상이면 true, 아니면 false,
  "feedback": "학생에게 제공할 친절한 피드백 (1-2문장, 한국어)",
  "reasoning": "채점 근거 설명 (한국어)"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // 낮은 온도로 일관된 채점
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('AI 응답을 받지 못했습니다');
    }

    // JSON 파싱 (코드 블록 제거)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 응답 형식이 올바르지 않습니다');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      isCorrect: result.isCorrect,
      score: result.score,
      feedback: result.feedback,
      reasoning: result.reasoning,
    };

  } catch (error) {
    console.error('AI grading error:', error);

    // AI 채점 실패 시 폴백: 간단한 키워드 매칭
    const userAnswerLower = userAnswer.toLowerCase().trim();
    const correctAnswerLower = correctAnswer.toLowerCase().trim();

    // 정답의 주요 키워드들이 학생 답안에 포함되어 있는지 확인
    const keywords = correctAnswerLower.split(' ').filter(w => w.length > 2);
    const matchedKeywords = keywords.filter(keyword =>
      userAnswerLower.includes(keyword)
    );

    const matchRate = keywords.length > 0
      ? (matchedKeywords.length / keywords.length) * 100
      : 0;

    const isCorrect = matchRate >= 60;

    return {
      isCorrect,
      score: Math.round(matchRate),
      feedback: isCorrect
        ? '좋습니다! 핵심 내용을 잘 이해하셨네요.'
        : '조금 더 자세히 설명해보세요.',
      reasoning: 'AI 채점 시스템 오류로 인해 키워드 매칭으로 대체 채점했습니다.',
    };
  }
}

/**
 * 문제 분해 단계의 답안을 채점합니다
 * @param stepTitle 단계 제목
 * @param stepDescription 단계 설명
 * @param correctAnswer 정답
 * @param userAnswer 학생 답안
 * @param answerFormat 답변 형식
 * @returns 채점 결과
 */
export async function gradeStepAnswer(
  stepTitle: string,
  stepDescription: string,
  correctAnswer: string,
  userAnswer: string,
  answerFormat: string
): Promise<GradingResult> {
  // 단계 문제는 제목과 설명을 합쳐서 문제로 전달
  const question = `${stepTitle}\n${stepDescription}`;
  return gradeAnswerWithAI(question, correctAnswer, userAnswer, answerFormat);
}
