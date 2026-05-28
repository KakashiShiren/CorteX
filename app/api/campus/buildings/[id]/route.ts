import { getSession } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { getUniversityBuildings } from "@/lib/university-map";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = getSession();

  if (!session?.isVerified) {
    return fail("Unauthorized", 401);
  }

  const building = getUniversityBuildings(session.universityDomain).find((item) => item.id === params.id);

  if (!building) {
    return fail("Building not found", 404);
  }

  return ok(building);
}
