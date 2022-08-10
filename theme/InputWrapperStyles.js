
export const InputWrapperStyles = (theme) => ({
  root: {
    position: "relative",
  },

  input: {
    height: "auto",
    paddingTop: 18,
    paddingLeft: 13,
    border: `1px solid ${theme.colors.gray[theme.colorScheme === "dark" ? 7 : 2]}`,
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    // fontSize: "16px !important",
    background: theme.colorScheme === "dark"
      ? theme.colors.dark[5]
      : theme.fn.lighten(theme.colors.blueGray[0], 0.5),
    "&:focus, &:focus-within": {
      outline: "none",
      borderColor: `${theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 8 : 5]} !important`,
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
});
