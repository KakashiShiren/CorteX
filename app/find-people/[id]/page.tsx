"use client";

import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { ProfileHero } from "@/components/people/profile-hero";
import { apiFetch } from "@/lib/api";
import { Student } from "@/lib/types";

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const { data } = useQuery({
    queryKey: ["student", params.id],
    queryFn: () => apiFetch<Student>(`/api/students/${params.id}`)
  });

  if (!data) {
    return (
      <AppShell>
        <div className="cortex-panel p-8">Loading student profile...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <ProfileHero student={data} />
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="cortex-panel p-6">
            <div className="eyebrow">About</div>
            <div className="mt-3 text-2xl">Profile details</div>
            <div className="mt-5 space-y-3 text-sm text-black/65 dark:text-white/65">
              <div>Email: {data.email}</div>
              <div>Major: {data.major}</div>
              <div>Year: {data.year}</div>
              <div>Residence: {data.residence}</div>
            </div>
          </div>
          <div className="cortex-panel p-6">
            <div className="eyebrow">Current Context</div>
            <div className="mt-3 text-2xl">Why this profile is useful right now</div>
            <p className="mt-5 text-sm leading-7 text-black/65 dark:text-white/65">
              Cortex highlights availability, place, and intent so it is easier to decide whether to connect, message, or meet up on campus.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
