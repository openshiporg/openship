import { basePath } from '@keystone/index';
import { Link } from 'next-view-transitions';

export const AdminLink = ({ href, children, ...props }) => {
  const adminPath = basePath

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
