"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Square, Layers3, Database } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const statusConfig = {
  SHOP: {
    label: "Shop Products",
    // No icon for platforms
    color: "blue"
  },
  CHANNEL: {
    label: "Channel Products",
    // No icon for platforms
    color: "green"
  },
  MATCHES: {
    label: "Matches",
    icon: Square,
    iconColor: "text-purple-500",
    color: "purple"
  },
} as const;

interface StatusTabsProps {
  statusCounts: {
    shop: number;
    channel: number;
    matches: number;
  };
  onSelectAll?: (checked: boolean) => void;
  selectedItems?: Set<string>;
  totalItems?: number;
}

export function StatusTabs({ statusCounts, onSelectAll, selectedItems, totalItems }: StatusTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [, updateScroll] = useState(0);

  const tabRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const statuses = [
    {
      value: "SHOP",
      label: "Shop Products",
      count: statusCounts.shop,
    },
    {
      value: "CHANNEL",
      label: "Channel Products",
      count: statusCounts.channel,
    },
    { value: "MATCHES", label: "Matches", count: statusCounts.matches },
  ] as const;

  // Get current status from URL
  const statusFilter = searchParams.get("!status_matches");
  let currentStatus = "SHOP";

  if (statusFilter) {
    try {
      const parsed = JSON.parse(decodeURIComponent(statusFilter));
      if (Array.isArray(parsed) && parsed.length > 0) {
        currentStatus = parsed[0].value;
      }
    } catch (e) {
      // Invalid JSON in URL, ignore
    }
  }

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const filterValue = [
      {
        label: statusConfig[status as keyof typeof statusConfig].label,
        value: status,
      },
    ];
    params.set("!status_matches", JSON.stringify(filterValue));
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
      {/* Hover background */}
      <div
        className="absolute h-[28px] mt-1 transition-all duration-300 ease-out bg-muted/60 rounded-[6px] flex items-center ml-4 md:ml-6"
        style={{
          left: `${hoveredIndex !== null ? (tabRefs.current[hoveredIndex]?.offsetLeft || 0) - scrollOffset : 0}px`,
          width: `${hoveredIndex !== null ? tabRefs.current[hoveredIndex]?.offsetWidth || 0 : 0}px`,
          opacity: hoveredIndex !== null ? 1 : 0,
        }}
      />

      {/* Active indicator line */}
      <div
        className="absolute h-[2px] bg-blue-500 transition-all duration-300 ease-out ml-4 md:ml-6"
        style={{
          left: `${activeTabOffsetLeft - scrollOffset}px`,
          width: `${activeTabWidth}px`,
          bottom: '-1.5px',
        }}
      />

      <div ref={scrollContainerRef} onScroll={handleScroll} className="w-full overflow-x-auto no-scrollbar px-4 md:px-6">
        <div className="relative flex space-x-[6px] items-center pb-1">
          {onSelectAll && selectedItems && totalItems !== undefined && currentStatus === "MATCHES" && (
            <Checkbox
              checked={selectedItems.size === totalItems && totalItems > 0}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
              className="mr-2"
            />
          )}
          {statuses.map((status, index) => {
            const config = statusConfig[status.value as keyof typeof statusConfig];
            const StatusIcon = config.icon;
            const iconColor = config.iconColor;
            const isActive = currentStatus === status.value;
            
            return (
              <div
                key={status.value}
                ref={el => { tabRefs.current[index + 1] = el }}
                className={`px-3 py-2 cursor-pointer transition-colors duration-300 ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
                onMouseEnter={() => setHoveredIndex(index + 1)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleStatusChange(status.value)}
              >
                <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full gap-2">
                  {/* Only show icon for MATCHES */}
                  {StatusIcon && <StatusIcon className={`h-4 w-4 ${iconColor}`} />}
                  {status.label}
                  {/* Use neutral badge for all tabs */}
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