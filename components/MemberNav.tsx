"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, loadSession } from "@/lib/member-session";
import { LayoutGrid, Trophy, LogOut, Activity, Target, Sun, Moon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/components/ThemeProvider";

export function MemberNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle, resetToLight } = useTheme();
  const [gymName, setGymName] = useState("");
  const [bodyScan, setBodyScan] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    function sync() {
      const s = loadSession();
      setGymName(s?.gym_name ?? "");
      setBodyScan(!!s?.body_scan_enabled);
    }
    sync();
    // Re-read when the session is refreshed (e.g. body scan just enabled) or changed in another tab
    window.addEventListener("member-session-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("member-session-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  async function doSignOut() {
    setSigningOut(true);
    const token = loadSession()?.device_token;
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
    resetToLight(); // next sign-in always starts in light mode
    router.replace("/");
  }

  const items = [
    { href: "/dashboard", label: "My Progress", icon: LayoutGrid },
    { href: "/goals", label: "My Goals", icon: Target },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ...(bodyScan ? [{ href: "/body-scan", label: "Body Scan", icon: Activity }] : []),
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <Logo className="w-8 h-8 flex-shrink-0" />
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[40vw] sm:max-w-none">
            {gymName || "Activa"}
          </span>
        </Link>

        <div className="flex items-center gap-0 sm:gap-1 flex-shrink-0">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                className={`flex items-center gap-1.5 text-sm font-medium px-1.5 sm:px-3 py-2 rounded-md transition-colors ${
                  active
                    ? "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                }`}
              >
                <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center gap-1.5 text-sm font-medium px-1.5 sm:px-3 py-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 sm:w-4 sm:h-4" /> : <Moon className="w-5 h-5 sm:w-4 sm:h-4" />}
          </button>

          <button
            onClick={() => setConfirming(true)}
            title="Sign Out"
            aria-label="Sign Out"
            className="flex items-center gap-1.5 text-sm font-medium px-1.5 sm:px-3 py-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Two-step confirmation overlay */}
      {confirming && (
        <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4" onClick={() => !signingOut && setConfirming(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-950/40 rounded-full mb-3">
              <LogOut className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Sign out?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">You&apos;ll need your name and password to sign back in.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={signingOut}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
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
