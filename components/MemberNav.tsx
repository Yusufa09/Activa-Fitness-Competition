"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/member-session";
import { Dumbbell, LayoutGrid, Trophy, LogOut } from "lucide-react";

export function MemberNav() {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    clearSession();
    router.replace("/");
  }

  const items = [
    { href: "/dashboard", label: "My Progress", icon: LayoutGrid },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-orange-600" />
          <span className="font-bold text-slate-800 text-sm hidden sm:inline">Orange Theory</span>
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
            onClick={signOut}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-2 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
