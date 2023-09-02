/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx, useTheme } from "@keystone-ui/core";

export const TableBodyCell = (props) => {
  const { colors, typography } = useTheme();
  return (
    <td
      css={{
        borderBottom: `1px solid ${colors.border}`,
        fontSize: typography.fontSize.medium,
      }}
      {...props}
    />
  );
};
