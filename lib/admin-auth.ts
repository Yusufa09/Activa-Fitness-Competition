import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Returns the logged-in admin's auth user id + their gym_id (or null if not
 * authenticated / not linked to a gym). All admin APIs use this to scope data.
 */
export async function getAdminContext(): Promise<{ userId: string; gymId: string } | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("gym_admins")
    .select("gym_id")
    .eq("user_id", session.user.id)
    .single();

  if (!data) return null;
  return { userId: session.user.id, gymId: data.gym_id };
}
