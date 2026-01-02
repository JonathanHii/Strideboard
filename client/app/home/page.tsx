"use client";

import { useEffect, useState } from "react";
import { homeService } from "@/services/homeService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [message, setMessage] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await homeService.getWelcomeMessage();
        setMessage(data.message);
      } catch (err: any) {
        setError(err.message);
        // If it's an auth error, kick them back to login
        if (err.message.includes("Unauthorized")) {
          authService.logout();
          router.push("/login");
        }
      }
    };

    loadData();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Strideboard Home</h1>
        
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          {error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p className="text-blue-800 font-medium">{message}</p>
          )}
        </div>

        <button
          onClick={() => {
            authService.logout();
            router.push("/login");
          }}
          className="mt-8 w-full rounded-lg bg-gray-800 py-2 text-white hover:bg-gray-900 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}