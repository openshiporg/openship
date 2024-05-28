import { Button } from "../../primitives/default/ui/button";

export function SignoutButton({ loading, endSession, children }) {
  return (
    <Button size="sm" isLoading={loading} onClick={() => endSession()}>
      {children || "Sign out"}
    </Button>
  );
}
