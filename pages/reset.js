import React, { useState } from "react";
import {
  Box,
  TextInput,
  Group,
  Button,
  Paper,
  Text,
  useMantineTheme,
  Center,
  Notification,
  Stack,
} from "@mantine/core";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { request, gql } from "graphql-request";
import { useForm } from "@mantine/hooks";
import { patterns } from "@components/Patterns";
import { checkAuth } from "keystone/lib/checkAuth";
import { SIGNIN_MUTATION } from "./signin";

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

export default function ResetPage() {
  const router = useRouter();
  const theme = useMantineTheme();

  return (
    <Center
      sx={{
        maxWidth: "100%",
        backgroundColor: theme.colors.blueGray[9],
        backgroundImage: patterns({
          FILLCOLOR: "#fff",
          FILLOPACITY: 0.62,
        }).topography,
        flex: 1,
      }}
      px="sm"
      py="lg"
    >
      <Stack sx={{ maxWidth: "100%" }}>
        <Paper
          p={20}
          sx={{
            width: theme.other.sizes.md,
            position: "relative",
            backgroundColor:
              theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
            maxWidth: "100%",
          }}
        >
          {router.query?.token ? (
            <Reset token={router.query.token} />
          ) : (
            <RequestReset />
          )}
        </Paper>
      </Stack>
    </Center>
  );
}

const Reset = ({ token }) => {
  const router = useRouter();
  const theme = useMantineTheme();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },

    validationRules: {
      email: (value) => /^\S+@\S+$/.test(value),
      password: (value) => /^(?=.*[A-Za-z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/.test(value),
    },

    errorMessages: {
      email: "Invalid email",
      password:
        "Password should contain 1 number, 1 letter and at least 6 characters",
    },
  });

  async function handleSubmit() {
    // e.preventDefault(); // stop the form from submitting
    setError(null);
    setLoading(true);
    const res = await request("/api/graphql", RESET_MUTATION, {
      email: form.values.email,
      password: form.values.password,
      token,
    });
    console.log({ res });
    if (res?.redeemUserPasswordResetToken?.code) {
      setLoading(false);
      setError(res.redeemUserPasswordResetToken.message);
    } else {
      // setLoading(false);
      setSuccess("Password has been reset. Logging you in.");
      const res = await request("/api/graphql", SIGNIN_MUTATION, {
        email: form.values.email,
        password: form.values.password,
      });
      router.push("/");
    }
  }
  return (
    <>
      <Group mt={5} size="sm">
        <Text
          component="span"
          color={
            theme.colorScheme === "light"
              ? theme.colors.blueGray[7]
              : theme.colors.blueGray[0]
          }
          sx={{
            textTransform: "uppercase",
            // color: ({ palette }) => palette.purple[400],
            fontWeight: 800,
            // letterSpacing: -.9,
            color: theme.colors.blueGray[6],
            position: "relative",
            display: "inline-block",
          }}
          size="lg"
          mb={15}
          ml={1}
          mr="auto"
        >
          Reset Password
          <Box
            sx={{
              background: `linear-gradient(90deg, ${theme.colors.orange[6]} 1.95%, ${theme.colors.orange[2]} 100%)`,
              content: '""',
              position: "absolute",
              top: "100%",
              height: 3,
              left: 0,
              width: "100%",
            }}
          />
        </Text>
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          required
          placeholder="you@awesome.com"
          label="Email"
          mt="sm"
          {...form.getInputProps("email")}
        />
        <TextInput
          mt="md"
          type="password"
          required
          placeholder="supersecretpassword"
          label="New Password"
          // icon={<LockIcon />}
          {...form.getInputProps("password")}
        />

        {error && (
          <Notification
            color="red"
            mt="sm"
            sx={{
              boxShadow: theme.shadows.xs,
              borderColor: theme.colors.red[3],
            }}
            styles={{ closeButton: { display: "none" } }}
          >
            {error}
          </Notification>
        )}
        {success && (
          <Notification
            color="blue"
            mt="sm"
            sx={{
              boxShadow: theme.shadows.xs,
              // borderColor: theme.colors.blue[3],
            }}
            styles={{ closeButton: { display: "none" } }}
          >
            {success}
          </Notification>
        )}
        <Group position="apart" mt="xl">
          <Button
            // color={"green"}
            variant="gradient"
            gradient={{
              from: theme.colors.orange[7],
              to: theme.colors.orange[9],
              deg: 105,
            }}
            // variant="light"
            fullWidth
            size="md"
            uppercase
            type="submit"
            ml="auto"
            loading={loading}
            sx={{
              boxShadow: theme.shadows.xs,
              fontWeight: 700,
              letterSpacing: 0.4,
            }}
          >
            Reset Password
          </Button>
        </Group>
      </form>
    </>
  );
};

