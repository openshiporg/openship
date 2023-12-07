import { AdminLink } from "@keystone/components/AdminLink";

/**
 * This is the component you should use when linking a Cell to an item (i.e when the Cell supports
 * the linkTo prop)
 */

export const CellLink = (props) => {
  return (
    <AdminLink
      className="block no-underline hover:underline"
      {...props}
    />
  );
};
