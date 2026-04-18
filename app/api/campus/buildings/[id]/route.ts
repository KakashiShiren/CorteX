import { getBuildingById } from "@/lib/repository";
import { fail, ok } from "@/lib/http";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const building = getBuildingById(params.id);
  if (!building) {
    return fail("Building not found", 404);
  }

  return ok(building);
}
