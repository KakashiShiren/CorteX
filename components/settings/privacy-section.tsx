"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function PrivacySection() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [privacy, setPrivacy] = useState(user?.privacy);

  useEffect(() => {
    setPrivacy(user?.privacy);
  }, [user]);

  if (!privacy) {
    return null;
  }

  return (
    <div className="cortex-panel p-6 sm:p-8">
      <div className="eyebrow">Privacy</div>
      <div className="mt-3 text-3xl">Control your visibility</div>
      <div className="mt-6 space-y-4">
        {[
          ["searchable", "Make profile searchable"],
          ["showMajor", "Show major"],
          ["showYear", "Show year"],
          ["showResidence", "Show residence"],
          ["showInterests", "Show interests"],
          ["showOnlineStatus", "Show online status"]
        ].map(([key, label]) => (
          <div key={key} className="flex items-center justify-between rounded-[24px] border border-black/10 p-4 dark:border-white/10">
            <div className="text-sm">{label}</div>
            <Switch
              checked={Boolean(privacy[key as keyof typeof privacy])}
              onCheckedChange={(value) => setPrivacy({ ...privacy, [key]: value })}
            />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Button
          onClick={async () => {
            const updated = await apiFetch("/api/users/me/settings", {
              method: "PUT",
              body: JSON.stringify(privacy)
            });
            setUser(updated as any);
          }}
        >
          Save Privacy Settings
        </Button>
      </div>
    </div>
  );
}
