"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Dumbbell, LayoutDashboard, Trophy, Users, LogOut, CalendarRange, UserCog, Activity, History } from "lucide-react";

const PUBLIC_PATHS = ["/admin", "/admin/signup", "/admin/accept-invite"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [gym, setGym] = useState<{ name: string; gym_code: string } | null>(null);

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isPublic) { setChecking(false); return; }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/admin"); return; }
      setChecking(false);
      // Load gym name + code for the sidebar
      fetch("/api/admin/admins").then((r) => r.json()).then((d) => d.gym && setGym(d.gym)).catch(() => {});
    });
  }, [router, pathname, isPublic]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin");
  }

  // Public auth pages render without the admin chrome
  if (isPublic) return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Dumbbell className="w-8 h-8 text-orange-500 animate-pulse" />
      </div>
    );
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/competitions", label: "Competitions", icon: CalendarRange },
    { href: "/admin/goals", label: "Goals", icon: Trophy },
    { href: "/admin/teams", label: "Teams", icon: Users },
    { href: "/admin/body-scans", label: "Body Scan", icon: Activity },
    { href: "/admin/history", label: "History", icon: History },
    { href: "/admin/admins", label: "Administrators", icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      <aside className="w-56 bg-slate-900 flex flex-col py-6 px-4 fixed h-full">
        <div className="flex items-center gap-2 mb-1 px-2">
          <Dumbbell className="w-6 h-6 text-orange-400 flex-shrink-0" />
          <span className="text-white font-bold text-sm truncate">{gym?.name ?? "Gym Administrator"}</span>
        </div>
        {gym ? (
          <div className="px-2 mb-7">
            <p className="text-slate-500 text-[11px] font-mono tracking-wider">Code: {gym.gym_code}</p>
          </div>
        ) : (
          <div className="mb-7" />
        )}

        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href ? "bg-orange-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </aside>

      <main className="flex-1 ml-56 p-8">{children}</main>
    </div>
  );
}
