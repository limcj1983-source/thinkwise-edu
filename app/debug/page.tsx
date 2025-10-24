"use client";

import { useEffect, useState } from "react";
import { getSession, clearSession } from "@/lib/session";

export default function DebugPage() {
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const data = getSession();
    setSessionData(data);
  }, []);

  const handleClear = () => {
    clearSession();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">세션 디버그 페이지</h1>

        <div className="mb-4">
          <h2 className="font-semibold mb-2">현재 localStorage 내용:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(sessionData, null, 2)}
          </pre>
        </div>

        <button
          onClick={handleClear}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
        >
          세션 삭제하고 새로고침
        </button>

        <div className="mt-4">
          <a href="/login" className="text-blue-600 hover:underline">
            → 로그인 페이지로
          </a>
        </div>
      </div>
    </div>
  );
}
