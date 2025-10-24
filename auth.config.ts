import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // Providers will be added in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnProblems = nextUrl.pathname.startsWith("/problems");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnAuth = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/signup");

      // 관리자 페이지 접근 체크
      if (isOnAdmin) {
        if (!isLoggedIn) {
          return false; // 로그인 페이지로 리다이렉트
        }
        // 관리자 또는 교사만 접근 가능
        if (auth.user.role !== "ADMIN" && auth.user.role !== "TEACHER") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }

      // 대시보드나 문제 페이지는 로그인 필요
      if ((isOnDashboard || isOnProblems) && !isLoggedIn) {
        return false;
      }

      // 이미 로그인한 사용자가 로그인/회원가입 페이지 접근 시 대시보드로
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.grade = user.grade;
        token.subscription = user.subscription;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.grade = token.grade as number | null;
        session.user.subscription = token.subscription as string;
      }
      return session;
    },
  },
};
