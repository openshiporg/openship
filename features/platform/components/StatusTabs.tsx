"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Same dot configuration as StatusBadge
const statusDotConfig = {
  PENDING: "bg-blue-500 dark:bg-blue-400 outline-3 -outline-offset-1 outline-blue-100 dark:outline-blue-900/50",
  INPROCESS: "bg-yellow-500 dark:bg-yellow-400 outline-3 -outline-offset-1 outline-yellow-100 dark:outline-yellow-900/50",
  AWAITING: "bg-purple-500 dark:bg-purple-400 outline-3 -outline-offset-1 outline-purple-100 dark:outline-purple-900/50",
  BACKORDERED: "bg-orange-500 dark:bg-orange-400 outline-3 -outline-offset-1 outline-orange-100 dark:outline-orange-900/50",
  CANCELLED: "bg-red-500 dark:bg-red-400 outline-3 -outline-offset-1 outline-red-100 dark:outline-red-900/50",
  COMPLETE: "bg-green-500 dark:bg-green-400 outline-3 -outline-offset-1 outline-green-100 dark:outline-green-900/50",
} as const;

export interface StatusConfig {
  label: string;
  color: string;
}

export interface StatusTabsProps {
  statusCounts: Record<string, number> & { all: number };
  statusConfig: Record<string, StatusConfig>;
  entityName: string; // e.g., "Orders", "Products"
  onSelectAll?: (checked: boolean) => void;
  selectedItems?: Set<string>;
  totalItems?: number;
}

export function StatusTabs({ statusCounts, statusConfig, entityName, onSelectAll, selectedItems, totalItems }: StatusTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [, updateScroll] = useState(0);

  const tabRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Create statuses array from config
  const statuses = Object.entries(statusConfig).map(([value, config]) => ({
    value,
    label: config.label,
    count: statusCounts[value] || 0
  }));

  // Get current status from URL - reverse engineer from !status_matches parameter
  const statusFilter = searchParams.get("!status_matches");
  let currentStatus = "all"; // Default to "all" when no filter

  if (statusFilter) {
    try {
      const parsed = JSON.parse(decodeURIComponent(statusFilter));
      if (Array.isArray(parsed) && parsed.length > 0) {
        currentStatus = typeof parsed[0] === 'string' ? parsed[0] : parsed[0].value;
      }
    } catch (e) {
      // Invalid JSON in URL, ignore and stay with "all"
    }
  }

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset to page 1 when changing status
    params.set("page", "1");
    
    if (status === "all") {
      params.delete("!status_matches");
    } else {
      params.set("!status_matches", JSON.stringify([status]));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleScroll = () => {
    updateScroll(n => n + 1);
  };

  const activeIndex = currentStatus === "all" ? 0 : statuses.findIndex((s) => s.value === currentStatus) + 1;
  const activeTabOffsetLeft = tabRefs.current[activeIndex]?.offsetLeft || 0;
  const activeTabWidth = tabRefs.current[activeIndex]?.offsetWidth || 0;
  const scrollOffset = scrollContainerRef.current ? scrollContainerRef.current.scrollLeft : 0;

  return (
    <div className="relative">
      <div
        className="absolute h-[28px] mt-1 transition-all duration-300 ease-out bg-muted/60 rounded-[6px] flex items-center ml-4 md:ml-6"
        style={{
          left: `${hoveredIndex !== null ? (tabRefs.current[hoveredIndex]?.offsetLeft || 0) - scrollOffset : 0}px`,
          width: `${hoveredIndex !== null ? tabRefs.current[hoveredIndex]?.offsetWidth || 0 : 0}px`,
          opacity: hoveredIndex !== null ? 1 : 0,
        }}
      />

      <div
        className="absolute bottom-[-1px] h-[2px] bg-blue-500 transition-all duration-300 ease-out ml-4 md:ml-6"
        style={{
          left: `${activeTabOffsetLeft - scrollOffset}px`,
          width: `${activeTabWidth}px`,
        }}
      />

      <div ref={scrollContainerRef} onScroll={handleScroll} className="w-full overflow-x-auto no-scrollbar px-4 md:px-6">
        <div className="relative flex space-x-[6px] items-center pb-1">
          {onSelectAll && selectedItems && totalItems !== undefined && (
            <Checkbox
              checked={selectedItems.size === totalItems && totalItems > 0}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
              className="mr-2"
            />
          )}
          <div
            ref={el => { tabRefs.current[0] = el }}
            className={`px-3 py-2 cursor-pointer transition-colors duration-300 ${
              currentStatus === "all"
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
            onMouseEnter={() => setHoveredIndex(0)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => handleStatusChange("all")}
          >
            <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full gap-2">
              All {entityName}
              <span className="rounded-sm bg-background border shadow-xs px-1.5 py-0 text-[10px] leading-[14px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 inline-flex items-center h-[18px]">
                {statusCounts.all}
              </span>
            </div>
          </div>
          {statuses.map((status, index) => {
            const config = statusConfig[status.value];
            
            return (
              <div
                key={status.value}
                ref={el => { tabRefs.current[index + 1] = el }}
                className={`px-3 py-2 cursor-pointer transition-colors duration-300 ${
                  currentStatus === status.value
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
                onMouseEnter={() => setHoveredIndex(index + 1)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleStatusChange(status.value)}
              >
                <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full gap-2">
                  <span className={cn(
                    "inline-block size-2 shrink-0 rounded-full outline",
                    statusDotConfig[status.value as keyof typeof statusDotConfig]
                  )} />
                  {status.label}
                  <span className="rounded-sm bg-background border shadow-xs px-1.5 py-0 text-[10px] leading-[14px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 inline-flex items-center h-[18px]">
                    {status.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}