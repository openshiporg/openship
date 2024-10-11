import { useState, useRef, useEffect } from "react";
import { useMutation, gql } from "@keystone-6/core/admin-ui/apollo";
import { useRouter } from "next/navigation";
import { useReinitContext, useRawKeystone } from "@keystone/keystoneProvider";
import { useRedirect } from "@keystone/utils/useRedirect";
import { basePath } from "@keystone/index"; // Import basePath

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../primitives/default/ui/card";

import { Button } from "../../primitives/default/ui/button";
import { Input } from "../../primitives/default/ui/input";
import { Label } from "../../primitives/default/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../../primitives/default/ui/alert";
import { AlertCircle } from "lucide-react";


const RESET_MUTATION = gql`
  mutation RESET_MUTATION(
    $email: String!
    $password: String!
    $token: String!
  ) {
    redeemUserPasswordResetToken(
      email: $email
      token: $token
      password: $password
    ) {
      code
      message
    }
  }
`;

const REQUEST_RESET_MUTATION = gql`
  mutation REQUEST_RESET_MUTATION($email: String!) {
    sendUserPasswordResetLink(email: $email)
  }
`;

export function ResetPage() {
  const router = useRouter();
  const [mode, setMode] = useState(router.query?.token ? "reset" : "request");
  const [state, setState] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const [resetMutate] = useMutation(RESET_MUTATION);
  const [requestResetMutate] = useMutation(REQUEST_RESET_MUTATION);

  const emailRef = useRef(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, [mode]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "reset") {
        const { data } = await resetMutate({
          variables: {
            email: state.email,
            password: state.password,
            token: router.query.token,
          },
        });
        if (data?.redeemUserPasswordResetToken?.code) {
          setError(data.redeemUserPasswordResetToken.message);
        } else {
          setSuccess("Password has been reset. You can now sign in.");
          setTimeout(() => router.push(`${basePath}/signin`), 3000); // Use basePath here
        }
      } else {
        const { data } = await requestResetMutate({
          variables: { email: state.email },
        });
        if (data?.sendUserPasswordResetLink) {
          setSuccess("Password reset link has been sent to your email.");
        } else {
          setError("Password reset request failed");
        }
      }
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  };

  return (
    <div className={`px-2 h-screen flex justify-center items-center bg-[#0f172a] heropattern-topography-zinc-500/10 dark:bg-background`}>
      <div className="flex flex-col gap-2 md:gap-4 basis-[450px] px-2">
        <form onSubmit={onSubmit}>
          <Card className="overflow-hidden shadow-sm dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-wide text-slate-600 dark:text-white">
                {mode === "reset" ? "RESET PASSWORD" : "REQUEST PASSWORD RESET"}
                <div className="h-1 w-20 mt-0.5 bg-gradient-to-r from-orange-700 to-orange-200 dark:from-orange-800 dark:to-orange-600"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email" className="text-md">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    value={state.email}
                    onChange={(e) => setState({ ...state, email: e.target.value })}
                    placeholder="you@example.com"
                    ref={emailRef}
                    className="bg-muted"
                  />
                </div>
                {mode === "reset" && (
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="password" className="text-md">
                      New Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      value={state.password}
                      onChange={(e) => setState({ ...state, password: e.target.value })}
                      placeholder="New password"
                      type="password"
                      className="bg-muted"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col justify-between">
              <Button
                variant="light"
                className="w-full text-md tracking-wide h-11 md:h-12 font-semibold text-white uppercase transition-all duration-200 ease-in-out bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 dark:from-orange-700 dark:to-orange-800 dark:hover:from-orange-800 dark:hover:to-orange-900 dark:text-gray-100"
                isLoading={loading}
                type="submit"
              >
                {mode === "reset" ? "RESET PASSWORD" : "SEND RESET LINK"}
              </Button>
            </CardFooter>
          </Card>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mt-4 bg-green-100 dark:bg-green-900">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}