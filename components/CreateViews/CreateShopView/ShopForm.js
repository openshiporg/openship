import { useForm } from "@mantine/form";
import { TextInput, Button, useMantineTheme, Box } from "@mantine/core";

export const ShopForm = ({
  fields,
  handleSubmit,
  buttonText,
  renderFields,
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
    initialValues: arrayToObject(fields, "name"),
  });

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      {fields.map(({ name, title, placeholder, rightSection, rightSectionWidth = 140 }) => (
        <TextInput
          mt="md"
          placeholder={placeholder}
          label={title}
          sx={{ overflow: "hidden" }}
          rightSection={rightSection}
          rightSectionWidth={rightSectionWidth}
          styles={{
            rightSection: {
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
      ))}
      {renderFields}
      <Box sx={{ display: "flex", width: "100%" }}>
        <Button
          color="indigo"
          type="submit"
          uppercase
          // variant="light"
          mt={30}
          ml="auto"
          size="md"
          loading={loading}
          sx={{
            fontWeight: 700,
            letterSpacing: 0.6,
            //   border: `1px solid ${
            //     theme.colorScheme === "light" && theme.colors.green[1]
            //   }`,
            boxShadow: theme.shadows.xs,
          }}
        >
          {buttonText ?? "Create Shop"}
        </Button>
      </Box>
    </form>
  );
};
