"use client";

import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { Student } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/people/status-pill";

export function ProfileHero({ student }: { student: Student }) {
  const router = useRouter();

  return (
    <div className="cortex-panel p-8 sm:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-5">
          <Avatar name={student.name} size="lg" />
          <div>
            <div className="text-4xl">{student.name}</div>
            <div className="mt-3 text-sm text-black/60 dark:text-white/60">
              {student.major} • {student.year} • {student.residence}
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-black/65 dark:text-white/65">{student.bio}</p>
            <div className="mt-4">
              <StatusPill status={student.currentStatus} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {student.interests.map((interest) => (
                <span key={interest} className="rounded-full bg-black/[0.04] px-3 py-1 text-sm dark:bg-white/[0.06]">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {student.connectionStatus === "message" ? (
            <Button
              onClick={async () => {
                const conversation = await apiFetch<{ id: string }>("/api/conversations", {
                  method: "POST",
                  body: JSON.stringify({ peerId: student.id })
                });
                router.push(`/messages/${conversation.id}`);
              }}
            >
              Message
            </Button>
          ) : (
            <Button
              onClick={async () => {
                await apiFetch("/api/connections/request", {
                  method: "POST",
                  body: JSON.stringify({ toUserId: student.id })
                });
                router.refresh();
              }}
            >
              {student.connectionStatus === "pending" ? "Pending" : "Send Request"}
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push("/messages")}>
            View Messages
          </Button>
        </div>
      </div>
    </div>
  );
}
