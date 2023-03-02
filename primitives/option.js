import { Box, Text, Tabs, useMantineTheme, Group } from "@mantine/core";

export const Option = ({
  title,
  options,
  update,
  color = "blue",
  selected,
  unselectedColor = "gray.50",
  styleProps,
}) => {
  const theme = useMantineTheme();

  // useEffect(() => {
  //   // This effect uses the `value` variable,
  //   // so it "depends on" `value`.
  //   update(options[0]?.value);
  // }, [options]);

  return (
    options.length > 0 && (
      <Box
        sx={{
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <Text
          size="xs"
          weight={500}
          color={
            theme.colorScheme === "light"
              ? theme.colors.dark[3]
              : theme.colors.dark[0]
          }
          transform="uppercase"
          mb={3}
          ml={2}
        >
          {title}
        </Text>
        {/* {selected} */}
        <Group spacing={6}>
          {options.map((a, index) => (
            <Box
              key={index}
              onClick={() => update(a.value)}
              sx={{
                borderRadius: 3,
                textTransform: "uppercase",
                fontWeight: "600",

                color:
                  a.value === selected
                    ? `${
                        theme.colorScheme === "light"
                          ? theme.colors[color][7]
                          : theme.white
                      }`
                    : `${
                        theme.colorScheme === "light"
                          ? theme.colors.blueGray[7]
                          : theme.colors.blueGray[0]
                      }`,
                background:
                  a.value === selected
                    ? `${
                        theme.colorScheme === "light"
                          ? theme.colors[color][0]
                          : theme.colors[color][9]
                      }`
                    : `${
                        theme.colorScheme === "light"
                          ? theme.colors.blueGray[0]
                          : theme.colors.gray[9]
                      }`,
                paddingLeft: "10px",
                paddingRight: "10px",
                paddingTop: "2px",
                paddingBottom: "2px",
                fontSize: `${theme.fontSizes.sm}px`,
                letterSpacing: 1,
                border: `1px solid ${
                  theme.colorScheme === "light"
                    ? theme.colors.blueGray[1]
                    : theme.colors.blueGray[8]
                }`,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor:
                    a.value !== selected &&
                    (theme.colorScheme === "light"
                      ? theme.colors.gray[1]
                      : theme.colors.dark[6]),
                },
              }}
            >
              {a.name}
            </Box>
          ))}
        </Group>
      </Box>
    )
  );
};
