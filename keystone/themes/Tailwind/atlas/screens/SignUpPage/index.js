import { useState, useRef, useEffect } from "react";
import { useMutation, gql } from "@keystone-6/core/admin-ui/apollo";
import { useRouter } from "next/navigation";
import { useReinitContext, useRawKeystone } from "@keystone/keystoneProvider";
import { useRedirect } from "@keystone/utils/useRedirect";

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
import Link from "next/link";

const SIGNUP_MUTATION = gql`
  mutation SIGNUP_MUTATION(
    $email: String!
    $name: String!
    $password: String!
  ) {
    createUser(data: { email: $email, name: $name, password: $password }) {
      id
      email
      name
    }
  }
`;

const SIGNIN_MUTATION = gql`
  mutation SIGNIN_MUTATION($email: String!, $password: String!) {
    authenticateUserWithPassword(email: $email, password: $password) {
      ... on UserAuthenticationWithPasswordSuccess {
        item {
          id
        }
      }
      ... on UserAuthenticationWithPasswordFailure {
        message
      }
    }
  }
`;

export const SignUpPage = () => {
  const [state, setState] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const [signUpMutate] = useMutation(SIGNUP_MUTATION);
  const [signInMutate] = useMutation(SIGNIN_MUTATION);
  const reinitContext = useReinitContext();
  const router = useRouter();
  const rawKeystone = useRawKeystone();
  const redirect = useRedirect();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signUpMutate({
        variables: {
          name: state.email.split("@")[0],
          email: state.email,
          password: state.password,
        },
      });

      if (res.data.createUser) {
        const signInRes = await signInMutate({
          variables: {
            email: state.email,
            password: state.password,
          },
        });

        if (
          signInRes.data.authenticateUserWithPassword.__typename ===
          "UserAuthenticationWithPasswordSuccess"
        ) {
          await reinitContext();
          router.push(redirect);
        } else {
          setError("Failed to sign in after account creation.");
        }
      }
    } catch (error) {
      if (
        error?.message.includes(
          "Unique constraint failed on the fields: (`email`)"
        )
      ) {
        router.push("/dashboard/signin");
      } else {
        setError(error?.message || "An error occurred during sign up.");
      }
    }

    setLoading(false);
  };

  return (
    <div
      className={`px-2 h-screen flex justify-center items-center bg-[#0f172a] heropattern-topography-zinc-500/10 dark:bg-background`}
    >
      <div className="flex flex-col gap-2 md:gap-4 basis-[450px] px-2">
        <form onSubmit={onSubmit}>
          <Card className="overflow-hidden shadow-sm dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-wide text-slate-600 dark:text-white">
                <div className="inline-block">
                  <span>SIGN UP</span>
                  <div className="h-1 mt-0.5 bg-gradient-to-r from-blue-700 to-blue-200 dark:from-blue-800 dark:to-blue-600"></div>
                </div>
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
                    onChange={(e) =>
                      setState({ ...state, email: e.target.value })
                    }
                    placeholder="you@example.com"
                    ref={emailRef}
                    className="bg-muted"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password" className="text-md">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    value={state.password}
                    onChange={(e) =>
                      setState({ ...state, password: e.target.value })
                    }
                    placeholder="supersecretpassword"
                    type="password"
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col justify-between">
              <Button
                variant="light"
                className="w-full text-md tracking-wide h-11 md:h-12 font-semibold text-white uppercase transition-all duration-200 ease-in-out bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-700 dark:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 dark:text-gray-100"
                isLoading={loading}
                type="submit"
              >
                SIGN UP
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

        <div className="text-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/dashboard/signin"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign In
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};
