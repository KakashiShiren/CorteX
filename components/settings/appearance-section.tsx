"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function AppearanceSection() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { setTheme } = useTheme();
  const [appearance, setAppearance] = useState(user?.appearance);

  useEffect(() => {
    setAppearance(user?.appearance);
  }, [user]);

  if (!appearance) {
    return null;
  }

  return (
    <div className="cortex-panel p-6 sm:p-8">
      <div className="eyebrow">Appearance</div>
      <div className="mt-3 text-3xl">Tune the workspace feel</div>
      <div className="mt-6 flex flex-wrap gap-3">
        {(["light", "dark", "auto"] as const).map((theme) => (
          <button
            key={theme}
            type="button"
            onClick={() => setAppearance({ ...appearance, theme })}
            className={`rounded-full px-4 py-2 text-sm ${
              appearance.theme === theme
                ? "bg-cortex-ember text-white"
                : "bg-black/[0.04] dark:bg-white/[0.06]"
            }`}
          >
            {theme}
          </button>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between rounded-[24px] border border-black/10 p-4 dark:border-white/10">
        <div className="text-sm">Compact layout</div>
        <Switch
          checked={appearance.compactMode}
          onCheckedChange={(value) => setAppearance({ ...appearance, compactMode: value })}
        />
      </div>
      <div className="mt-6">
        <Button
          onClick={async () => {
            const updated = await apiFetch("/api/users/me/settings", {
              method: "PUT",
              body: JSON.stringify(appearance)
            });
            setUser(updated as any);
            setTheme(appearance.theme);
          }}
        >
          Save Appearance
        </Button>
      </div>
    </div>
  );
}
