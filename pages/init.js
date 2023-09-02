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
import { useRouter } from "next/router";
import { request, gql } from "graphql-request";
import { useForm } from "@mantine/hooks";
import { patterns } from "@components/Patterns";
import { checkAuth } from "keystone/lib/checkAuth";

const INITUSER_MUTATION = gql`
  mutation INITUSER_MUTATION(
    $email: String!
    $name: String!
    $password: String!
  ) {
    createInitialUser(
      data: { email: $email, name: $name, password: $password }
    ) {
      sessionToken
    }
  }
`;

export default function Init({ noShadow, noPadding, noLogo, noSubmit, style }) {
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
      const res = await request("/api/graphql", INITUSER_MUTATION, {
        name: form.values.email.split("@")[0],
        email: form.values.email,
        password: form.values.password,
      });
      router.push("/");
    } catch (error) {
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
      <Stack sx={{ maxWidth: "100%" }}>
        <Paper
          p={20}
          sx={{
            width: theme.other.sizes.md,
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
              Create Admin
              <Box
                sx={{
                  background: `linear-gradient(90deg, #9a6a39 1.95%, #eeba7e 100%)`,
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
              autoComplete="do-not-autofill"
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
                  from: "#8d5e32",
                  to: "#d7a76e",
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
        </Paper>
      </Stack>
    </Center>
  );
}

export async function getServerSideProps({ req }) {
  const { authenticatedItem, redirectToInit } = await checkAuth(req);
  if (authenticatedItem) {
    return { redirect: { destination: `/` } };
  }
  if (!redirectToInit) {
    return { redirect: { destination: `/signin` } };
  }

  return {
    props: {},
  };
}
