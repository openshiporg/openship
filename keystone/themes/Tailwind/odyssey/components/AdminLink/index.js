import Link from "next/link";

export const AdminLink = ({ href, children, ...props }) => {
  const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || "/dashboard";

  if (typeof href === "object" && href.pathname) {
    href.pathname = `${adminPath}${href.pathname}`;
  } else if (typeof href === "string") {
    href = `${adminPath}${href}`;
  }
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
};
