/** @jsxRuntime classic */
/** @jsx jsx */

import { Fragment, forwardRef } from "react";
import { jsx, VisuallyHidden } from "@keystone-ui/core";
import { useIndicatorStyles, useIndicatorTokens } from "./hooks/indicators";
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
      css={{
        verticalAlign: "text-bottom", // removes whitespace inside buttons
        fill,
        stroke,
        strokeLinejoin: "round",
        strokeLinecap: "round",
        strokeWidth: 3,
      }}
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
    <VisuallyHidden ref={ref} as="input" type="radio" {...props} />
    <Indicator size={size}>
      <DotIcon size={size} />
    </Indicator>
  </Fragment>
));

const Indicator = ({ size, ...props }) => {
  const tokens = useIndicatorTokens({ type: "radio", size: size || "medium" });
  const styles = useIndicatorStyles({ tokens });
  return <div css={styles} {...props} />;
};
