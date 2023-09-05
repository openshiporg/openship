import { TextInput as TI } from "@keystone-ui/fields";

export const TextInput = (props) => {
  if (props.children === null) {
    return null;
  }

  return <TI {...props} />;
};
