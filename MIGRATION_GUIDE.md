# 🔄 localStorage → NextAuth.js 마이그레이션 가이드

## 변경 사항 요약

기존의 **localStorage 기반 인증**을 **NextAuth.js v5 (JWT)** 로 교체했습니다.

## ⚠️ Breaking Changes

### 1. 세션 관리 방식 변경

#### 변경 전 (localStorage)
```typescript
import { getSession, setSession, clearSession } from '@/lib/session';

// 클라이언트 전용
const user = getSession();
```

#### 변경 후 (NextAuth)
```typescript
// 클라이언트 컴포넌트
import { useSession, signOut } from 'next-auth/react';

function Component() {
  const { data: session, status } = useSession();
  const user = session?.user;
}

// 서버 컴포넌트
import { auth } from '@/auth';

async function ServerComponent() {
  const session = await auth();
  const user = session?.user;
}
```

### 2. 로그인 방식 변경

#### 변경 전
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
const data = await response.json();
setSession(data.user);
```

#### 변경 후
```typescript
import { signIn } from 'next-auth/react';

await signIn('credentials', {
  email,
  password,
  redirect: false,
});
```

### 3. 로그아웃 방식 변경

#### 변경 전
```typescript
clearSession();
router.push('/login');
```

#### 변경 후
```typescript
import { signOut } from 'next-auth/react';

await signOut({ redirect: false });
router.push('/login');
```

## 📝 필요한 조치

### 1. 환경 변수 추가

`.env` 파일에 다음 추가:
```bash
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3001"
```

### 2. 의존성 재설치

```bash
pnpm install
npx prisma generate
```

### 3. 기존 사용자 데이터

**좋은 소식**: 기존 사용자 데이터는 그대로 유지됩니다!
- Prisma User 모델 변경 없음
- 비밀번호 해싱 방식 동일 (bcryptjs)

단, 기존에 localStorage에 저장된 세션은 무효화됩니다.

## 🔧 업데이트된 파일

### 새로 생성된 파일
- `auth.config.ts` - NextAuth 설정
- `auth.ts` - NextAuth 인스턴스
- `middleware.ts` - 라우트 보호
- `types/next-auth.d.ts` - 타입 정의
- `lib/auth-helpers.ts` - 서버 인증 헬퍼
- `components/providers/session-provider.tsx` - 세션 Provider
- `app/api/auth/[...nextauth]/route.ts` - API 핸들러

### 수정된 파일
- `app/layout.tsx` - SessionProvider 추가
- `app/login/page.tsx` - signIn 사용
- `app/dashboard/page.tsx` - useSession 사용
- `app/api/problems/submit/route.ts` - 세션 검증 추가
- `app/api/admin/**/*.ts` - 관리자 권한 검증 추가
- `.env.example` - NextAuth 환경 변수 추가
- `README.md` - 인증 시스템 설명 추가

### 더 이상 사용하지 않는 파일
- ~~`lib/session.ts`~~ (삭제하지는 않았지만 사용 안 함)
- ~~`app/api/auth/login/route.ts`~~ (NextAuth가 자동 처리)

## ✅ 테스트 체크리스트

- [ ] 회원가입 동작 확인
- [ ] 로그인 동작 확인
- [ ] 로그아웃 동작 확인
- [ ] 대시보드 접근 확인
- [ ] 관리자 페이지 접근 확인 (TEACHER/ADMIN)
- [ ] 학생이 관리자 페이지 접근 시 차단 확인
- [ ] 문제 제출 API 동작 확인
- [ ] 세션 유지 확인 (페이지 새로고침)

## 🎯 주요 개선 사항

### 보안
- ✅ 서버사이드 세션 검증 (JWT)
- ✅ CSRF 보호
- ✅ XSS 보호 (localStorage 대신 httpOnly 쿠키)
- ✅ 역할 기반 접근 제어

### 사용자 경험
- ✅ 자동 리다이렉트
- ✅ 세션 만료 자동 처리
- ✅ 로딩 상태 관리

### 개발자 경험
- ✅ TypeScript 완전 지원
- ✅ 서버/클라이언트 컴포넌트 모두 지원
- ✅ 재사용 가능한 인증 헬퍼

## 🐛 문제 발생 시

### 로그인 후 리다이렉트 실패
```typescript
// 수동 리다이렉트 추가
const result = await signIn('credentials', {
  email,
  password,
  redirect: false
});

if (result?.ok) {
  router.push('/dashboard');
  router.refresh(); // 중요!
}
```

### 세션이 null로 나옴
```typescript
// SessionProvider가 올바르게 설정되었는지 확인
// app/layout.tsx
<SessionProvider>{children}</SessionProvider>
```

### TypeScript 타입 오류
```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 타입 캐시 삭제
rm -rf .next
```

## 📚 추가 자료

- [NextAuth.js v5 문서](https://authjs.dev/)
- [JWT 이해하기](https://jwt.io/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**마이그레이션 완료일**: 2025-10-24
