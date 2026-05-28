import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: true,
      data
    },
    init
  );
}

export function fail<T>(error: string, status = 400, data?: T) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(data === undefined ? {} : { data })
    },
    {
      status
    }
  );
}

export function requireUserId() {
  const session = getSession();
  if (!session || !session.isVerified) {
    throw new Error("UNAUTHORIZED");
  }

  return session.userId;
}
