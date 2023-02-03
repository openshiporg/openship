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
import { checkAuth } from "@lib/checkAuth";
import { SIGNIN_MUTATION } from "./signin";

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

export default function SignUp({ style, devMode }) {
  const router = useRouter();
  const theme = useMantineTheme();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      // firstName: "",
      // lastName: "",
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
        "Password should contain 1 number, 1 letter and at least 8 characters",
    },
  });

  async function handleSubmit(values) {
    setError(null);
    setLoading(true);

    try {
      const res = await request("/api/graphql", SIGNUP_MUTATION, {
        name: form.values.email.split("@")[0],
        email: form.values.email,
        password: form.values.password,
      });
      if (res.createUser) {
        const res = await request("/api/graphql", SIGNIN_MUTATION, {
          email: form.values.email,
          password: form.values.password,
        });
        router.push("/");
      }
    } catch (error) {
      if (
        error?.response?.errors[0]?.message ===
        "Prisma error: Unique constraint failed on the fields: (`email`)"
      )
        router.push("/signin");
      setLoading(false);
      setError(JSON.stringify(error?.response?.errors[0]?.message));
    }
  }

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
      <Stack sx={{ maxWidth: "100%", width: theme.other.sizes.md }}>
        <Paper
          p={20}
          sx={{
            position: "relative",
            backgroundColor:
              theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
            maxWidth: "100%",
            ...style,
          }}
        >
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
              Sign Up
              <Box
                sx={{
                  background: `linear-gradient(90deg, ${theme.colors.blue[6]} 1.95%, ${theme.colors.blue[2]} 100%)`,
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
              label="Password"
              // icon={<LockIcon />}
              {...form.getInputProps("password")}
            />

            {error && (
              <Notification
                color="red"
                mt="sm"
                sx={{ boxShadow: theme.shadows.xs }}
                styles={{ closeButton: { display: "none" } }}
              >
                {error}
              </Notification>
            )}

            <Group position="apart" mt="xl">
              <Button
                // color={"green"}
                variant="gradient"
                gradient={{
                  from: theme.colors.blue[5],
                  to: theme.colors.blue[7],
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
                Get Started
              </Button>
            </Group>
          </form>
          <Text
            mt="xs"
            size="sm"
            align="center"
            color={theme.colors.blueGray[5]}
            px={2}
          >
            Already have an account?{" "}
            <NextLink href="/signin">
              <Text
                component="a"
                color={theme.colors.blue[5]}
                weight={500}
                size="sm"
                sx={{ cursor: "pointer" }}
              >
                Login
              </Text>
            </NextLink>
          </Text>
        </Paper>
        {devMode && (
          <Notification
            title="Developmental Server"
            color="red"
            styles={{ closeButton: { display: "none" } }}
          >
            Use this developmental server to test out Openship, custom shops, and custom
            channels. All data will be wiped daily. Please don't use for
            production.
          </Notification>
        )}
      </Stack>
    </Center>
  );
}

export async function getServerSideProps({ req }) {
  if (!process.env.ALLOW_EXTERNAL_SIGNUPS) {
    return { redirect: { destination: `/signin` } };
  }
  const { authenticatedItem, redirectToInit } = await checkAuth(req);
  if (authenticatedItem) {
    return { redirect: { destination: `/` } };
  }
  if (redirectToInit) {
    return { redirect: { destination: `/init` } };
  }

  return {
    props: {
      devMode: process.env.DEV_MODE ?? null,
    },
  };
}
