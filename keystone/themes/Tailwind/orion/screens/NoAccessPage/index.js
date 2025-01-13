import { AlertTriangleIcon } from "lucide-react";
import { SignoutButton } from "../../components/SignoutButton";
import { ErrorContainer } from "../../components/ErrorBoundary";

export function NoAccessPage({ sessionsEnabled }) {
  return (
    <ErrorContainer>
      <div className="flex flex-col items-center text-center space-y-4 border bg-muted/40 p-4 rounded-md">
        <AlertTriangleIcon className="size-32" />
        <div>
          <div>You don't have access to this page.</div>
          <div>Sign out and sign in with a user that has access.</div>
        </div>
        <SignoutButton />
        {/* {sessionsEnabled ? <SignoutButton /> : null} */}
      </div>
    </ErrorContainer>
  );
}
