/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx, useTheme } from "@keystone-ui/core";

export const TableHeaderCell = props => {
  const { colors, spacing, typography } = useTheme();
  return (
    <th
      css={{
        backgroundColor: colors.background,
        borderBottom: `2px solid ${colors.border}`,
        color: colors.foregroundDim,
        fontSize: typography.fontSize.medium,
        fontWeight: typography.fontWeight.medium,
        padding: spacing.small,
        textAlign: "left",
        position: "sticky",
        top: 0
      }}
      {...props} />
  );
};
