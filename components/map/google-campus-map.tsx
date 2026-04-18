"use client";

import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin
} from "@vis.gl/react-google-maps";

import {
  CampusMapBuilding,
  campusMapCategoryColors,
  campusMapCenter
} from "@/lib/campus-map-data";

export function GoogleCampusMap({
  apiKey,
  buildings,
  selectedBuilding,
  onSelect
}: {
  apiKey: string;
  buildings: CampusMapBuilding[];
  selectedBuilding: CampusMapBuilding | null;
  onSelect: (building: CampusMapBuilding | null) => void;
}) {
  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={campusMapCenter}
        defaultZoom={17}
        gestureHandling="greedy"
        disableDefaultUI={false}
        style={{ width: "100%", height: "100%" }}
      >
        {buildings.map((building) => (
          <AdvancedMarker
            key={building.id}
            position={{ lat: building.lat, lng: building.lng }}
            onClick={() => onSelect(building)}
          >
            <Pin
              background={campusMapCategoryColors[building.category]}
              borderColor="#ffffff"
              glyphColor="#ffffff"
            />
          </AdvancedMarker>
        ))}

        {selectedBuilding ? (
          <InfoWindow
            position={{ lat: selectedBuilding.lat, lng: selectedBuilding.lng }}
            onCloseClick={() => onSelect(null)}
          >
            <div className="max-w-xs p-1 text-sm text-slate-900">
              <div className="font-semibold">{selectedBuilding.name}</div>
              <p className="mt-1 text-xs leading-5 text-slate-600">{selectedBuilding.description}</p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBuilding.lat},${selectedBuilding.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-xs font-medium text-blue-600 hover:underline"
              >
                Get Directions
              </a>
            </div>
          </InfoWindow>
        ) : null}
      </Map>
    </APIProvider>
  );
}
