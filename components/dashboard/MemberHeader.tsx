import { Badge } from "@/components/ui/badge";
import { TEAM_COLORS } from "@/lib/points";
import type { TeamColor } from "@/types";

interface MemberHeaderProps {
  displayName: string;
  teamName: string;
  teamColor: TeamColor;
  totalPoints: number;
}

export function MemberHeader({ displayName, teamName, teamColor, totalPoints }: MemberHeaderProps) {
  const colors = TEAM_COLORS[teamColor] ?? TEAM_COLORS.teal;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between gap-4">
      <div>
        <p className="text-slate-500 text-sm font-medium">Welcome back,</p>
        <h1 className="text-2xl font-bold text-slate-800">{displayName}</h1>
        <Badge
          className={`mt-2 ${colors.bg} ${colors.text} border ${colors.border} font-semibold`}
          variant="outline"
        >
          {teamName}
        </Badge>
      </div>
      <div className="text-right">
        <p className="text-slate-400 text-xs uppercase tracking-wide font-medium">All-Time</p>
        <p className={`text-3xl font-bold ${colors.text}`}>{totalPoints}</p>
        <p className="text-slate-400 text-xs">points</p>
      </div>
    </div>
  );
}
