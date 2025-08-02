"use client";

import { ComponentProps } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from "@/components/ui/sidebar";
import { AiChatSidebar } from "./ai-chat-sidebar";

export function RightSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarRail />
      <SidebarContent>
        <AiChatSidebar />
      </SidebarContent>
    </Sidebar>
  );
}
