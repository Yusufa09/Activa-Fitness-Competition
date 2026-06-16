import { Badge } from "@/components/ui/badge";
import { TEAM_COLORS } from "@/lib/points";
import type { TeamColor } from "@/types";

interface MemberHeaderProps {
  displayName: string;
  teamName: string;
  teamColor: TeamColor;
  myPoints: number;
}

export function MemberHeader({ displayName, teamName, teamColor, myPoints }: MemberHeaderProps) {
  const colors = TEAM_COLORS[teamColor] ?? TEAM_COLORS.orange;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between gap-4">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Welcome back,</p>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{displayName}</h1>
        <Badge className={`mt-2 ${colors.bg} ${colors.text} border ${colors.border} font-semibold`} variant="outline">
          {teamName}
        </Badge>
      </div>
      <div className="text-right">
        <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide font-medium">Your Points</p>
        <p className={`text-3xl font-bold ${colors.text}`}>{myPoints}</p>
        <p className="text-slate-400 dark:text-slate-500 text-xs">this competition</p>
      </div>
    </div>
  );
}
