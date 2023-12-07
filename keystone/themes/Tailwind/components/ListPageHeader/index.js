import { Fragment } from "react";
import { useList } from "@keystone/keystoneProvider";

export const ListPageHeader = ({ listKey }) => {
  const list = useList(listKey);
  return (
    <Fragment>
      <div>
        <h3>{list.label}</h3>
      </div>
    </Fragment>
  );
};
