import { getUserStatus } from "@/lib/repository";
import { ok } from "@/lib/http";

export async function GET(_: Request, { params }: { params: { userId: string } }) {
  return ok(getUserStatus(params.userId));
}
