/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx } from "@keystone-ui/core";

export const TableHeaderRow = ({ children }) => {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
};
