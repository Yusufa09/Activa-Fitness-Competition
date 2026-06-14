"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { isValidEmail } from "@/lib/validation";

export default function GymSignupPage() {
  const router = useRouter();
  const [gymName, setGymName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gymCode, setGymCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);

    const res = await fetch("/api/gym/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gym_name: gymName.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not create gym.");
      setLoading(false);
      return;
    }
    setGymCode(data.gym.gym_code);
    setLoading(false);
  }

  async function handleContinue() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithPassword({ email: email.trim(), password });
    router.push("/admin/dashboard");
  }

  function copyCode() {
    if (!gymCode) return;
    navigator.clipboard.writeText(gymCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (gymCode) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-600 rounded-xl mb-4">
            <Check className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Gym created! 🎉</h1>
          <p className="text-slate-500 text-sm mt-1 mb-6">Share this code with your members so they can join.</p>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6">
            <p className="text-xs uppercase text-orange-600 font-medium tracking-wide">Your Gym Code</p>
            <p className="text-4xl font-black text-orange-700 tracking-widest mt-1">{gymCode}</p>
            <button onClick={copyCode} className="mt-3 inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-800">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy code"}
            </button>
          </div>

          <Button onClick={handleContinue} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold">
            {loading ? "Signing in..." : "Continue to Admin →"}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-slate-800">Create a Gym</h1>
          <p className="text-slate-500 text-sm mt-1">Set up your gym and admin account.</p>
        </div>

        <form onSubmit={handleSignup} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-700 text-sm">Gym Name</Label>
            <Input value={gymName} onChange={(e) => setGymName(e.target.value)} placeholder="e.g. Orange Theory Downtown" disabled={loading}
              className="border-slate-300 focus:border-orange-500 focus:ring-orange-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-sm">First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jordan" disabled={loading}
                className="border-slate-300 focus:border-orange-500 focus:ring-orange-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-sm">Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" disabled={loading}
                className="border-slate-300 focus:border-orange-500 focus:ring-orange-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-700 text-sm">Your Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={loading}
              className="border-slate-300 focus:border-orange-500 focus:ring-orange-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-700 text-sm">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" disabled={loading}
              className="border-slate-300 focus:border-orange-500 focus:ring-orange-500" />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold">
            {loading ? "Creating..." : "Create Gym"}
          </Button>
        </form>

        <p className="text-center mt-4 text-slate-400 text-xs">
          <a href="/admin" className="hover:text-slate-600">← Back to login</a>
        </p>
      </div>
    </main>
  );
}
