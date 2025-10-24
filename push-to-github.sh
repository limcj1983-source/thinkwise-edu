#!/bin/bash

# ThinkWise GitHub Push 스크립트
# 사용법: ./push-to-github.sh

echo "🚀 ThinkWise를 GitHub에 업로드합니다..."
echo ""

# GitHub 사용자명 확인
read -p "GitHub 사용자명을 입력하세요 (예: limcj1983): " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ 사용자명이 비어있습니다."
    exit 1
fi

echo ""
echo "📦 Repository: https://github.com/$GITHUB_USER/thinkwise-edu"
echo ""
read -p "위 주소가 맞나요? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "❌ 취소되었습니다."
    exit 1
fi

# Remote 추가
echo ""
echo "🔗 Remote 추가 중..."
git remote add origin "https://github.com/$GITHUB_USER/thinkwise-edu.git" 2>/dev/null || \
git remote set-url origin "https://github.com/$GITHUB_USER/thinkwise-edu.git"

# Main 브랜치로 변경
echo "🌿 Main 브랜치로 전환 중..."
git branch -M main

# Push
echo "⬆️  GitHub에 업로드 중..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 성공! GitHub에 업로드되었습니다!"
    echo ""
    echo "📍 다음 단계:"
    echo "1. https://github.com/$GITHUB_USER/thinkwise-edu 확인"
    echo "2. https://vercel.com 에서 Import"
    echo "3. 환경 변수 설정"
    echo "4. Deploy!"
    echo ""
    echo "📖 자세한 가이드: DEPLOYMENT.md"
else
    echo ""
    echo "❌ Push 실패. Personal Access Token이 필요할 수 있습니다."
    echo ""
    echo "🔑 토큰 생성:"
    echo "1. https://github.com/settings/tokens"
    echo "2. Generate new token (classic)"
    echo "3. repo 권한 체크"
    echo "4. 생성된 토큰을 비밀번호로 사용"
fi
