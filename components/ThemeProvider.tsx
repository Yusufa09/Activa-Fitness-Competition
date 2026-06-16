"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

const THEME_KEY = "theme";

// Pre-auth routes (sign-in, QR-code gym join) always render in light mode,
// regardless of the member's saved preference.
function isForcedLightRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/" || pathname.startsWith("/join");
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void; resetToLight: () => void }>({
  theme: "light",
  toggle: () => {},
  resetToLight: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const forced = isForcedLightRoute(pathname);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    if (forced) {
      document.documentElement.classList.remove("dark");
      setTheme("light");
      return;
    }
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = stored ?? (prefersDark ? "dark" : "light");
    setTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [forced, pathname]);

  function toggle() {
    if (forced) return;
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }

  // Called on sign-out so the next sign-in always starts in light mode.
  function resetToLight() {
    localStorage.setItem(THEME_KEY, "light");
    document.documentElement.classList.remove("dark");
    setTheme("light");
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, resetToLight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
