import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppProvider } from "./AppProvider";

export function SidebarLink({ children, href, className }) {
  const pathname = usePathname();
  const { setSidebarOpen } = useAppProvider();

  return (
    <Link
      className={`text-sm flex items-center space-x-3 font-medium ${
        pathname === href ? "text-blue-600" : "text-zinc-800 dark:text-zinc-200"
      } ${className}`}
      href={href}
      onClick={() => setSidebarOpen(false)}
    >
      {children}
    </Link>
  );
}
