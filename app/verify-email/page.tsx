import { getSession } from "@/lib/auth";
import { EmailVerificationPage } from "@/components/auth/email-verification-page";

function toSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function VerifyEmailPage({
  searchParams
}: {
  searchParams?: {
    email?: string | string[];
    error?: string | string[];
    universityName?: string | string[];
  };
}) {
  const session = getSession();
  const sessionEmail = session && !session.isVerified ? session.email : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <EmailVerificationPage
        email={toSingleValue(searchParams?.email) ?? sessionEmail}
        error={toSingleValue(searchParams?.error)}
        universityName={toSingleValue(searchParams?.universityName) ?? session?.universityName}
      />
    </main>
  );
}
