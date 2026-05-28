"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import type { HousingPost } from "@/lib/housing";

declare global {
  interface Window {
    openHousingDetail?: (postId: string) => void;
  }
}

type MarkerClusterFactory = () => L.LayerGroup;

function formatMarkerPrice(value: number) {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }

  return `$${Math.round(value)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadMarkerClusterAssets() {
  if (typeof document === "undefined") {
    return;
  }

  const cssHref = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/MarkerCluster.css";
  const defaultCssHref = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/MarkerCluster.Default.css";
  const scriptSrc = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/leaflet.markercluster.min.js";

  for (const href of [cssHref, defaultCssHref]) {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }

  if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    document.body.appendChild(script);
  }
}

function HousingMarkers({
  listings,
  onSelect
}: {
  listings: HousingPost[];
  onSelect: (listing: HousingPost) => void;
}) {
  const map = useMap();

  useEffect(() => {
    loadMarkerClusterAssets();
  }, []);

  useEffect(() => {
    window.openHousingDetail = (postId: string) => {
      const listing = listings.find((item) => item.id === postId);
      if (listing) {
        onSelect(listing);
      }
    };

    return () => {
      delete window.openHousingDetail;
    };
  }, [listings, onSelect]);

  useEffect(() => {
    const clusterFactory = (L as unknown as { markerClusterGroup?: MarkerClusterFactory }).markerClusterGroup;
    const markerGroup = clusterFactory ? clusterFactory() : L.layerGroup();
    markerGroup.addTo(map);

    for (const listing of listings) {
      if (listing.latitude === undefined || listing.longitude === undefined) {
        continue;
      }

      const titleInitial = (listing.title.trim()[0] || "H").toUpperCase();
      const price = formatMarkerPrice(listing.pricePerMonth);
      const marker = L.marker([listing.latitude, listing.longitude], {
        icon: L.divIcon({
          className: "",
          html: `<div style="min-width:58px;border:2px solid #1C1A17;background:#1E5A3A;color:#F7F0E3;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:700;text-align:center;box-shadow:0 8px 18px rgba(18,17,15,.18);">${titleInitial} ${price}</div>`,
          iconSize: [58, 30],
          iconAnchor: [29, 15]
        })
      });

      const image = listing.imagesUrl[0];
      const popupImage = image
        ? `<img src="${escapeHtml(image)}" style="width:100%;height:90px;object-fit:cover;border-radius:4px;">`
        : `<div style="width:100%;height:90px;border-radius:4px;background:#efe6d8;"></div>`;

      marker.bindPopup(`
        <div style="width:200px;color:#1C1A17;">
          ${popupImage}
          <div style="padding:8px 0 4px;font-weight:600;">
            $${Math.round(listing.pricePerMonth)}/mo · ${listing.bedrooms ?? "?"} bed
          </div>
          <div style="font-size:12px;color:#666;line-height:1.35;">
            ${escapeHtml(listing.location)}
          </div>
          <button
            type="button"
            onclick="window.openHousingDetail && window.openHousingDetail('${listing.id}')"
            style="margin-top:8px;border:0;border-radius:999px;background:#1C1A17;color:#F7F0E3;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;"
          >
            View Details
          </button>
        </div>
      `);
      marker.addTo(markerGroup);
    }

    return () => {
      markerGroup.removeFrom(map);
    };
  }, [listings, map, onSelect]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(frame);
  }, [map]);

  return null;
}

export function HousingMap({
  listings,
  center,
  onSelect
}: {
  listings: HousingPost[];
  center: { lat: number; lng: number };
  onSelect: (listing: HousingPost) => void;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      scrollWheelZoom
      zoomControl
      style={{ width: "100%", height: "100%" }}
      className="h-full w-full bg-[#efe6d8] dark:bg-[#181211]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <HousingMarkers listings={listings} onSelect={onSelect} />
    </MapContainer>
  );
}
