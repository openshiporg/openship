import { Logo } from "@keystone/components/Logo";
import { useState } from "react";
import { ModeToggle } from "./ModeToggle";
import { MainNav } from "./MainNav";
import { DashboardNav } from "./DashboardNav";
import { useKeystone } from "@keystone/keystoneProvider";
import { ArrowRightIcon, Home, LayoutDashboard, StoreIcon } from "lucide-react";
import { Button } from "@keystone/primitives/default/ui/button";
import { Collapse } from "./Collapse";
import { Badge } from "@keystone/primitives/default/ui/badge";
import Link from "next/link";
import { ScrollArea } from "@keystone/primitives/default/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@keystone/primitives/default/ui/collapsible";
import { cn } from "@keystone/utils/cn";

export const HEADER_HEIGHT = 80;

export const AdminLayout = ({ children }) => {
  const [open, setOpen] = useState(true);

  const {
    adminMeta: { lists },
    adminConfig,
    authenticatedItem,
    visibleLists,
  } = useKeystone();

  if (visibleLists.state === "loading") return null;
  // This visible lists error is critical and likely to result in a server restart
  // if it happens, we'll show the error and not render the navigation component/s
  if (visibleLists.state === "error") {
    return (
      <span className="text-red-600 dark:text-red-500">
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

  console.log({ renderableLists });

  if (adminConfig?.components?.Navigation) {
    return (
      <adminConfig.components.Navigation
        authenticatedItem={authenticatedItem}
        lists={renderableLists}
      />
    );
  }

  const sidebarNav = renderableLists.map((list) => ({
    title: list.label,
    href: `/${list.path}${list.isSingleton ? "/1" : ""}`,
  }));

  const HEADER_HEIGHT = 120;

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav sideData={<SideData />} />
          <div className="end">
            <ModeToggle />
          </div>
        </div>
      </header>
      <div className="container flex flex-grow overflow-hidden">
        <aside className="w-[240px] min-w-[240px] hidden md:flex overflow-auto">
          <SideData />
        </aside>
        <main className="flex-grow overflow-hidden">
          <ScrollArea className="h-full overflow-auto py-4 px-2 md:px-4">
            {children}
          </ScrollArea>
        </main>
      </div>
    </div>
  );

  function SideData() {
    return (
      <div className="flex flex-col h-full">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="w-full mt-6 text-md text-muted-foreground justify-start"
          >
            <Home className="shadow-xs mr-3 w-6 h-6 p-[.3rem] rounded bg-gradient-to-r from-amber-200 to-amber-300 stroke-amber-700 shadow-xs dark:bg-gradient-to-r dark:from-amber-800/40 dark:to-amber-900 dark:stroke-amber-300" />{" "}
            Home
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full text-md text-muted-foreground justify-start"
        >
          <StoreIcon className="shadow-xs mr-3 w-6 h-6 p-[.3rem] rounded bg-gradient-to-r from-green-200 to-green-300 stroke-green-700 shadow-xs dark:bg-gradient-to-r dark:from-green-800/40 dark:to-green-900 dark:stroke-green-300" />
          Storefront
          <Badge className="ml-auto h-4 px-2 text-[10px]" variant="secondary">
            SOON
          </Badge>
        </Button>
        <Link href="/api/graphql">
          <Button
            variant="ghost"
            className="w-full text-md text-muted-foreground justify-start"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="shadow-xs mr-3 w-6 h-6 p-[.3rem] rounded bg-gradient-to-r from-fuchsia-200 to-fuchsia-300 stroke-fuchsia-700 shadow-xs dark:bg-gradient-to-r dark:from-fuchsia-800/40 dark:to-fuchsia-900 dark:stroke-fuchsia-300"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M5.308 7.265l5.385 -3.029"></path>
              <path d="M13.308 4.235l5.384 3.03"></path>
              <path d="M20 9.5v5"></path>
              <path d="M18.693 16.736l-5.385 3.029"></path>
              <path d="M10.692 19.765l-5.384 -3.03"></path>
              <path d="M4 14.5v-5"></path>
              <path d="M12.772 4.786l6.121 10.202"></path>
              <path d="M18.5 16h-13"></path>
              <path d="M5.107 14.988l6.122 -10.201"></path>
              <path d="M12 3.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0"></path>
              <path d="M12 20.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0"></path>
              <path d="M4 8m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0"></path>
              <path d="M4 16m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0"></path>
              <path d="M20 16m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0"></path>
              <path d="M20 8m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0"></path>
            </svg>
            GraphQL API
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full text-md text-muted-foreground justify-start"
          onClick={() => setOpen(!open)}
        >
          <LayoutDashboard className="shadow-xs mr-3 w-6 h-6 p-[.3rem] rounded bg-gradient-to-r from-blue-200 to-blue-300 stroke-blue-700 shadow-xs dark:bg-gradient-to-r dark:from-blue-800/40 dark:to-blue-900 dark:stroke-blue-300" />
          Admin UI
          {open ? (
            <ArrowRightIcon className="h-4 w-4 ml-auto rounded-sm hover:bg-gray-800/5 dark:hover:bg-gray-100/5 origin-center transition-transform rotate-90" />
          ) : (
            <ArrowRightIcon className="h-4 w-4 ml-auto rounded-sm hover:bg-gray-800/5 dark:hover:bg-gray-100/5 origin-center transition-transform rotate-[-180]" />
          )}
        </Button>
        <div className="transform-gpu overflow-hidden transition-all ease-in-out motion-reduce:transition-none">
          <DashboardNav open={open} items={sidebarNav} />
        </div>
      </div>
    );
  }
};