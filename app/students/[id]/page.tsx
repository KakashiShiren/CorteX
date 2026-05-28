import { redirect } from "next/navigation";

export default function StudentAliasPage({
  params
}: {
  params: {
    id: string;
  };
}) {
  redirect(`/find-people/${params.id}`);
}
