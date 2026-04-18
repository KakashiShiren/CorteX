"use client";

import { create } from "zustand";

import { Building, DirectionStep } from "@/lib/types";

interface MapStore {
  selectedBuilding: Building | null;
  favorites: string[];
  userLocation: { lat: number; lng: number } | null;
  directions: DirectionStep[] | null;
  mapCenter: [number, number];
  mapZoom: number;
  selectBuilding: (building: Building | null) => void;
  toggleFavorite: (id: string) => void;
  setUserLocation: (lat: number, lng: number) => void;
  setDirections: (steps: DirectionStep[] | null) => void;
  setMapCenter: (lat: number, lng: number) => void;
  setMapZoom: (zoom: number) => void;
}

export const useMapStore = create<MapStore>((set, get) => ({
  selectedBuilding: null,
  favorites: [],
  userLocation: null,
  directions: null,
  mapCenter: [42.2512, -71.8242],
  mapZoom: 16,
  selectBuilding: (selectedBuilding) => set({ selectedBuilding }),
  toggleFavorite: (id) =>
    set({
      favorites: get().favorites.includes(id)
        ? get().favorites.filter((item) => item !== id)
        : [...get().favorites, id]
    }),
  setUserLocation: (lat, lng) => set({ userLocation: { lat, lng } }),
  setDirections: (directions) => set({ directions }),
  setMapCenter: (lat, lng) => set({ mapCenter: [lat, lng] }),
  setMapZoom: (mapZoom) => set({ mapZoom })
}));
