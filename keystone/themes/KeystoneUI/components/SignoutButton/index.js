import { jsx } from "@keystone-ui/core";
import { Button } from "@keystone-ui/button";

export function SignoutButton({ loading, endSession, children }) {
  return (
    <Button size="small" isLoading={loading} onClick={() => endSession()}>
      {children || "Sign out"}
    </Button>
  );
}
