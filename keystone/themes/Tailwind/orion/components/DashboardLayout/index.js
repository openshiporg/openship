import React from "react";
import { useKeystone } from "@keystone/keystoneProvider";
import { AppSidebar } from "./components/AppSidebar";
import { usePathname, useRouter } from "next/navigation";
import { basePath } from "@keystone/index";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../primitives/default/ui/breadcrumb";
import { Separator } from "../../primitives/default/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../primitives/default/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../primitives/default/ui/dropdown-menu";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

const routePatterns = {
  root: {
    pattern: /^\/$/,
    crumb: (base) => ({
      type: "link",
      label: "Dashboard",
      href: base
    })
  },
  platformSection: {
    pattern: /^\/platform\/([^\/]+)$/,
    crumb: (base, matches) => [
      {
        type: "link",
        label: "Platform",
        // href: `${base}/platform`
        href: "#"
      },
      {
        type: "page",
        label: matches[1].charAt(0).toUpperCase() + matches[1].slice(1),
        // href: `${base}/platform/${matches[1]}`
      }
    ]
  },
  platformCreate: {
    pattern: /^\/platform\/([^\/]+)\/create$/,
    crumb: (base, matches) => [
      {
        type: "link",
        label: "Platform",
        href: `${base}/platform`
      },
      {
        type: "link",
        label: matches[1].charAt(0).toUpperCase() + matches[1].slice(1),
        href: `${base}/platform/${matches[1]}`
      },
      {
        type: "page",
        label: "Create"
      }
    ]
  },
  list: {
    pattern: /^\/([^\/]+)$/,
    crumb: (base, matches, lists) => ({
      type: "model",
      label: (lists[matches[1]]?.label || matches[1]).charAt(0).toUpperCase() + (lists[matches[1]]?.label || matches[1]).slice(1),
      href: `${base}/${matches[1]}`,
      showModelSwitcher: !matches[1].startsWith("platform/")
    })
  },
  create: {
    pattern: /^\/([^\/]+)\/create$/,
    crumb: (base, matches, lists) => [
      {
        type: "model",
        label: (lists[matches[1]]?.label || matches[1]).charAt(0).toUpperCase() + (lists[matches[1]]?.label || matches[1]).slice(1),
        href: `${base}/${matches[1]}`,
        showModelSwitcher: !matches[1].startsWith("platform/")
      },
      {
        type: "page",
        label: "Create"
      }
    ]
  },
  item: {
    pattern: /^\/([^\/]+)\/([^\/]+)$/,
    crumb: (base, matches, lists) => [
      {
        type: "model",
        label: (lists[matches[1]]?.label || matches[1]).charAt(0).toUpperCase() + (lists[matches[1]]?.label || matches[1]).slice(1),
        href: `${base}/${matches[1]}`,
        showModelSwitcher: !matches[1].startsWith("platform/")
      },
      {
        type: "page",
        label: matches[2]
      }
    ]
  }
};

export function DashboardLayout({ children }) {
  const {
    adminMeta: { lists },
    visibleLists,
  } = useKeystone();
  const pathname = usePathname();
  const router = useRouter();

  if (visibleLists.state === "loading") return null;
  if (visibleLists.state === "error") {
    return (
      <span className="text-red-600 dark:text-red-500 text-sm">
        {visibleLists.error instanceof Error
          ? visibleLists.error.message
          : visibleLists.error[0].message}
      </span>
    );
  }

  const renderableLists = Object.keys(lists)
    .map((key) => {
      if (!visibleLists.lists.has(key)) return null;
      return lists[key];
    })
    .filter((x) => Boolean(x));

  const sidebarLinks = renderableLists.map((list) => ({
    title: list.label,
    href: `/${list.path}${list.isSingleton ? "/1" : ""}`,
  }));

  // Clean up base path
  const cleanBasePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const pathWithoutBase = pathname.replace(cleanBasePath, "");

  // Get breadcrumbs based on path
  let breadcrumbs = [];
  
  // Only add dashboard crumb if we're not on the root path
  if (pathWithoutBase !== "/") {
    breadcrumbs.push(routePatterns.root.crumb(cleanBasePath));
  }

  // Find matching pattern and add its crumbs
  for (const [_, config] of Object.entries(routePatterns)) {
    const matches = pathWithoutBase.match(config.pattern);
    if (matches) {
      const crumbs = config.crumb(cleanBasePath, matches, renderableLists);
      breadcrumbs = breadcrumbs.concat(crumbs);
      break;
    }
  }

  const handleModelChange = (path) => {
    if (!path) return;
    const newUrl = `${cleanBasePath}/${path}`;
    router.push(newUrl);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <AppSidebar sidebarLinks={sidebarLinks} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {item.type === "link" && (
                          <BreadcrumbLink asChild>
                            <Link href={item.href}>{item.label}</Link>
                          </BreadcrumbLink>
                        )}
                        {item.type === "model" && (
                          <div className="flex items-center gap-1">
                            <BreadcrumbLink asChild>
                              <Link href={item.href}>{item.label}</Link>
                            </BreadcrumbLink>
                            {item.showModelSwitcher && (
                              <DropdownMenu>
                                <DropdownMenuTrigger className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent">
                                  <ArrowLeftRight className="h-3 w-3" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="start"
                                  className="min-w-[200px] max-h-[calc(100vh-24rem)] overflow-y-auto"
                                >
                                  {renderableLists.map((listOrItem) => (
                                    <DropdownMenuItem
                                      key={listOrItem.path}
                                      onClick={() => handleModelChange(listOrItem.path)}
                                    >
                                      {listOrItem.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )}
                        {item.type === "page" && (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="max-w-4xl flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
