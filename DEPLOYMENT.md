# 🚀 ThinkWise 배포 가이드

어디서든 접근하고 업데이트할 수 있도록 온라인에 배포하는 방법입니다!

## ✅ 사전 준비 완료

- ✅ Git 저장소 초기화됨
- ✅ 첫 커밋 완료
- ✅ .gitignore 설정됨

## 📋 배포 프로세스

### 1단계: GitHub Repository 생성 (수동)

#### 1. GitHub 접속
https://github.com 에 로그인하세요.

#### 2. New Repository 클릭
- 우측 상단 `+` 버튼 → `New repository` 클릭

#### 3. Repository 정보 입력
```
Repository name: thinkwise-edu
Description: AI 시대 비판적 사고 교육 플랫폼 - 초등학생용
Visibility: Private (또는 Public - 선택)
```

**중요**:
- ❌ "Initialize this repository with a README" 체크 해제
- ❌ .gitignore 추가하지 않기 (이미 있음)
- ❌ License 추가하지 않기

#### 4. Create Repository 클릭

### 2단계: 로컬 코드를 GitHub에 Push

Repository가 생성되면 다음 명령어를 실행하세요:

```bash
cd /mnt/c/Users/USER/Projects/thinkwise-edu

# GitHub repository URL로 변경 (생성한 repository 주소)
git remote add origin https://github.com/YOUR_USERNAME/thinkwise-edu.git

# Main 브랜치로 이름 변경 (권장)
git branch -M main

# Push
git push -u origin main
```

**실제 명령어 (사용자명 확인 후):**
```bash
# limcj1983 계정이라면:
git remote add origin https://github.com/limcj1983/thinkwise-edu.git
git branch -M main
git push -u origin main
```

**인증 방법:**
- Personal Access Token 필요
- GitHub → Settings → Developer settings → Personal access tokens → Generate new token
- repo 권한 체크

### 3단계: Vercel 배포 (무료, 자동)

#### 1. Vercel 가입
https://vercel.com 접속
- "Sign Up" 클릭
- **"Continue with GitHub"** 선택 (권장)

#### 2. Import Project
- Dashboard에서 "Add New..." → "Project" 클릭
- GitHub repository 검색: `thinkwise-edu`
- "Import" 클릭

#### 3. 프로젝트 설정
**Framework Preset**: Next.js (자동 감지됨)

**Root Directory**: `./` (기본값)

**Build Command**:
```bash
npm run build
```

**Install Command**:
```bash
npm install
```

**Environment Variables**: 나중에 추가 (다음 단계)

#### 4. Deploy 클릭
- 2-3분 소요
- 완료되면 URL 제공 (예: `thinkwise-edu.vercel.app`)

### 4단계: 환경 변수 설정 (중요!)

Vercel Dashboard → 배포된 프로젝트 → Settings → Environment Variables

**필수 환경 변수:**

```
NEXTAUTH_SECRET
값: [새로 생성한 비밀키]
생성: openssl rand -base64 32
```

```
NEXTAUTH_URL
값: https://thinkwise-edu.vercel.app
(실제 배포된 URL)
```

```
DATABASE_URL
값: file:./dev.db
(또는 Vercel Postgres 사용)
```

```
GEMINI_API_KEY
값: [Google Gemini API 키]
(선택사항 - 문제 생성용)
```

**저장 후 Redeploy 필요:**
- Deployments → 최신 배포 → ... → Redeploy

### 5단계: 데이터베이스 설정

**Option A: Vercel Postgres (권장)**
```bash
# Vercel Dashboard에서
Storage → Create Database → Postgres
→ Connect to Project

# 자동으로 DATABASE_URL 설정됨
```

**Option B: Neon (무료 Postgres)**
```
https://neon.tech
→ 무료 계정 생성
→ Connection String 복사
→ Vercel Environment Variables에 추가
```

### Prisma 마이그레이션
```bash
# 로컬에서 스키마 변경 후
npx prisma generate
npx prisma db push

# Git commit & push
git add .
git commit -m "Update database schema"
git push

# Vercel에서 자동 재배포됨
```

## 🔄 업데이트 워크플로우

### 로컬에서 작업
```bash
# 코드 수정
# ...

# 커밋
git add .
git commit -m "Feature: 새 기능 추가"

# Push → 자동 배포!
git push
```

### 다른 컴퓨터에서 작업
```bash
# 처음 한 번만
git clone https://github.com/limcj1983/thinkwise-edu.git
cd thinkwise-edu
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 작업 시작
npm run dev
```

## 📍 주요 URL

### 로컬
- http://localhost:3000

### 프로덕션 (Vercel)
- https://thinkwise-edu.vercel.app
- https://thinkwise-edu-limcj1983.vercel.app (사용자명 포함)

### GitHub
- https://github.com/limcj1983/thinkwise-edu

### Vercel Dashboard
- https://vercel.com/dashboard

## 🛠️ 유용한 명령어

### Git 상태 확인
```bash
git status
git log --oneline
```

### 변경사항 확인
```bash
git diff
```

### 최신 코드 받기 (다른 컴퓨터에서)
```bash
git pull
npm install  # 의존성 업데이트
```

### Vercel CLI (선택사항)
```bash
npm i -g vercel
vercel login
vercel --prod  # 직접 배포
```

## 🔐 보안 체크리스트

- ✅ .env 파일이 .gitignore에 포함됨
- ✅ NEXTAUTH_SECRET이 강력함
- ✅ 환경 변수가 Vercel에만 있음
- ✅ Database URL이 안전함
- ⚠️ API 키가 노출되지 않음

## 📊 모니터링

### Vercel Analytics (무료)
- 실시간 방문자
- 성능 메트릭
- 오류 추적

### Vercel Logs
- 런타임 로그
- 빌드 로그
- 함수 로그

## 🚨 문제 해결

### 배포 실패
1. Vercel Logs 확인
2. 환경 변수 확인
3. Build Command 확인

### 데이터베이스 연결 실패
1. DATABASE_URL 확인
2. Prisma generate 실행됨
3. Migration 필요 여부

### 환경 변수 적용 안됨
1. Redeploy 필요
2. 철자 확인
3. 값에 공백 없는지 확인

## 🎯 다음 단계

1. **GitHub Personal Access Token 생성**
   - Settings → Developer settings
   - Generate token (repo 권한)

2. **GitHub에 Push**
   ```bash
   git remote add origin https://github.com/limcj1983/thinkwise-edu.git
   git push -u origin main
   ```

3. **Vercel 연결**
   - Import from GitHub
   - 환경 변수 설정
   - Deploy!

4. **테스트**
   - 배포된 URL 접속
   - 회원가입/로그인
   - 기능 확인

5. **도메인 연결 (선택)**
   - Vercel → Settings → Domains
   - 커스텀 도메인 추가

## ✨ 완료!

이제 어디서든 접근하고 업데이트할 수 있습니다!

- 🏠 **집**: 코드 수정 → git push → 자동 배포
- 🏢 **직장**: git pull → 최신 코드 받기 → 작업
- 📱 **모바일**: https://thinkwise-edu.vercel.app 접속

---

**도움말**:
- GitHub 문서: https://docs.github.com
- Vercel 문서: https://vercel.com/docs
- Next.js 배포: https://nextjs.org/docs/deployment
