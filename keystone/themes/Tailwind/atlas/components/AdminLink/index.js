import { basePath } from '@keystone/index';
import { Link } from 'next-view-transitions';

export const AdminLink = ({ href, children, ...props }) => {
  const adminPath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

  if (typeof href === "object" && href.pathname) {
    href.pathname = adminPath + (href.pathname.startsWith('/') ? href.pathname : `/${href.pathname}`);
  } else if (typeof href === "string") {
    href = adminPath + (href.startsWith('/') ? href : `/${href}`);
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
};
