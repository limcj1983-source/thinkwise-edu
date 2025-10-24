// 간단한 세션 관리 (브라우저 localStorage 기반)
// TODO: 실제 프로덕션에서는 NextAuth.js나 JWT 사용

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  grade?: number;
  subscription: string;
}

export function setSession(user: SessionUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export function getSession(): SessionUser | null {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
}
