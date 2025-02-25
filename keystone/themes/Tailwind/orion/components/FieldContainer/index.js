import { cn } from "@keystone/utils/cn";

export const FieldContainer = ({ className, ...props }) => {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
};
