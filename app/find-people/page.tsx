import { FindPeopleClient } from "@/components/people/find-people-client";

export default function FindPeoplePage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  return <FindPeopleClient initialQuery={searchParams.q ?? ""} />;
}
