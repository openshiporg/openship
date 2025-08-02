// Server Component
import { Logo } from "../../components/Logo";
import { SignInForm } from "./SignInForm";
import Link from "next/link";

type SignInPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const from =
    typeof resolvedSearchParams.from === "string"
      ? resolvedSearchParams.from
      : "/dashboard";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center space-x-1.5">
          <Logo aria-hidden="true" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-foreground dark:text-foreground">
          Sign in to your account
        </h3>
        <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
          Don&apos;t have an account?
          <Link
            href="/dashboard/signup"
            className="ml-1 font-medium text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90"
          >
            Sign up
          </Link>
        </p>
        <SignInForm from={from} />
        <p className="mt-6 text-sm text-muted-foreground dark:text-muted-foreground">
          Forgot your password?
          <Link
            href="/dashboard/reset"
            className="ml-1 font-medium text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90"
          >
            Reset password
          </Link>
        </p>
      </div>
    </div>
  );
}