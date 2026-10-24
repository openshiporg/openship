// Server Component
import { Logo } from "../../components/Logo";
import { ResetForm } from "./ResetForm";
import Link from "next/link";
import { passwordResetEmailAvailable, RESET_EMAIL_UNAVAILABLE } from "../../lib/authFlow";

type ResetPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function ResetPage({ searchParams }: ResetPageProps) {
  const resolvedSearchParams = await searchParams;
  const token =
    typeof resolvedSearchParams.token === "string"
      ? resolvedSearchParams.token
      : null;
  const mode = token ? "reset" : "request";
  const emailUnavailable = mode === "request" && !passwordResetEmailAvailable();

  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center space-x-1.5">
          <Logo aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-lg font-semibold text-foreground dark:text-foreground">
          {mode === "reset" ? "Reset your password" : "Reset password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
          {mode === "reset"
            ? "Enter your new password below."
            : emailUnavailable
              ? RESET_EMAIL_UNAVAILABLE
              : "Enter your email address and we'll send you a link to reset your password."}
        </p>

        {!emailUnavailable && <ResetForm mode={mode} token={token} />}
        <p className="mt-6 text-sm">
          <Link
            href="/dashboard/signin"
            className="font-medium text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}