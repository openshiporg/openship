import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAppProvider } from "./AppProvider"

export function SidebarLink({ children, href }) {
  const pathname = usePathname()
  const { setSidebarOpen } = useAppProvider()

  return (
    <Link
      className={`flex items-center space-x-3 font-medium ${
        pathname === href
          ? "text-blue-600"
          : "text-slate-800 dark:text-slate-200"
      }`}
      href={href}
      onClick={() => setSidebarOpen(false)}
    >
      {children}
    </Link>
  )
}
