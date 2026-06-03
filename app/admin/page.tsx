"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-600 rounded-xl mb-4">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
          <p className="text-slate-500 text-sm mt-1">Gym manager access only</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-700 text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              className="border-slate-300 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-700 text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="border-slate-300 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-5 text-center space-y-2">
          <p className="text-sm text-slate-500">
            New gym?{" "}
            <a href="/admin/signup" className="text-orange-600 hover:underline font-medium">Create a gym →</a>
          </p>
          <p className="text-sm text-slate-500">
            Invited to manage a gym?{" "}
            <a href="/admin/accept-invite" className="text-orange-600 hover:underline font-medium">Accept invite →</a>
          </p>
          <p className="text-slate-400 text-xs pt-2">
            <a href="/" className="hover:text-slate-600">← Back to member app</a>
          </p>
        </div>
      </div>
    </main>
  );
}
