# 🚀 ThinkWise 빠른 시작 가이드

프로젝트를 바로 실행하고 확인할 수 있는 가이드입니다!

## ✅ 사전 준비 완료 사항

- ✅ NextAuth.js v5 인증 시스템
- ✅ 실시간 통계 대시보드
- ✅ 무료 사용자 일일 제한 (3문제)
- ✅ NEXTAUTH_SECRET 자동 생성됨
- ✅ 환경 변수 설정 완료

## 🏃 1단계: 프로젝트 실행

### Option A: pnpm 사용 (권장)

```bash
# pnpm 설치 (아직 없다면)
npm install -g pnpm

# 프로젝트 디렉토리로 이동
cd /mnt/c/Users/USER/Projects/thinkwise-edu

# 의존성 설치
pnpm install

# Prisma 클라이언트 생성
pnpm generate

# 데이터베이스 초기화 (이미 되어있다면 스킵 가능)
pnpm db:push

# 개발 서버 실행
pnpm dev
```

### Option B: npm 사용

```bash
# 프로젝트 디렉토리로 이동
cd /mnt/c/Users/USER/Projects/thinkwise-edu

# 의존성 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 초기화
npx prisma db push

# 개발 서버 실행
npm run dev
```

## 🌐 2단계: 브라우저에서 확인

서버가 실행되면 다음 주소로 접속하세요:

### 홈페이지
```
http://localhost:3001
```

### 주요 페이지들
- 홈: http://localhost:3001
- 회원가입: http://localhost:3001/signup
- 로그인: http://localhost:3001/login
- 대시보드: http://localhost:3001/dashboard (로그인 필요)
- 관리자: http://localhost:3001/admin (교사/관리자만)

## 👤 3단계: 테스트 계정 생성

### 학생 계정 만들기

1. http://localhost:3001/signup 접속
2. 다음 정보 입력:
   ```
   이름: 테스트학생
   이메일: student@test.com
   가입 유형: 학생 선택
   학년: 3학년 선택
   비밀번호: test1234
   비밀번호 확인: test1234
   약관 동의: 체크
   ```
3. "가입하기" 클릭
4. 자동으로 로그인 페이지로 이동

### 로그인하기

1. http://localhost:3001/login 접속
2. 로그인 정보 입력:
   ```
   이메일: student@test.com
   비밀번호: test1234
   ```
3. "로그인" 클릭
4. 대시보드로 이동!

## 📊 4단계: 주요 기능 확인

### ✅ 대시보드 (자동 이동됨)
- 환영 메시지 확인
- **오늘의 학습 📊** 카드 확인:
  - 푼 문제: 0
  - 정답률: 0%
  - 남은 문제: 3
- 두 가지 문제 유형 카드 확인

### ✅ 통계 기능 테스트

현재는 문제가 없어서 풀 수 없지만, 통계 시스템은 준비되어 있습니다!

**문제를 추가하려면** (선택사항):
1. Gemini API 키 발급: https://makersuite.google.com/app/apikey
2. `.env` 파일의 `GEMINI_API_KEY` 업데이트
3. 터미널에서 문제 생성:
   ```bash
   pnpm gen:problems -- --type=AI_VERIFICATION --count=3 --grade=3
   ```
4. http://localhost:3001/admin 에서 문제 승인
5. 문제 풀이 후 통계 확인!

## 🎯 5단계: 기능별 확인

### 1️⃣ 인증 시스템
- ✅ 회원가입 동작
- ✅ 로그인 동작
- ✅ 세션 유지 (페이지 새로고침)
- ✅ 로그아웃 동작

### 2️⃣ 대시보드
- ✅ 사용자 정보 표시
- ✅ 실시간 통계 (푼 문제 0개일 때)
- ✅ 문제 유형 카드
- ✅ 프리미엄 업그레이드 안내

### 3️⃣ 무료 제한 (문제 생성 후 테스트 가능)
- [ ] 3문제 풀기
- [ ] 4번째 문제 제출 시 차단
- [ ] 제한 알림 메시지

### 4️⃣ 관리자 페이지
- ✅ 접근 제어 (학생은 못 들어감)
- ✅ 통계 카드
- ✅ 문제 검토 시스템

## 🔍 6단계: API 직접 확인 (선택사항)

### 세션 확인
개발자 도구 (F12) → Application → Cookies에서 확인:
- `next-auth.session-token` 쿠키 존재 확인

### API 호출 (로그인 후)
```bash
# 오늘의 통계
curl http://localhost:3001/api/stats/today

# 전체 통계
curl http://localhost:3001/api/stats/overall
```

## 📱 7단계: UI 확인

### 홈페이지 확인사항
- ✅ "AI 시대, 생각하는 힘을 키워요" 제목
- ✅ 두 가지 핵심 학습 카드
- ✅ 요금제 (무료/프리미엄)
- ✅ "무료로 시작하기" 버튼

### 대시보드 확인사항
- ✅ 환영 메시지
- ✅ 오늘의 학습 통계 카드 (로딩 → 데이터)
- ✅ AI 정보 검증 카드
- ✅ 문제 분해하기 카드
- ✅ 프리미엄 안내 배너

## 🐛 문제 해결

### "pnpm: command not found"
```bash
npm install -g pnpm
```

### 포트 3001이 사용 중
```bash
# 다른 프로세스 종료 후 재시도
# 또는 package.json의 dev 스크립트에서 포트 변경
```

### "NEXTAUTH_SECRET is not set"
→ 이미 설정되어 있습니다! 서버 재시작하세요.

### 데이터베이스 오류
```bash
npx prisma db push
npx prisma generate
```

### 세션이 유지되지 않음
→ 브라우저 쿠키 설정 확인
→ http (https 아님) 사용 확인

## 📊 현재 상태 요약

### ✅ 완전히 작동하는 기능
1. **인증 시스템**
   - 회원가입/로그인/로그아웃
   - NextAuth.js v5 JWT
   - 역할 기반 접근 제어

2. **대시보드**
   - 실시간 통계 표시
   - 무료/프리미엄 구분
   - 반응형 UI

3. **API**
   - 세션 검증
   - 통계 조회
   - 관리자 권한 체크

### ⚠️ 문제 생성 필요
문제를 풀려면 Gemini API 키가 필요합니다:
1. API 키 발급
2. 문제 생성 스크립트 실행
3. 관리자 페이지에서 승인

### 🎯 다음 단계
문제 생성 후:
- 문제 풀이 테스트
- 무료 제한 테스트 (3문제)
- 통계 업데이트 확인

## 🎉 완료!

ThinkWise가 성공적으로 실행되었습니다!

**확인한 내용:**
- [ ] 서버 실행
- [ ] 회원가입
- [ ] 로그인
- [ ] 대시보드 접근
- [ ] 통계 카드 (0개)

**다음 작업:**
- [ ] Gemini API 키 설정 (문제 생성 위해)
- [ ] 문제 생성 및 승인
- [ ] 실제 문제 풀이 테스트

---

**도움이 필요하면:** TESTING.md, AUTH_SETUP.md, STATISTICS_FEATURE.md 참조
