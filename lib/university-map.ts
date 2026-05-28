import { getUniversityKnowledge, type BuildingInfo } from "@/lib/university-knowledge-base";
import { Building, type BuildingCategory } from "@/lib/types";

const fallbackHours = {
  monday: { open: "Varies", close: "Varies" },
  tuesday: { open: "Varies", close: "Varies" },
  wednesday: { open: "Varies", close: "Varies" },
  thursday: { open: "Varies", close: "Varies" },
  friday: { open: "Varies", close: "Varies" },
  saturday: { open: "Varies", close: "Varies" },
  sunday: { open: "Varies", close: "Varies" }
};

function inferCategory(building: BuildingInfo): BuildingCategory {
  const text = `${building.name} ${building.nickname ?? ""} ${building.description}`.toLowerCase();

  if (text.includes("library")) return "library";
  if (text.includes("dining") || text.includes("food") || text.includes("restaurant") || text.includes("pub")) {
    return "dining";
  }
  if (text.includes("gym") || text.includes("athletic") || text.includes("recreation") || text.includes("field")) {
    return "recreation";
  }
  if (text.includes("health") || text.includes("counseling")) return "health";
  if (text.includes("student center") || text.includes("campus center") || text.includes("services")) return "services";
  if (text.includes("hall") || text.includes("dorm") || text.includes("village")) return "residential";

  return "academic";
}

function fallbackCoordinates(index: number, center: { lat: number; lng: number }) {
  const angle = index * 1.38;
  const radius = 0.0012 + index * 0.00008;

  return {
    lat: center.lat + Math.cos(angle) * radius,
    lng: center.lng + Math.sin(angle) * radius
  };
}

function codeFromName(name: string) {
  const words = name.match(/[A-Z0-9]+|[a-z0-9]+/g) ?? [];
  const initials = words
    .filter((word) => !["and", "of", "the", "for"].includes(word.toLowerCase()))
    .slice(0, 4)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return initials || "BLDG";
}

export function getUniversityBuildings(domain?: string | null): Building[] {
  const university = getUniversityKnowledge(domain ?? "");

  if (!university) {
    return [];
  }

  return Object.entries(university.buildings).map(([id, building], index) => {
    const coordinates = building.coordinates ?? fallbackCoordinates(index, university.coordinates);

    return {
      id,
      name: building.name,
      code: codeFromName(building.nickname ?? building.name),
      category: inferCategory(building),
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      address: building.location ?? university.address,
      hours: fallbackHours,
      facilities: building.features ?? [],
      description: building.description
    };
  });
}
