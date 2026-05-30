"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSession } from "@/lib/member-session";
import { JoinForm } from "@/components/join/JoinForm";
import { Dumbbell } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      fetch(`/api/member/session?token=${session.device_token}`)
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
      <div className="min-h-screen flex items-center justify-center bg-teal-50">
        <div className="flex flex-col items-center gap-3 text-teal-600">
          <Dumbbell className="w-10 h-10 animate-pulse" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4 shadow-lg">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Gym Challenge</h1>
          <p className="text-slate-500 mt-2">Earn points. Beat your team&apos;s record.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Join Your Team</h2>
          <JoinForm />
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Gym manager?{" "}
          <a href="/admin" className="text-teal-600 hover:underline font-medium">
            Admin login →
          </a>
        </p>
      </div>
    </main>
  );
}
