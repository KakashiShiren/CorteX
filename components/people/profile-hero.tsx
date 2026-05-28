"use client";

import { useRouter } from "next/navigation";

import { Student } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConnectionActionButton } from "@/components/people/connection-action-button";
import { StatusPill } from "@/components/people/status-pill";

export function ProfileHero({ student }: { student: Student }) {
  const router = useRouter();

  return (
    <div className="cortex-panel p-8 sm:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-5">
          <Avatar
            name={student.name}
            imageUrl={student.profilePictureUrl}
            avatarColor={student.avatarColor}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="text-4xl leading-tight [overflow-wrap:anywhere]">{student.name}</div>
            <div className="mt-3 text-sm text-black/60 dark:text-white/60">
              {student.major} &middot; {student.year} &middot; {student.residence}
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
          <ConnectionActionButton
            studentId={student.id}
            initialStatus={student.connectionStatus}
            initialConnectionId={student.connectionId}
            size="lg"
          />
          <Button variant="secondary" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
