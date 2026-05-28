"use client";

import Link from "next/link";

import { Student } from "@/lib/types";
import { ConnectionActionButton } from "@/components/people/connection-action-button";
import { StatusPill } from "@/components/people/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function StudentCard({ student }: { student: Student }) {
  return (
    <div className="cortex-panel hover-lift group relative flex h-full flex-col justify-between overflow-hidden p-6">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#1E5A3A]/80 transition group-hover:bg-cortex-garnet" />
      <div>
        <div className="flex items-start gap-4">
          <Avatar
            name={student.name}
            imageUrl={student.profilePictureUrl}
            avatarColor={student.avatarColor}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/find-people/${student.id}`}
              className="block max-w-full font-display text-3xl leading-none transition [overflow-wrap:anywhere] hover:text-cortex-garnet dark:hover:text-cortex-gold"
            >
              {student.name}
            </Link>
            <div className="mt-2 text-sm text-black/56 dark:text-white/58">
              {student.major} - {student.year}
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
        <ConnectionActionButton
          studentId={student.id}
          initialStatus={student.connectionStatus}
          initialConnectionId={student.connectionId}
        />
      </div>
    </div>
  );
}
