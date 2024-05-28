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
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar
                  className="bg-zinc-900 text-white dark:bg-white dark:text-black"
                  square
                  initials="E"
                  alt=""
                />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="bottom end">
                <DropdownItem href="/my-profile">
                  <UserIcon />
                  <DropdownLabel>My profile</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/privacy-policy">
                  <ShieldCheckIcon />
                  <DropdownLabel>Privacy policy</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/share-feedback">
                  <LightBulbIcon />
                  <DropdownLabel>Share feedback</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/logout">
                  <ArrowRightStartOnRectangleIcon />
                  <DropdownLabel>Sign out</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
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
              <SidebarItem href="/">
                <HomeIcon className="w-6 h-6" />
                <SidebarLabel>Home</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/orders">
                <TicketIcon className="w-6 h-6" />
                <SidebarLabel>Orders</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/shops">
                <Square3Stack3DIcon className="w-6 h-6" />
                <SidebarLabel>Shops</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/channels">
                <CircleStackIcon className="w-6 h-6" />
                <SidebarLabel>Channels</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/matches">
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
              <SidebarSection className="flex-1 overflow-y-auto min-h-0 mb-1 gap-0">
                {sidebarLinks.map(({ title, href }) => (
                  <SidebarItem href={`/dashboard${href}`}>{title}</SidebarItem>
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
            <div className="mx-2.5">
              <ThemeToggle />
            </div>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  );
}
