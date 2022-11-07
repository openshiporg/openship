import { formList, useForm } from "@mantine/form";
import {
  TextInput,
  Button,
  useMantineTheme,
  Box,
  Paper,
  Text,
  Stack,
  Code,
} from "@mantine/core";

export const ChannelForm = ({
  label,
  fields,
  metafields,
  handleSubmit,
  buttonText,
  loading,
}) => {
  const theme = useMantineTheme();

  const arrayToObject = (array, key) =>
    array.reduce(
      (obj, item) => ({
        ...obj,
        [item[key]]: "",
      }),
      {}
    );

  const form = useForm({
    initialValues: {
      ...arrayToObject(fields, "name"),
      ...(metafields && {
        metafields: formList(
          metafields.map(({ name }) => ({ key: name, value: "" }))
        ),
      }),
    },
  });

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      {fields.map(
        ({
          name,
          title,
          placeholder,
          rightSection,
          rightSectionWidth = 140,
        }) => (
          <TextInput
            mt="md"
            placeholder={placeholder}
            label={title}
            sx={{ overflow: "hidden" }}
            rightSection={rightSection}
            rightSectionWidth={rightSectionWidth}
            styles={{
              rightSection: {
                width: 140,
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
            {...form.getInputProps(name)}
          />
        )
      )}
      {metafields && (
        <Paper
          p="xs"
          withBorder
          mt="md"
          sx={{
            background:
              theme.colorScheme === "dark"
                ? theme.colors.dark[8]
                : theme.colors.blueGray[1],
          }}
        >
          <Stack px={3} spacing={0}>
            <Text
              weight={500}
              size="xs"
              color={
                theme.colors.blueGray[theme.colorScheme === "dark" ? 3 : 7]
              }
              transform="uppercase"
            >
              {label} fields
            </Text>
          </Stack>
          {metafields.map(
            ({ name, title, placeholder, rightSection }, index) => (
              <TextInput
                mt="sm"
                placeholder={placeholder}
                label={title}
                sx={{ overflow: "hidden" }}
                rightSection={rightSection}
                rightSectionWidth={140}
                size="sm"
                styles={{
                  rightSection: {
                    width: 140,
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
                {...form.getListInputProps("metafields", index, "value")}
              />
            )
          )}
        </Paper>
      )}
      <Box sx={{ display: "flex", width: "100%" }}>
        <Button
          // color="indigo"
          type="submit"
          uppercase
          // variant="light"
          mt={30}
          ml="auto"
          size="md"
          loading={loading}
          variant="gradient"
          gradient={{
            from: theme.colors.indigo[5],
            to: theme.colors.indigo[9],
            deg: 135,
          }}
          sx={{
            fontWeight: 700,
            letterSpacing: 0.6,
            //   border: `1px solid ${
            //     theme.colorScheme === "light" && theme.colors.green[1]
            //   }`,
            boxShadow: theme.shadows.xs,
          }}
        >
          {buttonText ?? "Create Channel"}
        </Button>
      </Box>
    </form>
  );
};
