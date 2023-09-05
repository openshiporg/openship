import { FieldLabel as FL } from "@keystone-ui/fields";

export const FieldLabel = (props) => {
  if (props.children === null) {
    return null;
  }

  return <FL {...props} />;
};
