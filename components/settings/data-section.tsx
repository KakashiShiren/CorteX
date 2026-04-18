"use client";

import { useState } from "react";

import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DataSection() {
  const [confirm, setConfirm] = useState("");

  return (
    <div className="cortex-panel p-6 sm:p-8">
      <div className="eyebrow">Data</div>
      <div className="mt-3 text-3xl">Export or remove your data</div>
      <div className="mt-6 flex flex-col gap-6">
        <div className="rounded-[24px] border border-black/10 p-5 dark:border-white/10">
          <div className="text-sm font-medium">Download my data</div>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            Export your profile and current settings as JSON.
          </p>
          <Button
            className="mt-4"
            onClick={async () => {
              const data = await apiFetch("/api/users/me");
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = "cortex-data.json";
              anchor.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download My Data
          </Button>
        </div>
        <div className="rounded-[24px] border border-cortex-ember/20 bg-cortex-ember/6 p-5">
          <div className="text-sm font-medium text-cortex-garnet dark:text-cortex-gold">Delete account</div>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            Type DELETE to enable the destructive action. This UI is prepared, but the backend removal flow should be connected to Supabase before production.
          </p>
          <Input value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-4" placeholder="Type DELETE" />
          <Button className="mt-4" variant="outline" disabled={confirm !== "DELETE"}>
            Delete Account Permanently
          </Button>
        </div>
      </div>
    </div>
  );
}
