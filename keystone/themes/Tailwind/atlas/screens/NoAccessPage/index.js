import { ErrorContainer } from "@keystone-6/core/admin-ui/components";
import { AlertTriangleIcon } from "lucide-react";
import { SignoutButton } from "../../components/SignoutButton";

export function NoAccessPage({ sessionsEnabled }) {
  return (
    <ErrorContainer>
      <div className="flex flex-col items-center space-y-4">
        <AlertTriangleIcon size="large" />
        <div>You don't have access to this page.</div>
        {sessionsEnabled ? <SignoutButton /> : null}
      </div>
    </ErrorContainer>
  );
}
