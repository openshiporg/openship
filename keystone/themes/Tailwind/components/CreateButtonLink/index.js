/** @jsxRuntime classic */
/** @jsx jsx */

import { Button } from "@keystone-ui/button";
import { jsx } from "@keystone-ui/core";
import { AdminLink } from "@keystone/components/AdminLink";

export const CreateButtonLink = (props) => {
  return (
    <Button
      css={{
        textDecoration: "none",
        ":hover": {
          color: "white",
        },
      }}
      as={AdminLink}
      href={`/${props.list.path}/create`}
      tone="active"
      size="small"
      weight="bold"
    >
      Create {props.list.singular}
    </Button>
  );
};
