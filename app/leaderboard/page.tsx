import { MemberNav } from "@/components/MemberNav";
import { LeaderboardStage } from "@/components/leaderboard/LeaderboardStage";

export const metadata = {
  title: "Leaderboard — Orange Theory Gym Competition",
};

export default function LeaderboardPage() {
  return (
    <>
      <MemberNav />
      <LeaderboardStage />
    </>
  );
}
