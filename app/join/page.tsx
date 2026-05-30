import { createAdminClient } from "@/lib/supabase/admin";
import { JoinForm } from "@/components/join/JoinForm";
import { Dumbbell } from "lucide-react";

interface Props {
  searchParams: Promise<{ code?: string }>;
}

export default async function JoinWithCodePage({ searchParams }: Props) {
  const { code } = await searchParams;

  let teamName: string | undefined;

  if (code) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("teams")
      .select("name")
      .ilike("join_code", code)
      .single();
    teamName = data?.name;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4 shadow-lg">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Gym Challenge</h1>
          {teamName ? (
            <p className="text-teal-600 font-medium mt-2">Joining {teamName} 🎉</p>
          ) : (
            <p className="text-slate-500 mt-2">Enter your team code to get started.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Join Your Team</h2>
          <JoinForm
            prefilledCode={code?.toUpperCase()}
            prefilledTeamName={teamName}
          />
        </div>
      </div>
    </main>
  );
}
