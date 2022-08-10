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
  Anchor,
  Stack,
  Alert,
} from "@mantine/core";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { request, gql } from "graphql-request";
import { useForm } from "@mantine/hooks";
import { patterns } from "@components/Patterns";
import { checkAuth } from "@lib/checkAuth";
import { AlertIcon } from "@primer/octicons-react";

export const SIGNIN_MUTATION = gql`
  mutation SIGNIN_MUTATION($email: String!, $password: String!) {
    authenticateUserWithPassword(email: $email, password: $password) {
      ... on UserAuthenticationWithPasswordSuccess {
        item {
          id
          email
          name
        }
      }
      ... on UserAuthenticationWithPasswordFailure {
        message
      }
    }
  }
`;

export default function SignIn({ noSubmit, style, showRegister, devMode }) {
  const router = useRouter();
  const theme = useMantineTheme();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },

    validationRules: {
      email: (value) => /^\S+@\S+$/.test(value),
      // password: value => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(value),
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
    const res = await request("/api/graphql", SIGNIN_MUTATION, {
      email: form.values.email,
      password: form.values.password,
    });
    console.log({ res });
    if (res.authenticateUserWithPassword.message) {
      setLoading(false);
      setError(res.authenticateUserWithPassword.message);
    } else {
      // console.log(router.query.from)
      router.query.from ? router.push(router.query.from) : router.push("/");
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
              Sign In
              <Box
                sx={{
                  background: `linear-gradient(90deg, ${theme.colors.green[6]} 1.95%, ${theme.colors.green[2]} 100%)`,
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
              rightSectionWidth={120}
              rightSection={
                <NextLink href="/reset">
                  <Anchor
                    // href="#"
                    // onClick={(event) => event.preventDefault()}
                    sx={(theme) => ({
                      color:
                        theme.colors.blueGray[
                          theme.colorScheme === "dark" ? 4 : 4
                        ],
                      fontWeight: 500,
                      fontSize: theme.fontSizes.xs,
                    })}
                  >
                    Forgot password
                  </Anchor>
                </NextLink>
              }
              styles={{
                rightSection: {
                  bottom: "30px",
                },
              }}
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
            {!noSubmit && (
              <Group position="apart" mt="xl">
                <Button
                  // color={"green"}
                  variant="gradient"
                  gradient={{
                    from: theme.colors.green[5],
                    to: theme.colors.green[7],
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
                  Sign In
                </Button>
              </Group>
            )}
          </form>
          {showRegister && (
            <Text
              mt="xs"
              size="sm"
              align="center"
              color={theme.colors.blueGray[5]}
              px={2}
            >
              Don't have an account?{" "}
              <NextLink href="/signup">
                <Text
                  component="a"
                  color={theme.colors.blue[5]}
                  weight={500}
                  size="sm"
                  sx={{ cursor: "pointer" }}
                >
                  Register
                </Text>
              </NextLink>
            </Text>
          )}
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
  const { authenticatedItem, redirectToInit } = await checkAuth(req);
  if (authenticatedItem) {
    return { redirect: { destination: `/` } };
  }
  if (redirectToInit) {
    return { redirect: { destination: `/init` } };
  }

  return {
    props: {
      showRegister: process.env.ALLOW_EXTERNAL_SIGNUPS ?? null,
      devMode: process.env.DEV_MODE ?? null,
    },
  };
}
