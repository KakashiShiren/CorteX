import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: true,
      data
    },
    init
  );
}

export function fail(error: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error
    },
    {
      status
    }
  );
}

export function requireUserId() {
  const userId = getSessionUserId();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  return userId;
}
