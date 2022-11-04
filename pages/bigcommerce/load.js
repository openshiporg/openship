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

export default function Init({ noShadow, noPadding, noLogo, noSubmit, style }) {
  const theme = useMantineTheme();

  const [domain, setDomain] = useState("");

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
              Connect to Openship
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

          <TextInput
            size="md"
            mt="md"
            required
            label="Instance"
            placeholder="mybikestore"
            rightSection={<Text size="md">.myopenship.com</Text>}
            variant="filled"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            styles={{
              rightSection: {
                width: 150,
                color:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[9]
                    : theme.colors.blueGray[5],

                top: 20,
                bottom: 1,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
              },
            }}
          />

          <Group position="apart" mt="xl">
            <Button
              component="a"
              target="_blank"
              href={`https://${domain}.myopenship.com`}
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
              ml="auto"
              sx={{
                boxShadow: theme.shadows.xs,
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              Connect
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Center>
  );
}
