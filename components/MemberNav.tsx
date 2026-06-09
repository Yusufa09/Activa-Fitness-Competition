"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, loadSession } from "@/lib/member-session";
import { Dumbbell, LayoutGrid, Trophy, LogOut, Activity } from "lucide-react";

export function MemberNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [gymName, setGymName] = useState("");
  const [bodyScan, setBodyScan] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const s = loadSession();
    setGymName(s?.gym_name ?? "");
    setBodyScan(!!s?.body_scan_enabled);
  }, []);

  async function doSignOut() {
    setSigningOut(true);
    const token = loadSession()?.device_token;
    // Invalidate the session server-side first so it can't be re-saved
    if (token) {
      try {
        await fetch("/api/member/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_token: token }),
        });
      } catch {
        // best-effort — still clear locally below
      }
    }
    clearSession();
    router.replace("/");
  }

  const items = [
    { href: "/dashboard", label: "My Progress", icon: LayoutGrid },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ...(bodyScan ? [{ href: "/body-scan", label: "Body Scan", icon: Activity }] : []),
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <Dumbbell className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <span className="font-bold text-slate-800 text-sm truncate max-w-[40vw] sm:max-w-none">
            {gymName || "Activa"}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                  active ? "bg-orange-50 text-orange-700" : "text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-2 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Two-step confirmation overlay */}
      {confirming && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4" onClick={() => !signingOut && setConfirming(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mb-3">
              <LogOut className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Sign out?</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">You&apos;ll need your name and password to sign back in.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={signingOut}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={doSignOut}
                disabled={signingOut}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
              >
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
