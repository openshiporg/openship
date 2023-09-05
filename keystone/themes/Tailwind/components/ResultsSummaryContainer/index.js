/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@keystone-ui/core";

export const ResultsSummaryContainer = ({ children }) => (
  <p
    css={{
      // TODO: don't do this
      // (this is to make it so things don't move when a user selects an item)
      minHeight: 38,

      display: "flex",
      alignItems: "center"
    }}
  >
    {children}
  </p>
);
