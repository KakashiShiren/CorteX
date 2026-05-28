import { NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { getUniversityBuildings } from "@/lib/university-map";

export async function GET(request: NextRequest) {
  const session = getSession();

  if (!session?.isVerified) {
    return fail("Unauthorized", 401);
  }

  const category = request.nextUrl.searchParams.get("category");
  const buildings = getUniversityBuildings(session.universityDomain).filter(
    (building) => !category || building.category === category
  );

  return ok({
    buildings,
    universityName: session.universityName,
    universityDomain: session.universityDomain
  });
}
