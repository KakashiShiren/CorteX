"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap
} from "react-leaflet";

import {
  CampusMapBuilding,
  campusMapCategoryColors,
  campusMapCenter
} from "@/lib/campus-map-data";

function RecenterMap({ building }: { building: CampusMapBuilding | null }) {
  const map = useMap();

  useEffect(() => {
    if (!building) {
      return;
    }

    map.flyTo([building.lat, building.lng], 18, {
      animate: true,
      duration: 0.75
    });
  }, [building, map]);

  return null;
}

function EnsureLeafletSize() {
  const map = useMap();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [map]);

  return null;
}

export function LeafletCampusMap({
  buildings,
  selectedBuilding,
  onSelect
}: {
  buildings: CampusMapBuilding[];
  selectedBuilding: CampusMapBuilding | null;
  onSelect: (building: CampusMapBuilding | null) => void;
}) {
  return (
    <MapContainer
      center={[campusMapCenter.lat, campusMapCenter.lng]}
      zoom={17}
      scrollWheelZoom
      zoomControl
      style={{ width: "100%", height: "100%" }}
      className="h-full w-full bg-[#efe6d8] dark:bg-[#181211]"
    >
      <EnsureLeafletSize />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap building={selectedBuilding} />

      {buildings.map((building) => {
        const isSelected = selectedBuilding?.id === building.id;

        return (
          <CircleMarker
            key={building.id}
            center={[building.lat, building.lng]}
            radius={isSelected ? 10 : 8}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: campusMapCategoryColors[building.category],
              fillOpacity: 0.92
            }}
            eventHandlers={{
              click: () => onSelect(building)
            }}
          >
            <Popup>
              <div className="max-w-xs text-sm text-slate-900">
                <div className="font-semibold">{building.name}</div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{building.description}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${building.lat},${building.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-xs font-medium text-blue-600 hover:underline"
                >
                  Get Directions
                </a>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
