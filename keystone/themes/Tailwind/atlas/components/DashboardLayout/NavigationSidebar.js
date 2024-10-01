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
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  DropdownLabel,
} from "../../primitives/default/ui/dropdown-menu";
import { Avatar } from "../../primitives/default/ui/avatar";
import { Logo } from "../Logo";
import { Link } from "next-view-transitions";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
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
import { ThemeToggle } from "./ThemeToggle";
import { AccountDropdownMobile } from "./AccountDropdownMobile";

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
            <SidebarSection>
              <SidebarItem key="dashboard" href="/dashboard">
                <HomeIcon className="w-6 h-6" />
                <SidebarLabel>Home</SidebarLabel>
              </SidebarItem>
              <SidebarItem key="orders" href="/dashboard/oms/orders">
                <TicketIcon className="w-6 h-6" />
                <SidebarLabel>Orders</SidebarLabel>
              </SidebarItem>
              <SidebarItem key="shops" href="/dashboard/oms/shops">
                <Square3Stack3DIcon className="w-6 h-6" />
                <SidebarLabel>Shops</SidebarLabel>
              </SidebarItem>
              <SidebarItem key="channels" href="/dashboard/oms/channels">
                <CircleStackIcon className="w-6 h-6" />
                <SidebarLabel>Channels</SidebarLabel>
              </SidebarItem>
              <SidebarItem key="matches" href="/dashboard/oms/matches">
                <Square2StackIcon className="w-6 h-6" />
                <SidebarLabel>Matches</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
            <SidebarHeading
              className="mb-4 mt-2 flex items-center justify-between cursor-pointer pt-2"
              onClick={() => setIsDashboardCollapsed(!isDashboardCollapsed)}
            >
              Dashboard
              <Badge className="text-[10px] leading-none tracking-wide">
                {isDashboardCollapsed ? "SHOW" : "HIDE"}
              </Badge>
            </SidebarHeading>
            {!isDashboardCollapsed && (
              <SidebarSection className="flex-1 overflow-y-auto no-scrollbar min-h-0 mb-1 gap-0">
                {sidebarLinks.map(({ title, href }) => (
                  <SidebarItem className="ml-4" key={href} href={`/dashboard${href}`}>
                    {title}
                  </SidebarItem>
                ))}
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
