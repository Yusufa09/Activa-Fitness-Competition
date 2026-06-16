"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSession } from "@/lib/member-session";
import { JoinForm } from "@/components/join/JoinForm";
import { Logo } from "@/components/Logo";

export default function JoinPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [gymCode, setGymCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("gym");
    if (code) setGymCode(code.toUpperCase());

    const session = loadSession();
    if (session) {
      fetch(`/api/member/session?token=${session.device_token}`, { cache: "no-store" })
        .then((res) => {
          if (res.ok) router.replace("/dashboard");
          else setChecking(false);
        })
        .catch(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Logo className="w-14 h-14 animate-pulse" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/activa-logo.png" alt="Activa" className="w-60 h-auto mx-auto -mb-2" />
          <p className="text-slate-500">Be active always.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Sign In</h2>
          <JoinForm prefilledGymCode={gymCode} />
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Gym administrator?{" "}
          <a href="/admin" className="text-orange-600 hover:underline font-medium">
            Administrator login →
          </a>
        </p>
      </div>
    </main>
  );
}
