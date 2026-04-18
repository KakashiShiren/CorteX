"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DashboardStore {
  recentSearches: string[];
  unreadCount: number;
  userTheme: "light" | "dark" | "auto";
  addSearch: (query: string) => void;
  clearHistory: () => void;
  setUnreadCount: (count: number) => void;
  setTheme: (theme: "light" | "dark" | "auto") => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      recentSearches: [],
      unreadCount: 0,
      userTheme: "auto",
      addSearch: (query) => {
        const next = [query, ...get().recentSearches.filter((item) => item !== query)].slice(0, 5);
        set({ recentSearches: next });
      },
      clearHistory: () => set({ recentSearches: [] }),
      setUnreadCount: (unreadCount) => set({ unreadCount }),
      setTheme: (userTheme) => set({ userTheme })
    }),
    {
      name: "cortex-dashboard"
    }
  )
);
