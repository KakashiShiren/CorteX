"use client";

import { create } from "zustand";

import { ChatMessage } from "@/lib/types";

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (isLoading) => set({ isLoading }),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] })
}));