const RequestReset = () => {
  const router = useRouter();
  const theme = useMantineTheme();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const form = useForm({
    initialValues: {
      email: "",
    },

    validationRules: {
      email: (value) => /^\S+@\S+$/.test(value),
    },

    errorMessages: {
      email: "Invalid email",
    },
  });

  async function handleSubmit() {
    // e.preventDefault(); // stop the form from submitting
    setError(null);
    setLoading(true);
    const res = await request("/api/graphql", REQUEST_RESET_MUTATION, {
      email: form.values.email,
    });
    console.log({ res });
    if (!res?.sendUserPasswordResetLink) {
      setLoading(false);
      setError("Password reset request failed");
    } else {
      setLoading(false);
      setSuccess("Password reset link has been sent to your email.");
    }
  }
  return (
    <>
      <Group mt={5} size="sm">
        <Text
          component="span"
          color={
            theme.colorScheme === "light"
              ? theme.colors.blueGray[7]
              : theme.colors.blueGray[0]
          }
          sx={{
            textTransform: "uppercase",
            // color: ({ palette }) => palette.purple[400],
            fontWeight: 800,
            // letterSpacing: -.9,
            color: theme.colors.blueGray[6],
            position: "relative",
            display: "inline-block",
          }}
          size="lg"
          mb={15}
          ml={1}
          mr="auto"
        >
          Request Password Reset
          <Box
            sx={{
              background: `linear-gradient(90deg, ${theme.colors.red[6]} 1.95%, ${theme.colors.red[2]} 100%)`,
              content: '""',
              position: "absolute",
              top: "100%",
              height: 3,
              left: 0,
              width: "100%",
            }}
          />
        </Text>
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          required
          placeholder="you@awesome.com"
          label="Email"
          mt="sm"
          {...form.getInputProps("email")}
        />
        {error && (
          <Notification
            color="red"
            mt="sm"
            sx={{
              boxShadow: theme.shadows.xs,
              borderColor: theme.colors.red[3],
            }}
            styles={{ closeButton: { display: "none" } }}
          >
            {error}
          </Notification>
        )}
         {success && (
          <Notification
            color="blue"
            mt="sm"
            sx={{
              boxShadow: theme.shadows.xs,
              // borderColor: theme.colors.blue[3],
            }}
            styles={{ closeButton: { display: "none" } }}
          >
            {success}
          </Notification>
        )}
        <Group position="apart" mt="xl">
          <Button
            // color={"green"}
            variant="gradient"
            gradient={{
              from: theme.colors.red[7],
              to: theme.colors.red[9],
              deg: 105,
            }}
            // variant="light"
            fullWidth
            size="md"
            uppercase
            type="submit"
            ml="auto"
            loading={loading}
            sx={{
              boxShadow: theme.shadows.xs,
              fontWeight: 700,
              letterSpacing: 0.4,
            }}
          >
            Send Request
          </Button>
        </Group>
      </form>
    </>
  );
};

// export async function getServerSideProps({ req }) {
//   const { authenticatedItem, redirectToInit } = await checkAuth(req);
//   if (authenticatedItem) {
//     return { redirect: { destination: `/` } };
//   }
//   if (redirectToInit) {
//     return { redirect: { destination: `/init` } };
//   }

//   return {
//     props: {},
//   };
// }
