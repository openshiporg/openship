import React, { useState } from "react";
import {
  Group,
  ActionIcon,
  Button,
  Tooltip,
  Popover,
  Text,
  Notification,
  LoadingOverlay,
} from "@mantine/core";
import { GlobeIcon, XIcon } from "@primer/octicons-react";

export function ErrorTooltip({ onClick, label, buttonText }) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Group spacing={0} sx={{ flexWrap: "nowrap", height: 22 }}>
      <Tooltip label="Acknowledge Error" position="top-start">
        <ActionIcon
          radius={5}
          sx={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
          color="red"
          compact
          size="sm"
          onClick={async () => {
            setLoading(true);
            await onClick();
            setLoading(false);
          }}
          variant="filled"
          loading={loading}
        >
          <XIcon size={12} />
        </ActionIcon>
      </Tooltip>

      {/* <Tooltip label={label} position="bottom-end">
        <Button
          sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          color="red"
          variant="light"
          radius={5}
          compact
          size="xs"
        >
          {buttonText}
        </Button>
      </Tooltip> */}
      <Popover
        opened={opened}
        onClose={() => setOpened(false)}
        position="bottom"
        placement="end"
        trapFocus
        closeOnEscape
        width={300}
        styles={{
          body: { pointerEvents: "none", borderWidth: 0 },
          inner: { padding: 0 },
        }}
        target={
          <ActionIcon
            sx={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              fontSize: 11,
              width: "unset",
            }}
            color="red"
            variant="light"
            radius={5}
            compact
            size="sm"
            px={5}
            onMouseEnter={() => setOpened(true)}
            onMouseLeave={() => setOpened(false)}
          >
            {buttonText}
          </ActionIcon>
        }
      >
        <Notification disallowClose={true} color="red">
          {label}
        </Notification>
      </Popover>
    </Group>
  );
}
