import { Label } from "@keystone/primitives/default/ui/label";

export const FieldLabel = (props) => {
  if (props.children === null) {
    return null;
  }

  return <Label className="text-slate-700 dark:text-slate-50 text-md" {...props} />;
};


