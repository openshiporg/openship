/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx } from "@keystone-ui/core";

export const TableContainer = ({ children }) => {
  return (
    <table
      css={{
        minWidth: "100%",
        tableLayout: "fixed",
        "tr:last-child td": { borderBottomWidth: 0 },
      }}
      cellPadding="0"
      cellSpacing="0"
    >
      {children}
    </table>
  );
};
