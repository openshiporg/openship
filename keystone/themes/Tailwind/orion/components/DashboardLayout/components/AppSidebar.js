"use client";

import * as React from "react";
import {
  ChevronRight,
  LayoutDashboard,
  MoreHorizontal,
  ArrowUpRight,
  Sparkles,
  Home
} from "lucide-react";

import { NavUser } from "./NavUser";
import { TeamSwitcher } from "./TeamSwitcher";
import { AdminLink } from "../../AdminLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "../../../primitives/default/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../primitives/default/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../primitives/default/ui/dropdown-menu";
import { HomeIcon } from "@heroicons/react/24/outline";
import { Logo } from "../../Logo";

// Try to import customNavItems, fallback to empty array if not found
let customNavItems = [];
try {
  const navItems = require("@keystone/index").customNavItems;
  if (navItems) customNavItems = navItems;
} catch (e) {
  // Project doesn't have customNavItems defined
}

// Default navigation items
const defaultNavItems = [
  {
    title: "Home",
    url: "/",
    icon: HomeIcon,
  },
  ...customNavItems,
];

export function AppSidebar({ sidebarLinks = [], ...props }) {
  const { isMobile } = useSidebar();
  const dashboardItem = {
    title: "Dashboard",
    items: sidebarLinks,
    isActive: true,
    icon: LayoutDashboard,
  };

  // Split navigation items into main and more
  const mainNavItems = defaultNavItems.slice(0, 6);
  const moreNavItems = defaultNavItems.slice(6);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton 
          asChild
        >
          <Logo />
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent className="no-scrollbar">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {mainNavItems.map((route) => (
              <SidebarMenuItem key={route.url}>
                <SidebarMenuButton asChild>
                  <AdminLink href={route.href || route.url}>
                    {route.icon && <route.icon className="h-4 w-4 stroke-2" />}
                    <span>{route.title}</span>
                  </AdminLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {moreNavItems.length > 0 && (
              <DropdownMenu>
                <SidebarMenuItem>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                      <span>More</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                    className="min-w-56"
                  >
                    <div className="max-h-[calc(100vh-16rem)] overflow-y-auto py-1">
                      {moreNavItems.map((item) => (
                        <DropdownMenuItem asChild key={item.href || item.url}>
                          <AdminLink
                            href={item.href || item.url}
                            className="flex items-center gap-2"
                          >
                            {item.icon && <item.icon className="h-4 w-4" />}
                            <span>{item.title}</span>
                          </AdminLink>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </SidebarMenuItem>
              </DropdownMenu>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Dashboard Links - Collapsible/Dropdown */}
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <div className="max-h-full overflow-y-auto group-has-[[data-collapsible=icon]]/sidebar-wrapper:hidden">
            <Collapsible
              key={dashboardItem.title}
              asChild
              defaultOpen={dashboardItem.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <dashboardItem.icon className="h-4 w-4" />
                    <span>{dashboardItem.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {dashboardItem.items.map((link) => (
                      <SidebarMenuSubItem key={link.href}>
                        <SidebarMenuSubButton asChild>
                          <AdminLink href={link.href}>
                            <span>{link.title}</span>
                          </AdminLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </div>

          <div className="hidden group-has-[[data-collapsible=icon]]/sidebar-wrapper:block">
            <DropdownMenu>
              <SidebarMenuItem>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <dashboardItem.icon className="h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                  className="min-w-56"
                >
                  <div className="max-h-[calc(100vh-16rem)] overflow-y-auto py-1">
                    {dashboardItem.items.map((link) => (
                      <DropdownMenuItem asChild key={link.href}>
                        <AdminLink href={link.href}>
                          <span>{link.title}</span>
                        </AdminLink>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </SidebarMenuItem>
            </DropdownMenu>
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/api/graphql" target="_blank" rel="noopener noreferrer">
                <div className="text-fuchsia-500">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.125 6.45c0-.224.12-.431.315-.542l6.25-3.572a.625.625 0 0 1 .62 0l6.25 3.572a.625.625 0 0 1 .315.542v7.099c0 .224-.12.431-.315.542l-6.25 3.572a.625.625 0 0 1-.62 0L3.44 14.09a.625.625 0 0 1-.315-.542V6.45ZM1.25 13.55a2.5 2.5 0 0 0 1.26 2.17l6.25 3.572a2.5 2.5 0 0 0 2.48 0l6.25-3.572a2.5 2.5 0 0 0 1.26-2.17V6.45a2.5 2.5 0 0 0-1.26-2.17L11.24.708a2.5 2.5 0 0 0-2.48 0L2.51 4.28a2.5 2.5 0 0 0-1.26 2.17v7.099Z" />
                    <path fillRule="evenodd" clipRule="evenodd" d="m10 .338-8.522 14.35h17.044L10 .337ZM4.772 12.812 10 4.01l5.228 8.802H4.772Z" />
                  </svg>
                </div>
                <span>GraphQL Playground</span>
                <ArrowUpRight className="ml-auto h-4 w-4" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/changelog" target="_blank" rel="noopener noreferrer">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span>Changelog</span>
                <ArrowUpRight className="ml-auto h-4 w-4" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
