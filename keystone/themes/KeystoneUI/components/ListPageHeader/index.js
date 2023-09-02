/** @jsxRuntime classic */
/** @jsx jsx */

import { Fragment } from "react";
import { jsx, Heading } from "@keystone-ui/core";
import { useList } from "@keystone/keystoneProvider";

export const ListPageHeader = ({ listKey }) => {
  const list = useList(listKey);
  return (
    <Fragment>
      <div
        css={{
          alignItems: "center",
          display: "flex",
          flex: 1,
          justifyContent: "space-between"
        }}
      >
        <Heading type="h3">{list.label}</Heading>
      </div>
    </Fragment>
  );
};
