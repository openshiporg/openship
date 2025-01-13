import { useState, useEffect } from "react";
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "../../primitives/default/ui/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "../../primitives/default/ui/sidebar";

import { Logo } from "../Logo";

import {
  Cog6ToothIcon,
  HomeIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  Square2StackIcon,
  TicketIcon,
  ArrowPathIcon,
  CircleStackIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/20/solid";
import { SidebarLayout } from "../../primitives/default/ui/sidebar-layout";
import { Badge } from "../../primitives/default/ui/badge";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { AccountDropdown } from "./AccountDropdown";
import { AccountDropdownMobile } from "./AccountDropdownMobile";
import { AdminLink } from "../AdminLink";

// Try to import customNavItems, fallback to empty array if not found
let customNavItems = [];
try {
  const navItems = require("@keystone/index").customNavItems;
  if (navItems) customNavItems = navItems;
} catch (e) {
  // Project doesn't have customNavItems defined
}

export function NavigationSidebar({
  authenticatedItem,
  sidebarLinks,
  children,
}) {
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(false);

  return (
    <SidebarLayout
      logo={<Logo className="ml-3" size="lg" />}
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <AccountDropdownMobile />
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <SidebarItem className="-my-2">
              <Logo />
            </SidebarItem>
          </SidebarHeader>
          <SidebarBody className="flex flex-col">
            <SidebarSection className="relative flex-1 mb-1 gap-0 min-h-[200px] max-h-[30vh]">
              <div className="overflow-y-auto no-scrollbar h-full">
                <SidebarItem key="dashboard" href="/" as={AdminLink}>
                  <HomeIcon className="w-6 h-6" />
                  <SidebarLabel>Home</SidebarLabel>
                </SidebarItem>
                {customNavItems?.map(({ title, href, icon: Icon, color }) => (
                  <SidebarItem key={href} href={href} as={AdminLink}>
                    <Icon className={`w-6 h-6 ${color}`} />
                    <SidebarLabel>{title}</SidebarLabel>
                  </SidebarItem>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 -mx-4 h-6 bg-gradient-to-t from-[rgba(0,0,0,0.1)] to-transparent pointer-events-none"></div>
            </SidebarSection>

            <SidebarHeading
              className="mt-2 flex items-center justify-between cursor-pointer pt-2"
              onClick={() => setIsDashboardCollapsed(!isDashboardCollapsed)}
            >
              Dashboard
              <Badge className="text-[10px] leading-none tracking-wide">
                {isDashboardCollapsed ? "SHOW" : "HIDE"}
              </Badge>
            </SidebarHeading>
            {!isDashboardCollapsed && (
              <SidebarSection className="relative flex-1 mb-1 gap-0 min-h-[200px] max-h-[30vh]">
                <div className="overflow-y-auto no-scrollbar h-full">
                  {sidebarLinks.map(({ title, href }) => (
                    <SidebarItem
                      key={href}
                      href={href}
                      as={AdminLink}
                    >
                      {title}
                    </SidebarItem>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 -mx-4 h-6 bg-gradient-to-t from-[rgba(0,0,0,0.1)] to-transparent pointer-events-none"></div>
              </SidebarSection>
            )}
            <SidebarSection className="mt-auto">
              <SidebarItem href="/api/graphql">
                {/* <QuestionMarkCircleIcon className="w-6 h-6" /> */}
                <div className="text-fuchsia-500 bg-fuchsia-50/50 dark:bg-fuchsia-900/20 shadow-sm border-[1.5px] border-fuchsia-200 dark:border-fuchsia-800 rounded-lg p-1">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.125 6.45c0-.224.12-.431.315-.542l6.25-3.572a.625.625 0 0 1 .62 0l6.25 3.572a.625.625 0 0 1 .315.542v7.099c0 .224-.12.431-.315.542l-6.25 3.572a.625.625 0 0 1-.62 0L3.44 14.09a.625.625 0 0 1-.315-.542V6.45ZM1.25 13.55a2.5 2.5 0 0 0 1.26 2.17l6.25 3.572a2.5 2.5 0 0 0 2.48 0l6.25-3.572a2.5 2.5 0 0 0 1.26-2.17V6.45a2.5 2.5 0 0 0-1.26-2.17L11.24.708a2.5 2.5 0 0 0-2.48 0L2.51 4.28a2.5 2.5 0 0 0-1.26 2.17v7.099Z"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="m10 .338-8.522 14.35h17.044L10 .337ZM4.772 12.812 10 4.01l5.228 8.802H4.772Z"
                    />
                  </svg>
                </div>
                <SidebarLabel>GraphQL Playground</SidebarLabel>
                <ArrowTopRightIcon className="ml-auto mt-[2px]" />
              </SidebarItem>
              <SidebarItem href="/changelog">
                <div className="text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm border-[1.5px] border-emerald-200 dark:border-emerald-800 rounded-lg p-1">
                  <SparklesIcon className="w-3 h-3 fill-current" />
                </div>
                <SidebarLabel>Changelog</SidebarLabel>
                <ArrowTopRightIcon className="ml-auto mt-[2px]" />
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>
          <SidebarFooter className="max-lg:hidden">
            <AccountDropdown authenticatedItem={authenticatedItem} />
            {/* <div className="mx-2.5">
              <ThemeToggle />
            </div> */}
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  );
}
