import { createAdminClient } from "@/lib/supabase/admin";

// Unambiguous characters (no 0/O, 1/I) for an easy-to-read join code
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomGymCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Generate a gym code guaranteed to be unique in the gyms table. */
export async function generateUniqueGymCode(
  supabase: ReturnType<typeof createAdminClient>
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomGymCode();
    const { data } = await supabase.from("gyms").select("id").eq("gym_code", code).maybeSingle();
    if (!data) return code;
  }
  // Extremely unlikely fallback
  return randomGymCode(8);
}
