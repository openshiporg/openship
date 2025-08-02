"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EllipsisVertical, Plus } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  count?: number;
}

interface PlatformTabsProps {
  platforms: Platform[];
  totalCount: number;
  onAddPlatform?: () => void;
  onEditPlatform?: (platformId: string) => void;
  renderAddButton?: () => React.ReactNode;
  renderEditButton?: (platform: Platform) => React.ReactNode;
}

export function PlatformTabs({ 
  platforms, 
  totalCount,
  onAddPlatform,
  onEditPlatform,
  renderAddButton,
  renderEditButton
}: PlatformTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [, updateScroll] = useState(0);

  const tabRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Get current platform from URL
  const currentPlatform = searchParams.get("platform") || "all";

  const handlePlatformChange = (platformId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (platformId === "all") {
      params.delete("platform");
    } else {
      params.set("platform", platformId);
    }
    params.set("page", "1"); // Reset to first page
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleScroll = () => {
    updateScroll(n => n + 1);
  };

  const handleAddPlatform = () => {
    if (onAddPlatform) {
      onAddPlatform();
    }
  };

  const handleEditPlatform = (e: React.MouseEvent, platformId: string) => {
    e.stopPropagation();
    if (onEditPlatform) {
      onEditPlatform(platformId);
    }
  };

  const activeIndex = currentPlatform === "all" ? 0 : platforms.findIndex((p) => p.id === currentPlatform) + 1;
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
          {/* All Platforms Tab */}
          <div
            ref={el => { tabRefs.current[0] = el }}
            className={`px-3 py-2 cursor-pointer transition-colors duration-300 ${
              currentPlatform === "all"
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
            onMouseEnter={() => setHoveredIndex(0)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => handlePlatformChange("all")}
          >
            <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full gap-2">
              All Platforms
              <span className="rounded-sm bg-background border shadow-xs px-1.5 py-0 text-[10px] leading-[14px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 inline-flex items-center h-[18px]">
                {totalCount}
              </span>
            </div>
          </div>

          {/* Platform Tabs */}
          {platforms.map((platform, index) => (
            <div
              key={platform.id}
              ref={el => { tabRefs.current[index + 1] = el }}
              className={`px-3 py-2 cursor-pointer transition-colors duration-300 ${
                currentPlatform === platform.id
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
              onMouseEnter={() => setHoveredIndex(index + 1)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handlePlatformChange(platform.id)}
            >
              <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full gap-2">
                <span className="uppercase tracking-wide">{platform.name}</span>
                <Badge 
                  color="blue" 
                  className="px-1.5 py-0 text-[10px] leading-[14px] rounded-sm shadow-xs inline-flex items-center h-[18px]"
                >
                  {platform.count || 0}
                </Badge>
                {(renderEditButton || onEditPlatform) && (
                  renderEditButton ? renderEditButton(platform) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-muted/50"
                      onClick={(e) => handleEditPlatform(e, platform.id)}
                    >
                      <EllipsisVertical className="h-3 w-3" />
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}

          {/* Add Platform Tab */}
          <div
            className="px-3 py-2 cursor-pointer transition-colors duration-300 text-muted-foreground hover:text-foreground"
            onClick={handleAddPlatform}
          >
            <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full gap-2">
              {renderAddButton ? renderAddButton() : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Platform
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
