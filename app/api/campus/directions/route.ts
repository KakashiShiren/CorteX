import { buildCampusDirections, estimateWalk } from "@/lib/map";
import { fail, ok } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fromLat, fromLng, toLat, toLng } = body;
    const estimate = estimateWalk(fromLat, fromLng, toLat, toLng);
    return ok({
      steps: buildCampusDirections(fromLat, fromLng, toLat, toLng),
      distance: estimate.distanceLabel,
      duration: estimate.durationLabel
    });
  } catch {
    return fail("Unable to calculate directions");
  }
}
