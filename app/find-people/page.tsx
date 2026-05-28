import { FindPeopleClient } from "@/components/people/find-people-client";

export default function FindPeoplePage({
  searchParams
}: {
  searchParams: { q?: string; tab?: string };
}) {
  return (
    <FindPeopleClient
      initialQuery={searchParams.q ?? ""}
      initialTab={searchParams.tab === "connections" ? "connections" : "search"}
    />
  );
}
