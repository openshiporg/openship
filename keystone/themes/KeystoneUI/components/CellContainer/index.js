import { useTheme } from "@keystone-ui/core";

/**
 * This is the component you should use when you want the standard padding around a cell value
 */

export const CellContainer = ({ children, ...props }) => {
  const { spacing } = useTheme();
  return (
    <div css={{ padding: spacing.small }} {...props}>
      {children}
    </div>
  );
};
