import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "ThinkWise - AI 시대 비판적 사고 교육",
  description: "초등학생을 위한 AI 정보 검증 및 문제 해결 능력 향상 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
