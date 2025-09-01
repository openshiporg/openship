"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Square, Store, Tv } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const statusConfig = {
  SHOP: {
    label: "Shop Products",
    icon: Store,
    color: "blue"
  },
  CHANNEL: {
    label: "Channel Products",
    icon: Tv,
    color: "green"
  },
  MATCHES: {
    label: "Matches",
    icon: Square,
    color: "purple"
  },
} as const;

interface MatchesTabsProps {
  statusCounts: {
    shop: number;
    channel: number;
    matches: number;
  };
  onSelectAll?: (checked: boolean) => void;
  selectedItems?: Set<string>;
  totalItems?: number;
}

export function MatchesTabs({ statusCounts, onSelectAll, selectedItems, totalItems }: MatchesTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [, updateScroll] = useState(0);

  const tabRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const statuses = [
    {
      value: "MATCHES",
      label: "Matches",
      count: statusCounts.matches,
    },
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
  ] as const;

  // Get current status from URL
  const statusFilter = searchParams.get("!status_matches");
  let currentStatus = "MATCHES";

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

  const activeIndex = statuses.findIndex((s) => s.value === currentStatus);
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
        className="absolute bottom-[-1px] h-[2px] bg-foreground transition-all duration-300 ease-out ml-4 md:ml-6"
        style={{
          left: `${activeTabOffsetLeft - scrollOffset}px`,
          width: `${activeTabWidth}px`,
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
            const StatusIcon = statusConfig[status.value as keyof typeof statusConfig].icon;
            return (
              <div
                key={status.value}
                ref={el => { tabRefs.current[index] = el }}
                className={`px-3 py-2 cursor-pointer transition-colors duration-300 ${
                  currentStatus === status.value
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleStatusChange(status.value)}
              >
                <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full gap-2">
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