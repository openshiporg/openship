import { Button } from "@keystone-ui/button";
import { useEffect } from "react";

import { gql, useMutation } from "@keystone-6/core/admin-ui/apollo";

const END_SESSION = gql`
  mutation EndSession {
    endSession
  }
`;

const SignoutButton = ({ children }) => {
  const [endSession, { loading, data }] = useMutation(END_SESSION);
  useEffect(() => {
    if (data?.endSession) {
      window.location.reload();
    }
  }, [data]);

  return (
    <Button size="small" isLoading={loading} onClick={() => endSession()}>
      {children || "Sign out"}
    </Button>
  );
};
export { SignoutButton };
