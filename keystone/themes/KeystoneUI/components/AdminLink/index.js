/** @jsxRuntime classic */
/** @jsx jsx */

import Link from "next/link";
import { jsx } from "@keystone-ui/core";

export const AdminLink = ({ href, children, ...props }) => {
  const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || "/dashboard";
  const adminHref = `${adminPath}${href}`;

  return (
    <Link href={adminHref} {...props}>
      {children}
    </Link>
  );
};
