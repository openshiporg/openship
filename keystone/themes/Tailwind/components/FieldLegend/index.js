/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx, useTheme } from "@keystone-ui/core";

export const FieldLegend = (props) => {
  const { typography, fields, spacing } = useTheme();
  return (
    <legend
      css={{
        color: fields.legendColor,
        display: "block",
        fontSize: typography.fontSize.small,
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.xsmall,
        minWidth: 120,
        textTransform: "uppercase",
      }}
      {...props}
    />
  );
};
