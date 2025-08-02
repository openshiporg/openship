/**
 * UserProfileClient - dashboard user profile dropdown
 * Based on Dashboard1's UserProfileClient with dashboard styling
 */

"use client";

import {
  ArrowUpRight,
  ChevronsUpDown,
  Database,
  LogOut,
  Palette,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { signOut } from "@/features/dashboard/actions/auth";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface UserProfileClientProps {
  user: User;
}

export function UserProfileClient({ user }: UserProfileClientProps) {
  const { isMobile } = useSidebar();

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center"
            >
              <Avatar className="h-8 w-8 rounded-lg group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
                <AvatarFallback className="bg-muted/80 border rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">
                  {user.name || "User"}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div
                className="flex items-center gap-2 px-1 py-1.5 text-left text-sm cursor-pointer hover:bg-accent rounded-md"
                onClick={() =>
                  (window.location.href = `/dashboard/users/${user.id}`)
                }
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="" alt={user.name || user.email} />
                  <AvatarFallback className="bg-muted/40 border rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.name || "User"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem 
                className="gap-3"
                onClick={() => window.open('/api/graphql', '_blank')}
              >
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">GraphQL API</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-3 justify-between"
                onSelect={(event) => {
                  event.preventDefault();
                }}
              >
                <div className="flex items-center gap-3">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Theme</span>
                </div>
                <ThemeSwitcher className="h-6" />
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <button type="submit" className="flex items-center gap-3 w-full px-2 py-1.5 text-sm hover:bg-accent rounded-sm">
                <LogOut className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Log out</span>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}