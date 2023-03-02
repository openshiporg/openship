import { Select, useMantineTheme } from "@mantine/core";

export function ChannelSelect({ channels, type = "lg", ...props }) {
  const theme = useMantineTheme();

  const styles = {
    sm: {
      root: {
        position: "relative",
      },

      input: {
        fontWeight: 600,
        color:
          theme.colorScheme === "light"
            ? theme.colors.indigo[7]
            : theme.colors.dark[0],
        height: 28,
        minHeight: 28,
        paddingLeft: 13,
        border: `1px solid ${
          theme.colors.blueGray[theme.colorScheme === "dark" ? 7 : 2]
        }`,
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        // fontSize: "16px !important",
        background:
          theme.colorScheme === "dark"
            ? theme.colors.dark[5]
            : theme.fn.lighten(theme.colors.blueGray[0], 0.5),
        "&:focus, &:focus-within": {
          outline: "none",
          borderColor: `${
            theme.colors[theme.primaryColor][
              theme.colorScheme === "dark" ? 8 : 5
            ]
          } !important`,
        },
      },

      required: {
        display: "none",
        // ":before": { marginLeft: "auto", content: '" required"' },
      },

      error: {
        fontSize: 14,
      },
      item: {
        fontWeight: 600,
        marginTop: 3,
      },
    },
    lg: {
      root: {
        position: "relative",
      },

      input: {
        fontWeight: 600,
        color:
          theme.colorScheme === "light"
            ? theme.colors.blue[7]
            : theme.colors.dark[0],
        height: "auto",
        paddingTop: 18,
        paddingLeft: 13,
        border: `1px solid ${
          theme.colors.blueGray[theme.colorScheme === "dark" ? 7 : 2]
        }`,
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        // fontSize: "16px !important",
        background:
          theme.colorScheme === "dark"
            ? theme.colors.dark[5]
            : theme.fn.lighten(theme.colors.blueGray[0], 0.5),
        "&:focus, &:focus-within": {
          outline: "none",
          borderColor: `${
            theme.colors[theme.primaryColor][
              theme.colorScheme === "dark" ? 8 : 5
            ]
          } !important`,
        },
      },

      required: {
        display: "none",
        // ":before": { marginLeft: "auto", content: '" required"' },
      },

      error: {
        fontSize: 14,
      },

      label: {
        position: "absolute",
        pointerEvents: "none",
        color: theme.colors.blueGray[theme.colorScheme === "dark" ? 2 : 6],
        fontSize: theme.fontSizes.xs,
        paddingLeft: 14,
        paddingTop: 6,
        zIndex: 1,
      },
      item: {
        fontWeight: 600,
        marginTop: 3,
      },
    },
  };

  return (
    <Select
      // label="Channel"
      data={channels.map(({ id, name }) => ({ label: name, value: id }))}
      maxDropdownHeight={400}
      nothingFound="Nobody here"
      // variant="unstyled"
      // size="xs"
      styles={styles[type]}
      {...props}
    />
  );
}
