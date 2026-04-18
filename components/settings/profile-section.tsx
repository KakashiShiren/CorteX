"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ProfileSection() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [form, setForm] = useState({
    name: "",
    major: "",
    year: "",
    residence: "",
    bio: "",
    interests: ""
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        major: user.major,
        year: user.year,
        residence: user.residence,
        bio: user.bio,
        interests: user.interests.join(", ")
      });
    }
  }, [user]);

  return (
    <div className="cortex-panel p-6 sm:p-8">
      <div className="eyebrow">Profile</div>
      <div className="mt-3 text-3xl">Shape how Clark sees you</div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" />
        <Input value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })} placeholder="Major" />
        <Input value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} placeholder="Year" />
        <Input value={form.residence} onChange={(event) => setForm({ ...form, residence: event.target.value })} placeholder="Residence" />
      </div>
      <div className="mt-4 grid gap-4">
        <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Short bio" />
        <Input
          value={form.interests}
          onChange={(event) => setForm({ ...form, interests: event.target.value })}
          placeholder="Interests separated by commas"
        />
      </div>
      <div className="mt-6">
        <Button
          onClick={async () => {
            const updated = await apiFetch("/api/users/me", {
              method: "PUT",
              body: JSON.stringify({
                ...form,
                interests: form.interests
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              })
            });
            setUser(updated as any);
          }}
        >
          Save Profile
        </Button>
      </div>
    </div>
  );
}
