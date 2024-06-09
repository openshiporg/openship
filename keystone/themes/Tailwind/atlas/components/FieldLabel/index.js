import { Label } from "../../primitives/default/ui/label";

export const FieldLabel = (props) => {
  if (props.children === null) {
    return null;
  }

  return <Label className="text-zinc-700 dark:text-zinc-50 text-md" {...props} />;
};


