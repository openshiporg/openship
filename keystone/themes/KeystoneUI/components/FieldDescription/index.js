import { FieldDescription as FD } from "@keystone-ui/fields";

export const FieldDescription = (props) => {
  if (props.children === null) {
    return null;
  }

  return <FD {...props} />;
};
