/**
 * This is the component you should use when you want the standard padding around a cell value
 */

export const CellContainer = ({ children, ...props }) => {
  return (
    <div {...props}>
      {children}
    </div>
  );
};
