import React, { useEffect } from "react";
import { useTheme } from "next-themes";
import { gql, useMutation, useQuery } from "@keystone-6/core/admin-ui/apollo";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  DropdownLabel,
} from "../../primitives/default/ui/dropdown-menu";
import { Avatar } from "../../primitives/default/ui/avatar";
import { Skeleton } from "../../primitives/default/ui/skeleton";
import {
  ChevronUpIcon,
  UserIcon,
  ArrowRightStartOnRectangleIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/16/solid";
import { SidebarItem } from "../../primitives/default/ui/sidebar";
import { AdminLink } from "../AdminLink";

const AUTHENTICATED_ITEM_QUERY = gql`
  query AuthenticatedItem {
    authenticatedItem {
      ... on User {
        id
        email
        name
      }
    }
  }
`;

const END_SESSION = gql`
  mutation EndSession {
    endSession
  }
`;

const ToggleButton = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-1 px-2.5 inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      isActive
        ? "bg-background text-foreground shadow"
        : "text-zinc-600 dark:text-zinc-200"
    }`}
  >
    {children}
  </button>
);

export const AccountDropdown = () => {
  const { setTheme, theme } = useTheme();
  const { data, loading } = useQuery(AUTHENTICATED_ITEM_QUERY);
  const [endSession, { loading: logoutLoading, data: logoutData }] =
    useMutation(END_SESSION);

  useEffect(() => {
    if (logoutData?.endSession) {
      window.location.reload();
    }
  }, [logoutData]);

  const handleLogout = async () => {
    try {
      await endSession();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleTheme = (e) => {
    e.preventDefault();
    setTheme(themeOptions[theme].next);
  };

  const themeOptions = {
    light: { next: "dark", icon: <SunIcon />, label: "Light Mode" },
    dark: { next: "system", icon: <MoonIcon />, label: "Dark Mode" },
    system: {
      next: "light",
      icon: <ComputerDesktopIcon />,
      label: "System Mode",
    },
  };

  if (loading) {
    return (
      <div className="px-2 py-2 flex min-w-0 items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="min-w-0">
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  const authenticatedItem = data?.authenticatedItem;

  return (
    <Dropdown>
      <DropdownButton as={SidebarItem}>
        <span className="flex min-w-0 items-center gap-3">
          <Avatar
            className="size-10 bg-zinc-900 text-white dark:bg-white dark:text-black"
            square
            initials={Array.from(authenticatedItem.name)[0]}
            alt=""
          />
          <span className="min-w-0">
            <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
              {authenticatedItem.name}
            </span>
            <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
              {authenticatedItem.email}
            </span>
          </span>
        </span>
        <ChevronUpIcon />
      </DropdownButton>

      <DropdownMenu className="min-w-56" anchor="top">
        <DropdownItem
          as={AdminLink}
          href={`/users/${authenticatedItem.id}`}
        >
          <UserIcon />
          <DropdownLabel>My profile</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem onClick={toggleTheme}>
          {themeOptions[theme].icon}
          <DropdownLabel>{themeOptions[theme].label}</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem onClick={handleLogout}>
          <ArrowRightStartOnRectangleIcon />
          <DropdownLabel>Sign out</DropdownLabel>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
