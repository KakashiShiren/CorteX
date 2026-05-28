"use client";

import { useEffect, useRef } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SubscriptionConfig = {
  channelName: string | null;
  table: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  filter?: string;
  enabled?: boolean;
};

export function useSupabaseSubscription(config: SubscriptionConfig, onChange: () => void) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (config.enabled === false || !config.channelName) {
      return undefined;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return undefined;
    }

    const channel = supabase
      .channel(config.channelName)
      .on(
        "postgres_changes",
        {
          event: config.event ?? "*",
          schema: "public",
          table: config.table,
          ...(config.filter ? { filter: config.filter } : {})
        },
        () => onChangeRef.current()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [config.channelName, config.enabled, config.event, config.filter, config.table]);
}
