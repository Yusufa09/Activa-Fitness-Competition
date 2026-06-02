import { Calendar, Flame } from "lucide-react";
import { daysLeft } from "@/lib/points";
import type { Competition } from "@/types";

export function CompetitionBanner({ competition }: { competition: Competition }) {
  const left = daysLeft(competition.end_date);
  const end = new Date(competition.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-orange-100 text-xs font-medium uppercase tracking-wide">
            <Flame className="w-3.5 h-3.5" />
            Active Competition
          </div>
          <h2 className="text-xl font-bold mt-1">{competition.name}</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black">{left}</p>
          <p className="text-orange-100 text-xs">days left</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-orange-100 text-xs mt-3">
        <Calendar className="w-3.5 h-3.5" />
        Ends {end}
      </div>
    </div>
  );
}
