# 🔐 NextAuth.js 인증 시스템 설정 가이드

ThinkWise 프로젝트에 NextAuth.js v5를 사용한 인증 시스템이 성공적으로 구현되었습니다!

## ✅ 완료된 작업

### 1. NextAuth.js 설정
- ✅ `auth.config.ts` - NextAuth 설정 파일
- ✅ `auth.ts` - NextAuth 인스턴스
- ✅ `middleware.ts` - 라우트 보호 미들웨어
- ✅ `app/api/auth/[...nextauth]/route.ts` - API 핸들러

### 2. 타입 정의
- ✅ `types/next-auth.d.ts` - TypeScript 타입 확장

### 3. 세션 관리
- ✅ `components/providers/session-provider.tsx` - 클라이언트 세션 Provider
- ✅ `lib/auth-helpers.ts` - 서버사이드 인증 헬퍼 함수

### 4. API 엔드포인트 보안
- ✅ `/api/problems/submit` - 학생 인증 필요
- ✅ `/api/admin/stats` - 관리자 권한 필요
- ✅ `/api/admin/problems` - 관리자 권한 필요
- ✅ `/api/admin/problems/[id]` - 관리자 권한 필요
- ✅ `/api/admin/problems/[id]/approve` - 관리자 권한 필요

### 5. 페이지 업데이트
- ✅ `/login` - NextAuth signIn 사용
- ✅ `/dashboard` - NextAuth useSession 사용

## 🚀 환경 설정

### 1. .env 파일 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
# 비밀 키 생성: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key-here"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### 2. 비밀 키 생성

터미널에서 다음 명령어를 실행하여 NEXTAUTH_SECRET을 생성하세요:

```bash
openssl rand -base64 32
```

생성된 키를 `.env` 파일의 `NEXTAUTH_SECRET`에 복사하세요.

### 3. Prisma 클라이언트 재생성

```bash
npx prisma generate
npx prisma db push
```

## 📋 인증 시스템 기능

### 🔒 라우트 보호

`middleware.ts`가 다음 라우트를 자동으로 보호합니다:

- `/dashboard` - 로그인 필요
- `/problems` - 로그인 필요
- `/admin` - 관리자/교사만 접근 가능

### 🛡️ API 보안

#### 인증 필요 (requireAuth)
```typescript
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  // session.user.id로 사용자 정보 접근
  const userId = session.user.id;
}
```

#### 관리자 권한 필요 (requireAdmin)
```typescript
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET() {
  const { error, session } = await requireAdmin();
  if (error) return error;

  // 관리자/교사만 접근 가능
}
```

## 🧪 테스트 방법

### 1. 회원가입
```bash
POST /api/auth/signup
{
  "name": "테스트학생",
  "email": "student@test.com",
  "password": "test1234",
  "role": "STUDENT",
  "grade": 3
}
```

### 2. 로그인
브라우저에서:
1. http://localhost:3001/login 접속
2. 이메일: student@test.com
3. 비밀번호: test1234
4. 로그인 클릭
5. 자동으로 /dashboard로 리다이렉트

### 3. 세션 확인
```typescript
// 클라이언트 컴포넌트
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Not logged in</div>;

  return <div>Welcome {session.user.name}!</div>;
}
```

```typescript
// 서버 컴포넌트
import { auth } from '@/auth';

async function MyServerComponent() {
  const session = await auth();

  if (!session) return <div>Not logged in</div>;

  return <div>Welcome {session.user.name}!</div>;
}
```

## 🔑 사용자 역할

### STUDENT (학생)
- 문제 풀이
- 대시보드 접근
- 개인 통계 확인

### TEACHER (교사)
- 학생 권한 + 관리자 페이지 접근
- 문제 검토 및 승인
- 통계 확인

### ADMIN (관리자)
- 모든 권한
- 사용자 관리 (향후 구현)

## 📚 관련 파일

### 인증 설정
- `auth.config.ts` - NextAuth 설정
- `auth.ts` - NextAuth 인스턴스
- `middleware.ts` - 라우트 보호

### 타입
- `types/next-auth.d.ts` - TypeScript 타입

### 헬퍼
- `lib/auth-helpers.ts` - 서버사이드 인증 헬퍼

### 구성요소
- `components/providers/session-provider.tsx` - 세션 Provider

### API
- `app/api/auth/[...nextauth]/route.ts` - NextAuth API

## 🎯 다음 단계

1. **실시간 통계 대시보드 구현**
   - 오늘 푼 문제 수
   - 정답률
   - 남은 문제 수

2. **프리미엄 기능**
   - AI 상세 피드백
   - 개인 맞춤 문제

3. **사용자 프로필**
   - 프로필 편집
   - 비밀번호 변경
   - 학습 기록

## 🐛 문제 해결

### "NEXTAUTH_SECRET is not set" 오류
→ `.env` 파일에 `NEXTAUTH_SECRET` 추가

### 로그인 후 리다이렉트 안됨
→ `NEXTAUTH_URL`이 올바른지 확인

### 세션이 유지되지 않음
→ 브라우저 쿠키 설정 확인

### TypeScript 타입 오류
→ `npx prisma generate` 실행

## ✨ 주요 변경사항

### 변경 전 (localStorage)
```typescript
// ❌ 안전하지 않음
const user = getSession(); // localStorage에서 가져옴
```

### 변경 후 (NextAuth)
```typescript
// ✅ 안전함
const session = await auth(); // 서버에서 JWT 검증
const { data: session } = useSession(); // 클라이언트
```

## 📖 참고 자료

- [NextAuth.js v5 문서](https://authjs.dev/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma 문서](https://www.prisma.io/docs)

---

**구현 완료일**: 2025-10-24
**버전**: 1.0.0
