import {
  Group,
  ActionIcon,
  NumberInput,
  useMantineTheme,
  LoadingOverlay,
  Loader,
} from "@mantine/core";
import { GlobeIcon, PlusIcon, DashIcon } from "@primer/octicons-react";
import { useState } from "react";

export const QuantityCounter = ({
  quantity,
  setQuantity,
  min = 1,
  label = true,
  color = "cyan",
}) => {
  const [loading, setLoading] = useState(false);
  const theme = useMantineTheme();

  return (
    <Group spacing={0}>
      {loading && <Loader size="xs" mr={10} />}

      <ActionIcon
        color={color}
        variant="light"
        size="sm"
        onClick={async () => {
          setLoading(true);
          await setQuantity(quantity - 1);
          setLoading(false);
        }}
        sx={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          border: `1px solid ${
            theme.colorScheme === "light"
              ? theme.colors.blueGray[2]
              : theme.colors.blueGray[8]
          }`,
          borderRight: "none",
        }}
        radius={theme.radius.sm}
        disabled={min === quantity || loading}
      >
        <DashIcon />
      </ActionIcon>
      <NumberInput
        hideControls
        styles={{
          input: {
            minHeight: 0,
            height: 22,
            width: 28,
            padding: 0,
            textAlign: "center",
            borderRadius: 0,
            fontSize: 12,
            borderTop: `1px solid ${
              theme.colorScheme === "light"
                ? theme.colors.blueGray[2]
                : theme.colors.blueGray[8]
            }`,
            borderBottom: `1px solid ${
              theme.colorScheme === "light"
                ? theme.colors.blueGray[2]
                : theme.colors.blueGray[8]
            }`,
            lineHeight: "22px"
          },
        }}
        variant="unstyled"
        min={min}
        value={quantity}
        onChange={(e) => parseInt(e) !== quantity && setQuantity(e)}
        disabled={loading}
      />
      <ActionIcon
        color={color}
        variant="light"
        onClick={async () => {
          setLoading(true);
          await setQuantity(quantity + 1);
          setLoading(false);
        }}
        sx={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          border: `1px solid ${
            theme.colorScheme === "light"
              ? theme.colors.blueGray[2]
              : theme.colors.blueGray[8]
          }`,
          borderLeft: "none",
        }}
        size="sm"
        radius={4}
        disabled={loading}
      >
        <PlusIcon />
      </ActionIcon>
    </Group>
  );
};
