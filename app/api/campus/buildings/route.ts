import { NextRequest } from "next/server";

import { listBuildings } from "@/lib/repository";
import { ok } from "@/lib/http";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  const buildings = listBuildings().filter((building) => !category || building.category === category);
  return ok({ buildings });
}
