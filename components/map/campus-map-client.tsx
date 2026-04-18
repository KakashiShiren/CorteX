"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

import { Building } from "@/lib/types";

function RecenterMap({
  latitude,
  longitude
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: true });
  }, [latitude, longitude, map]);

  return null;
}

export function CampusMapClient({
  buildings,
  selectedBuilding,
  userLocation,
  onSelect
}: {
  buildings: Building[];
  selectedBuilding: Building | null;
  userLocation: { lat: number; lng: number } | null;
  onSelect: (building: Building) => void;
}) {
  const focusLat = selectedBuilding?.latitude ?? userLocation?.lat ?? 42.2512;
  const focusLng = selectedBuilding?.longitude ?? userLocation?.lng ?? -71.8242;

  return (
    <div className="h-[520px] overflow-hidden rounded-[28px] border border-black/10 dark:border-white/10">
      <MapContainer center={[focusLat, focusLng]} zoom={16} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap latitude={focusLat} longitude={focusLng} />
        {buildings.map((building) => (
          <CircleMarker
            key={building.id}
            center={[building.latitude, building.longitude]}
            radius={selectedBuilding?.id === building.id ? 10 : 7}
            pathOptions={{
              color: selectedBuilding?.id === building.id ? "#d5b672" : "#9f1d2c",
              fillColor: selectedBuilding?.id === building.id ? "#d5b672" : "#9f1d2c",
              fillOpacity: 0.95
            }}
            eventHandlers={{
              click: () => onSelect(building)
            }}
          >
            <Popup>
              <div className="font-medium">{building.name}</div>
              <div className="text-sm">{building.description}</div>
            </Popup>
          </CircleMarker>
        ))}
        {userLocation ? (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            pathOptions={{
              color: "#3f5f55",
              fillColor: "#3f5f55",
              fillOpacity: 1
            }}
          >
            <Popup>Your location</Popup>
          </CircleMarker>
        ) : null}
      </MapContainer>
    </div>
  );
}
