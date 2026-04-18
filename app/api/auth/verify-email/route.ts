import { ok } from "@/lib/http";

export async function POST() {
  return ok({
    success: true,
    message: "Verification email handling is delegated to Supabase for live accounts."
  });
}
