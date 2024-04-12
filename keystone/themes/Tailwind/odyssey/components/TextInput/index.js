import { Input } from "@keystone/primitives/default/ui/input";

export const TextInput = (props) => {
  if (props.children === null) {
    return null;
  }

  return <Input className="bg-muted" {...props} />;
};
