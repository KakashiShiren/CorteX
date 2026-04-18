"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { Student } from "@/lib/types";
import { StatusPill } from "@/components/people/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function StudentCard({ student }: { student: Student }) {
  const router = useRouter();

  return (
    <div className="cortex-panel flex h-full flex-col justify-between p-6">
      <div>
        <div className="flex items-start gap-4">
          <Avatar name={student.name} size="lg" />
          <div className="min-w-0 flex-1">
            <Link
              href={`/find-people/${student.id}`}
              className="text-2xl font-semibold transition hover:text-cortex-garnet dark:hover:text-cortex-gold"
            >
              {student.name}
            </Link>
            <div className="mt-2 text-sm text-black/56 dark:text-white/58">
              {student.major} &middot; {student.year}
            </div>
            <div className="mt-1 text-sm text-black/46 dark:text-white/48">{student.residence}</div>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-black/58 dark:text-white/62">{student.bio}</p>
        <div className="mt-4">
          <StatusPill status={student.currentStatus} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {student.interests.slice(0, 3).map((interest) => (
            <span
              key={interest}
              className="rounded-full border border-black/6 bg-white/56 px-3 py-1 text-xs text-black/62 dark:border-white/8 dark:bg-white/[0.06] dark:text-white/68"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/find-people/${student.id}`}>
          <Button variant="secondary">View Profile</Button>
        </Link>
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
            {student.connectionStatus === "pending" ? "Pending" : "Connect"}
          </Button>
        )}
      </div>
    </div>
  );
}
