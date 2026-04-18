"use client";

import { create } from "zustand";

import { UserStatus } from "@/lib/types";

let expiryTimeout: ReturnType<typeof setTimeout> | null = null;

function clearExpiryTimeout() {
  if (expiryTimeout) {
    clearTimeout(expiryTimeout);
    expiryTimeout = null;
  }
}

interface StatusStore {
  currentStatus: UserStatus | null;
  visibleStatus: boolean;
  setStatus: (status: UserStatus | null) => void;
  clearStatus: () => void;
  setVisibility: (visible: boolean) => void;
}

export const useStatusStore = create<StatusStore>((set) => ({
  currentStatus: null,
  visibleStatus: true,
  setStatus: (status) => {
    clearExpiryTimeout();

    if (!status) {
      set({ currentStatus: null });
      return;
    }

    const expiresIn = new Date(status.expiresAt).getTime() - Date.now();
    if (expiresIn <= 0) {
      set({ currentStatus: null });
      return;
    }

    expiryTimeout = setTimeout(() => {
      set({ currentStatus: null });
      clearExpiryTimeout();
    }, expiresIn);

    set({ currentStatus: status });
  },
  clearStatus: () => {
    clearExpiryTimeout();
    set({ currentStatus: null });
  },
  setVisibility: (visibleStatus) => set({ visibleStatus })
}));
