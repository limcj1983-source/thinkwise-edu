import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * API 라우트에서 세션을 검증하고 사용자 정보를 반환
 */
export async function getAuthSession() {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  return session;
}

/**
 * 인증이 필요한 API 라우트에서 사용
 * 세션이 없으면 401 에러 반환
 */
export async function requireAuth() {
  const session = await getAuthSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * 관리자 권한이 필요한 API 라우트에서 사용
 * 관리자/교사가 아니면 403 에러 반환
 */
export async function requireAdmin() {
  const session = await getAuthSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      ),
      session: null,
    };
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return {
      error: NextResponse.json(
        { error: "관리자 권한이 필요합니다" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * 학생 권한 확인
 */
export async function requireStudent() {
  const session = await getAuthSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      ),
      session: null,
    };
  }

  if (session.user.role !== "STUDENT") {
    return {
      error: NextResponse.json(
        { error: "학생만 접근 가능합니다" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}
