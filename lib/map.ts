import { demoBuildings } from "@/lib/demo-data";
import { DirectionStep } from "@/lib/types";
import { formatDistance, formatDuration } from "@/lib/utils";

const CAMPUS_WALKING_SPEED_METERS_PER_MINUTE = 78;

export function haversineDistance(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateWalk(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const distanceMeters = haversineDistance(fromLat, fromLng, toLat, toLng);
  const durationMinutes = distanceMeters / CAMPUS_WALKING_SPEED_METERS_PER_MINUTE;

  return {
    distanceMeters,
    distanceLabel: formatDistance(distanceMeters),
    durationMinutes,
    durationLabel: formatDuration(durationMinutes)
  };
}

export function buildCampusDirections(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): DirectionStep[] {
  const midpointLat = (fromLat + toLat) / 2;
  const midpointLng = (fromLng + toLng) / 2;
  const distance = haversineDistance(fromLat, fromLng, toLat, toLng);

  return [
    {
      id: "step-1",
      instruction: "Start from your current position and head toward the nearest campus path.",
      distanceMeters: Math.max(50, distance * 0.28)
    },
    {
      id: "step-2",
      instruction: `Continue through the campus core toward ${closestBuilding(midpointLat, midpointLng)}.`,
      distanceMeters: Math.max(60, distance * 0.42)
    },
    {
      id: "step-3",
      instruction: "Follow the main walkway to your destination entrance.",
      distanceMeters: Math.max(40, distance * 0.3)
    }
  ];
}

function closestBuilding(lat: number, lng: number) {
  const nearest = demoBuildings
    .map((building) => ({
      building,
      distance: haversineDistance(lat, lng, building.latitude, building.longitude)
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  return nearest?.building.name ?? "the campus center";
}
