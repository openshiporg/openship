import { Input } from "../../primitives/default/ui/input";

export const TextInput = (props) => {
  if (props.children === null) {
    return null;
  }

  return <Input placeholder="Enter value" className="bg-muted/40" {...props} />;
};
