"use client";

import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Header() {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between gap-2 border-b p-2 px-4 sm:p-4",
      )}
    >
      <div className="flex items-center gap-1 sm:gap-4">
        <SidebarTrigger className="-ml-1" />
        <div>Dual Sidebar</div>
      </div>

      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" side="right" />
      </div>
    </header>
  );
}
