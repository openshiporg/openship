import React from "react";
import { Paper, Text, useMantineTheme, Group, Box, Stack } from "@mantine/core";
import { EditDetails } from "./EditDetails";

export const Details = ({ shopId, name, type, domain, accessToken }) => {
  const theme = useMantineTheme();
  const details = [
    // {
    //   label: "Name",
    //   value: name,
    //   edit: true,
    //   functionValue: "name",
    // },
    {
      label: "Domain",
      value: domain,
      edit: true,
      functionValue: "domain",
    },
    {
      label: "Access Token",
      value: accessToken,
      edit: true,
      functionValue: "accessToken",
      type: "password",
    },
    {
      label: "Type",
      value: type,
      transform: "uppercase",
    },
  ];

  return (
    <Paper
      //   height={PRIMARY_COL_HEIGHT}
      radius="sm"
      //   shadow="xs"
      withBorder
      sx={{ maxWidth: 600 }}
    >
      <Stack px="xs" py={5} spacing={0}>
        <Text
          weight={600}
          size="sm"
          color={theme.colors.blueGray[theme.colorScheme === "dark" ? 3 : 7]}
        >
          Shop Details
        </Text>
        <Text size="xs" color="dimmed">
          Edit details
        </Text>
      </Stack>
      {details.map((detail) => (
        <Group
          spacing={0}
          px="sm"
          py="xs"
          noWrap
          sx={{
            maxWidth: "100%",
            borderTop: `1px solid ${
              theme.colorScheme === "light"
                ? theme.colors.blueGray[2]
                : theme.colors.dark[8]
            }`,
            "&:first-of-type": {
              borderTop: "none",
            },
          }}
        >
          <Box sx={{ flexBasis: 150 }}>
            <Text
              size="sm"
              weight={600}
              color={
                theme.colors.blueGray[theme.colorScheme === "dark" ? 4 : 5]
              }
            >
              {detail.label}
            </Text>
          </Box>

          <Box
            ml={-2}
            sx={{
              overflow: "hidden",
              flex: 1,
              maxWidth: "100%",
              textTransform: detail.transform,
            }}
          >
            {detail.edit ? (
              <EditDetails detail={detail} shopId={shopId} />
            ) : (
              <Text size="sm" weight={400} ml={2}>
                {detail.value}
              </Text>
            )}
          </Box>

          {/* <div class="flex-child short-and-fixed">
          <div></div>
          <div></div>
          <div></div>
        </div> */}
        </Group>
      ))}

      {/* {details.map((detail) => (
        <Group
          spacing={0}
          px="sm"
          py="xs"
          noWrap
          sx={{
            borderTop: `1px solid ${
              theme.colorScheme === "light"
                ? theme.colors.blueGray[2]
                : theme.colors.dark[8]
            }`,
            "&:first-of-type": {
              borderTop: "none",
            },
          }}
        >
          <Box sx={{ flexBasis: 150 }}>
            <Text
              size="sm"
              weight={600}
              color={
                theme.colors.blueGray[theme.colorScheme === "dark" ? 4 : 5]
              }
            >
              {detail.label}
            </Text>
          </Box>
          <Box ml={-2} sx={{ flex: 1, textTransform: detail.transform }}>
            {detail.edit ? (
              <EditDetails detail={detail} shopId={shopId} />
            ) : (
              <Text size="sm" weight={400} ml={2}>
                {detail.value}
              </Text>
            )}
          </Box>
        </Group>
      ))} */}
    </Paper>
  );
};
