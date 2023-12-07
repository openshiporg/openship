import { Fragment, forwardRef } from "react";

import { ControlLabel } from "../ControlLabel";
import { Checkbox as CB } from "@keystone/primitives/default/ui/checkbox";

export const Checkbox = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <ControlLabel
      className={className}
      control={<CheckboxControl ref={ref} {...props} />}
    >
      {children}
    </ControlLabel>
  );
});

export const CheckboxControl = forwardRef(
  ({ className, size, onChange, ...props }, ref) => (
    <Fragment>
      <input ref={ref} type="checkbox" className="sr-only" {...props} />
      <CB
        size={size}
        onCheckedChange={(e) => onChange({ target: { checked: e } })}
        {...props}
      />
    </Fragment>
  )
);
