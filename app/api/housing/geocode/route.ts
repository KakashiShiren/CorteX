import { fail, ok, requireUserId } from "@/lib/http";

const CLARK_COORDINATES = {
  lat: 42.252,
  lng: -71.8245,
  formatted_address: "Clark University, 950 Main St, Worcester, MA 01610"
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireUserId();

    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address")?.trim();

    if (!address) {
      return fail("Enter a location to search.");
    }

    if (/clark university|clarku|950 main/i.test(address)) {
      return ok({
        ...CLARK_COORDINATES,
        results: [CLARK_COORDINATES]
      });
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Grove campus housing search (student project)",
        Accept: "application/json"
      },
      next: {
        revalidate: 60 * 60 * 24
      }
    });

    if (!response.ok) {
      return fail("Unable to geocode that location right now.", 502);
    }

    const results = ((await response.json()) as NominatimResult[])
      .map((item) => ({
        lat: Number(item.lat),
        lng: Number(item.lon),
        formatted_address: item.display_name
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

    if (!results.length) {
      return fail("No matching locations found.", 404);
    }

    return ok({
      ...results[0],
      results
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to geocode location",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
