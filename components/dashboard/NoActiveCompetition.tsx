import { FITNESS_TIPS } from "@/lib/points";
import { Sparkles } from "lucide-react";

export function NoActiveCompetition({ displayName }: { displayName: string }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-2xl mb-3">
          <Sparkles className="w-7 h-7 text-orange-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Hi {displayName}! 👋</h1>
        <p className="text-slate-500 mt-2 text-sm">
          There&apos;s no active competition right now. Check back soon — your gym
          manager will start one! In the meantime, here are some healthy habits to keep up.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
          Daily Fitness Tips
        </h2>
        <div className="space-y-3">
          {FITNESS_TIPS.map((t) => (
            <div key={t.title} className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800 text-sm">{t.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{t.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
