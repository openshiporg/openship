import {
  Box,
  Text,
  Code,
  Switch,
  Tooltip,
  Group,
  useMantineTheme,
  Loader,
  ThemeIcon,
} from "@mantine/core";
import { AlertIcon, GlobeIcon, QuestionIcon } from "@primer/octicons-react";
import { useState } from "react";
import useSWR from "swr";

export const WebhookSwitch = ({
  domain,
  accessToken,
  check,
  toggle,
  topic,
  endpoint,
}) => {
  const theme = useMantineTheme();
  const [loading, setLoading] = useState(false);
  const params = new URLSearchParams({
    accessToken,
    domain,
    endpoint,
    topic,
  }).toString();

  const url = `${check}?${params}`;

  const { data, error, mutate } = useSWR(url);


  const toggleWebhookEndpoint = async () => {
    setLoading(true);
    const res = await fetch(`${toggle}`, {
      body: JSON.stringify({
        accessToken,
        domain,
        endpoint,
        topic,
        exists: data.exists
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const { error, success } = await res.json();
    setLoading(false);

    if (error) {
      setLoading(false);
      // toast({
      //   position: 'top-right',
      //   title: 'An error occurred.',
      //   description: error,
      //   status: 'error',
      //   duration: 3000,
      //   isClosable: true,
      // });
    }

    // toast({
    //   position: 'top-right',
    //   title: 'Success!',
    //   description: success,
    //   status: 'success',
    //   duration: 3000,
    //   isClosable: true,
    // });

    await mutate(url);
  };

  return (
    <Group spacing={5} align="center" sx={{ height: 20 }}>
      {loading && <Loader size={16} />}
      <SwitchHandler data={data} error={error} toggleWebhookEndpoint={toggleWebhookEndpoint} />
    </Group>
  );
};

const SwitchHandler = ({ data, error, toggleWebhookEndpoint }) => {
  if (error)
    return (
      <Box>
        <Tooltip label={"Check webhook endpoint not available"}>
          <ThemeIcon
            variant="light"
            color="red"
            size="sm"
            sx={(theme) => ({
              border: `1px solid ${
                theme.colors.red[theme.colorScheme === "dark" ? 9 : 1]
              }`,
            })}
          >
            <AlertIcon size={12} />
          </ThemeIcon>
        </Tooltip>
      </Box>
    );
  if (!data) return <Loader size={16} />;
  return (
    <Switch
      size="xs"
      marginLeft="auto"
      checked={data.exists}
      onChange={toggleWebhookEndpoint}
      styles={{ input: { cursor: "pointer" } }}
    />
  );
};
