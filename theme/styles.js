import { InputWrapperStyles } from "./InputWrapperStyles";

export const styles = {
  Drawer: (theme) => ({
    drawer: {
      background: theme.colorScheme === "light"
        ? theme.colors.gray[0]
        : theme.colors.dark[7],
    },
  }),
  TextInput: InputWrapperStyles,
  MultiSelect: InputWrapperStyles,
  Modal: (theme) => ({
    modal: {
      overflow: "hidden",
    },
    header: {
      background: theme.colors.gray[theme.colorScheme === "dark" ? 9 : 1],
      marginLeft: -20,
      marginRight: -20,
      marginTop: -20,
      paddingLeft: 24,
      paddingRight: 20,
      paddingTop: 16,
      paddingBottom: 14,
      borderBottom: `1px solid ${theme.colors.blueGray[theme.colorScheme === "dark" ? 9 : 2]}`,
    },
  }),
};
