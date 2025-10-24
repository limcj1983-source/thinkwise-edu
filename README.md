# 🎓 ThinkWise - AI 시대 비판적 사고 교육 플랫폼

초등학생을 위한 AI 정보 검증 및 문제 해결 능력 향상 플랫폼

## 🎯 프로젝트 목표

AI 시대에 학생들이:
1. **AI 정보 검증**: AI가 제공하는 정보의 오류를 판단하고 비판적으로 사고
2. **문제 분해**: 복잡한 실생활 문제를 논리적으로 단계별로 분해하여 해결

## 🚀 기술 스택

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (Prisma ORM)
- **Authentication**: NextAuth.js v5 (JWT)
- **AI**: OpenAI GPT-4 / Google Gemini

## 📊 개발 단계

### ✅ Phase 1: 핵심 기능 완성 (완료)
- ✅ NextAuth.js v5 인증 시스템
- ✅ AI 배치 문제 생성 (Gemini)
- ✅ 교사 검토 시스템
- ✅ 실시간 통계 대시보드
- ✅ 무료 사용자 일일 제한 (3문제)
- ✅ 프리미엄 구독 시스템

### 🚧 Phase 2: 프리미엄 기능 (진행 중)
- [ ] OpenAI GPT-4 AI 상세 피드백
- [ ] 개인 맞춤 문제 생성
- [ ] 학습 분석 대시보드
- [ ] 결제 시스템 연동

### 🔮 Phase 3: 확장 기능 (계획)
- [ ] 리더보드 & 순위
- [ ] 배지/업적 시스템
- [ ] 친구 초대 & 경쟁
- [ ] AI 튜터 기능

## 💰 수익 모델

- **무료 (FREE)**: 하루 3문제, 기본 피드백
- **프리미엄 (PREMIUM)**: 무제한 문제, AI 상세 피드백, 학습 분석 대시보드

## 🛠️ 개발 명령어

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 필요한 값 입력:
# - NEXTAUTH_SECRET (openssl rand -base64 32)
# - GEMINI_API_KEY

# 데이터베이스 초기화
pnpm db:push
pnpm generate

# 개발 서버 실행
pnpm dev

# 데이터베이스 관리 UI
pnpm db:studio
```

## 🔐 인증 시스템

NextAuth.js v5를 사용한 안전한 인증 시스템:
- JWT 기반 세션 관리
- 역할 기반 접근 제어 (STUDENT, TEACHER, ADMIN)
- API 라우트 보호
- 자동 리다이렉트

자세한 내용은 [AUTH_SETUP.md](./AUTH_SETUP.md) 참조

## ⭐ 주요 기능

### 🔐 인증 & 보안
- NextAuth.js v5 JWT 인증
- 역할 기반 접근 제어 (STUDENT, TEACHER, ADMIN)
- 서버사이드 세션 검증
- API 라우트 보호

### 📊 실시간 통계
- 오늘의 학습 통계 (푼 문제, 정답률)
- 전체 학습 기록
- 연속 학습 일수 추적
- 문제 유형별 분석

### 🎯 무료/프리미엄 모델
- 무료: 하루 3문제 + 기본 피드백
- 프리미엄: 무제한 + AI 피드백
- 자동 제한 체크 & 업그레이드 유도

### 🤖 AI 문제 생성
- Google Gemini API 연동
- 학년별 맞춤 문제
- 교사 검토 & 승인 시스템
- 2가지 문제 유형

## 📁 프로젝트 구조

```
thinkwise-edu/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 (login, signup)
│   ├── dashboard/         # 학생 대시보드
│   ├── problems/          # 문제 목록 & 풀이
│   ├── admin/             # 관리자 페이지
│   └── api/               # API 엔드포인트
│       ├── auth/          # NextAuth
│       ├── stats/         # 통계 API
│       ├── problems/      # 문제 API
│       └── admin/         # 관리자 API
├── components/            # 재사용 컴포넌트
│   └── providers/         # SessionProvider
├── lib/                   # 유틸리티
│   ├── auth-helpers.ts    # 인증 헬퍼
│   ├── prisma.ts          # Prisma 클라이언트
│   └── gemini.ts          # Gemini API
├── prisma/                # 데이터베이스
│   └── schema.prisma      # 스키마 정의
├── scripts/               # 스크립트
│   └── generate-problems.ts  # AI 문제 생성
└── types/                 # TypeScript 타입
```

## 📋 데이터베이스 구조

- **User**: 사용자 (학생/교사)
- **Problem**: 문제
- **ProblemStep**: 문제 분해 단계
- **Attempt**: 학생 풀이 시도
- **Progress**: 학습 진도
- **AIGenerationLog**: AI 생성 로그

## 🤖 AI 문제 생성

배치 생성 시스템으로 시작:
- 매일 새벽 자동 실행
- Google Gemini 사용 (저비용)
- 교사 검토 후 활성화
- 품질 관리 시스템

### 문제 생성 스크립트 사용법

```bash
# AI 검증 문제 생성 (3학년, 10개)
pnpm gen:problems -- --type=AI_VERIFICATION --count=10 --grade=3

# 문제 분해 문제 생성 (5학년, 5개)
pnpm gen:problems -- --type=PROBLEM_DECOMPOSITION --count=5 --grade=5
```

**사전 준비사항**:
1. `.env` 파일에 `GEMINI_API_KEY` 설정 필요
2. Google AI Studio에서 API 키 발급: https://makersuite.google.com/app/apikey
3. 데이터베이스 초기화: `pnpm db:push`

## 👨‍🏫 제작자

대한민국 초등교사 - 교육적 프로그램 개발

---

**Version**: 0.1.0
**Created**: 2025년 1월
