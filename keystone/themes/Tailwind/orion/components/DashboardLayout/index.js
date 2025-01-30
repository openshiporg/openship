import React from "react";
import { useKeystone } from "@keystone/keystoneProvider";
import { AppSidebar } from "./components/AppSidebar";
import { Separator } from "../../primitives/default/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../primitives/default/ui/sidebar";
import { ThemeProvider } from "next-themes";

export function DashboardLayout({ children }) {
  const {
    adminMeta: { lists },
    visibleLists,
  } = useKeystone();

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

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <AppSidebar sidebarLinks={sidebarLinks} />
        <SidebarInset className="min-w-0">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
