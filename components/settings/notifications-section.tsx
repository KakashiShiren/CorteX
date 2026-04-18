"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function NotificationsSection() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [notifications, setNotifications] = useState(user?.notifications);

  useEffect(() => {
    setNotifications(user?.notifications);
  }, [user]);

  if (!notifications) {
    return null;
  }

  return (
    <div className="cortex-panel p-6 sm:p-8">
      <div className="eyebrow">Notifications</div>
      <div className="mt-3 text-3xl">Choose what interrupts your day</div>
      <div className="mt-6 space-y-4">
        {[
          ["messages", "New message alerts"],
          ["sounds", "Sound notifications"],
          ["connectionRequests", "Connection request alerts"],
          ["campusAlerts", "Campus alerts"],
          ["emailDigests", "Email digests"]
        ].map(([key, label]) => (
          <div key={key} className="flex items-center justify-between rounded-[24px] border border-black/10 p-4 dark:border-white/10">
            <div className="text-sm">{label}</div>
            <Switch
              checked={Boolean(notifications[key as keyof typeof notifications])}
              onCheckedChange={(value) => setNotifications({ ...notifications, [key]: value })}
            />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Button
          onClick={async () => {
            const updated = await apiFetch("/api/users/me/settings", {
              method: "PUT",
              body: JSON.stringify(notifications)
            });
            setUser(updated as any);
          }}
        >
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
}
