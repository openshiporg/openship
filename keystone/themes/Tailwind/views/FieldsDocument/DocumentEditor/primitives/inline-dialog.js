/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx, Portal, useTheme } from "@keystone-ui/core";
import { forwardRef } from "react";

export const InlineDialog = forwardRef(({ isRelative, ...props }, ref) => {
  const { radii, spacing } = useTheme();
  const relativeStyles = isRelative
    ? {
        left: "50%",
        margin: spacing.small,
        transform: "translateX(-50%)",
      }
    : {};

  let dialog = (
    <div
      ref={ref}
      contentEditable={false}
      css={{
        background: "white",
        borderRadius: radii.small,
        boxShadow: `rgba(9, 30, 66, 0.31) 0px 0px 1px, rgba(9, 30, 66, 0.25) 0px 4px 8px -2px`,
        padding: spacing.small,
        position: "absolute",
        userSelect: "none",
        ...relativeStyles,
      }}
      {...props}
    />
  );

  if (isRelative) {
    return dialog;
  }

  return <Portal>{dialog}</Portal>;
});
