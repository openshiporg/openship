/** @jsxRuntime classic */
/** @jsx jsx */

import { ErrorContainer } from "@keystone-6/core/admin-ui/components";
import { jsx, Stack } from "@keystone-ui/core";
import { AlertTriangleIcon } from "@keystone-ui/icons/icons/AlertTriangleIcon";
import { SignoutButton } from "@keystone/components/SignoutButton";

export function NoAccessPage({ sessionsEnabled }) {
  return (
    <ErrorContainer>
      <Stack align="center" gap="medium">
        <AlertTriangleIcon size="large" />
        <div>You don't have access to this page.</div>
        {sessionsEnabled ? <SignoutButton /> : null}
      </Stack>
    </ErrorContainer>
  );
}
