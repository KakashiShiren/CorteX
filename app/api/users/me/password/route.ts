import { fail, ok, requireUserId } from "@/lib/http";

export async function PUT() {
  try {
    requireUserId();
    return ok({ success: true, message: "Password change flow is scaffolded for Supabase Auth integration." });
  } catch (error) {
    return fail(error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Unable to change password", error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400);
  }
}
