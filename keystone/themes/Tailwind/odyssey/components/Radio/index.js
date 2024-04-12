import { Fragment, forwardRef } from "react";
import { ControlLabel } from "@keystone/components/ControlLabel";

const dotSizeMap = {
  small: 12,
  medium: 16,
  large: 20,
};

const DotIcon = ({ size = "medium" }) => {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      height={`${dotSizeMap[size]}px`}
      width={`${dotSizeMap[size]}px`}
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
};

export const Radio = forwardRef(
  ({ children, className, size, ...props }, ref) => {
    return (
      <ControlLabel
        className={className}
        size={size}
        control={<RadioControl ref={ref} size={size} {...props} />}
      >
        {children}
      </ControlLabel>
    );
  }
);

export const RadioControl = forwardRef(({ size, ...props }, ref) => (
  <Fragment>
    <input ref={ref} type="radio" className="sr-only" {...props} />
    <Indicator size={size}>
      <DotIcon size={size} />
    </Indicator>
  </Fragment>
));

const Indicator = ({ size, ...props }) => {
  return <div {...props} />;
};
