import { fail, ok, requireUserId } from "@/lib/http";
import { hydrateHousingPosts, housingPostSelect, type HousingPostRow } from "@/lib/housing";
import { searchHousingListings } from "@/lib/housing-search";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUserUniversityId } from "@/lib/university";

export const dynamic = "force-dynamic";

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function parseOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function GET(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for housing.", 500);
    }

    const { searchParams } = new URL(request.url);
    const result = await searchHousingListings({ supabase, userId, searchParams });
    return ok(result);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load housing",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for housing.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const location = String(body.location ?? "").trim();
    const latitude = parseOptionalNumber(body.latitude);
    const longitude = parseOptionalNumber(body.longitude);
    const pricePerMonth = parseOptionalNumber(body.price_per_month);
    const bedrooms = parseOptionalNumber(body.bedrooms);
    const bathrooms = parseOptionalNumber(body.bathrooms);
    const squareFeet = parseOptionalNumber(body.square_feet);
    const amenities = normalizeStringArray(body.amenities);
    const availableFrom = String(body.available_from ?? "").trim() || null;
    const leaseLength = String(body.lease_length ?? "").trim() || null;
    const contactEmail = String(body.contact_email ?? "").trim();
    const contactPhone = String(body.contact_phone ?? "").trim() || null;
    const imagesUrl = normalizeStringArray(body.images_url);
    const status = String(body.status ?? "active").trim() === "draft" ? "draft" : "active";

    if (!title || title.length > 100) {
      return fail("Add a property title under 100 characters.");
    }

    if (!location) {
      return fail("Add a property location.");
    }

    if (latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return fail("Choose a geocoded location.");
    }

    if (pricePerMonth === null || Number.isNaN(pricePerMonth) || pricePerMonth <= 0) {
      return fail("Add a valid monthly price.");
    }

    if (description.length > 1000) {
      return fail("Descriptions can be at most 1,000 characters.");
    }

    if (status === "active" && !description) {
      return fail("Add a description before publishing.");
    }

    if (status === "active" && !leaseLength) {
      return fail("Choose a lease type before publishing.");
    }

    if (status === "active" && !availableFrom) {
      return fail("Choose an available date before publishing.");
    }

    if (!contactEmail) {
      return fail("Add a contact email.");
    }

    if (status === "active" && imagesUrl.length < 1) {
      return fail("Upload at least one image before publishing.");
    }

    if (imagesUrl.length > 5) {
      return fail("Upload at most five images.");
    }

    const insertQuery = await supabase
      .from("housing_posts")
      .insert({
        user_id: userId,
        university_id: universityId,
        title,
        description,
        location,
        latitude,
        longitude,
        price_per_month: pricePerMonth,
        bedrooms: bedrooms === null || Number.isNaN(bedrooms) ? null : bedrooms,
        bathrooms: bathrooms === null || Number.isNaN(bathrooms) ? null : bathrooms,
        square_feet: squareFeet === null || Number.isNaN(squareFeet) ? null : squareFeet,
        amenities,
        available_from: availableFrom,
        lease_length: leaseLength,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        images_url: imagesUrl,
        status
      })
      .select(housingPostSelect)
      .single();

    if (insertQuery.error) {
      return fail(insertQuery.error.message, 500);
    }

    const [listing] = await hydrateHousingPosts(supabase, [insertQuery.data as HousingPostRow]);
    return ok(listing, { status: 201 });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to create housing listing",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
