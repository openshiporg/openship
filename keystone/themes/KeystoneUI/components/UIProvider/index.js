import { Core } from "@keystone-ui/core";

export const UIProvider = ({ children }) => {
  return (
    <body>
      <Core>{children}</Core>
    </body>
  );
};
