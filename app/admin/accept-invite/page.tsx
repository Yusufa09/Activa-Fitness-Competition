"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell } from "lucide-react";
import { isValidEmail } from "@/lib/validation";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);

    const res = await fetch("/api/gym/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not create account.");
      setLoading(false);
      return;
    }

    // Log them in and go to the admin dashboard
    const supabase = createClient();
    await supabase.auth.signInWithPassword({ email: email.trim(), password });
    router.push("/admin/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-600 rounded-xl mb-4">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Accept Invite</h1>
          <p className="text-slate-500 text-sm mt-1">You were invited to manage a gym. Create your account.</p>
        </div>

        <form onSubmit={handleAccept} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
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
            <Label className="text-slate-700 text-sm">Email (the one you were invited with)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={loading}
              className="border-slate-300 focus:border-orange-500 focus:ring-orange-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-700 text-sm">Create a Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" disabled={loading}
              className="border-slate-300 focus:border-orange-500 focus:ring-orange-500" />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold">
            {loading ? "Creating..." : "Join Gym"}
          </Button>
        </form>

        <p className="text-center mt-4 text-slate-400 text-xs">
          <a href="/admin" className="hover:text-slate-600">← Back to login</a>
        </p>
      </div>
    </main>
  );
}
