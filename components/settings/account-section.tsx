"use client";

import { useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountSection() {
  const user = useAuthStore((state) => state.user);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="cortex-panel p-6 sm:p-8">
      <div className="eyebrow">Account</div>
      <div className="mt-3 text-3xl">Security and access</div>
      <div className="mt-6 space-y-4">
        <div className="rounded-[24px] border border-black/10 p-4 dark:border-white/10">
          <div className="text-sm font-medium">Email verification</div>
          <div className="mt-2 text-sm text-black/60 dark:text-white/60">
            {user?.isVerified ? `${user.email} is verified.` : "Verification is still pending."}
          </div>
        </div>
        <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" />
        <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" />
        <Button
          onClick={async () => {
            await apiFetch("/api/users/me/password", {
              method: "PUT",
              body: JSON.stringify({ currentPassword, newPassword })
            });
            setCurrentPassword("");
            setNewPassword("");
          }}
        >
          Change Password
        </Button>
      </div>
    </div>
  );
}
