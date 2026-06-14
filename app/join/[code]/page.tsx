import { createAdminClient } from "@/lib/supabase/admin";
import { GymJoinForm } from "@/components/join/GymJoinForm";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function GymJoinPage({ params }: Props) {
  const { code } = await params;

  // Resolve the gym from the QR's code (server-side)
  const supabase = createAdminClient();
  const { data: gym } = await supabase
    .from("gyms")
    .select("name, gym_code")
    .ilike("gym_code", code)
    .maybeSingle();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="w-20 h-20 mx-auto mb-3" />
          {gym ? (
            <>
              <h1 className="text-3xl font-bold text-slate-800">Join {gym.name}</h1>
              <p className="text-slate-500 mt-1">Create your account to start earning points.</p>
            </>
          ) : (
            <h1 className="text-3xl font-bold text-slate-800">Activa</h1>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {gym ? (
            <GymJoinForm gymCode={gym.gym_code} />
          ) : (
            <div className="text-center text-slate-500">
              <p className="font-medium text-slate-700">This gym link isn&apos;t valid.</p>
              <p className="text-sm mt-1">Double-check the QR code, or ask your gym for a new one.</p>
              <a href="/" className="inline-block mt-4 text-orange-600 hover:underline font-medium text-sm">
                Go to sign in →
              </a>
            </div>
          )}
        </div>

        {gym && (
          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{" "}
            <a href="/" className="text-orange-600 hover:underline font-medium">Log in →</a>
          </p>
        )}
      </div>
    </main>
  );
}
