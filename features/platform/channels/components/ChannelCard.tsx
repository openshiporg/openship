"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Settings, Tv, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EditItemDrawer } from "@/features/platform/components/EditItemDrawer";
import { ChannelManagementDrawer } from "./ChannelManagementDrawer";
import { ChannelSettingsDrawer } from "./ChannelSettingsDrawer";
import type { Channel } from "../lib/types";
import {
  differenceInHours,
  format,
  parseISO,
  differenceInMinutes,
} from "date-fns";

interface ChannelCardProps {
  channel: Channel;
  loadingActions?: Record<string, Record<string, boolean>>;
  removeEditItemButton?: boolean;
  renderButtons?: () => React.ReactNode;
}

export const ChannelCard = ({
  channel,
  loadingActions = {},
  removeEditItemButton,
  renderButtons,
}: ChannelCardProps) => {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isManagementDrawerOpen, setIsManagementDrawerOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  
  const currentAction = Object.entries(loadingActions).find(
    ([_, value]) => value[channel.id]
  )?.[0];

  const getLoadingText = (action: string) => {
    switch (action) {
      case "deleteChannel":
        return "Deleting Channel";
      default:
        return "Loading";
    }
  };

  const itemsCount = channel.channelItems?.length || 0;
  const linksCount = channel.links?.length || 0;

  function formatDate(dateString: string) {
    const date = parseISO(dateString);
    const now = new Date();
    const minutesDifference = differenceInMinutes(now, date);
    const hoursDifference = differenceInHours(now, date);

    if (minutesDifference < 60) {
      return `${minutesDifference} minutes ago`;
    } else if (hoursDifference < 24) {
      return `${hoursDifference} hours ago`;
    } else {
      return format(date, "PPP");
    }
  }

  return (
    <>
      <div className="group relative rounded-xl overflow-hidden border bg-background/50 backdrop-blur-sm transition-all duration-200">
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/40 to-transparent dark:from-background/10 dark:via-background/5 dark:to-transparent pointer-events-none" />
        <div className="relative px-4 py-4 flex gap-4 justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="self-start">
              <Badge
                color="blue"
                className="uppercase tracking-wide border-2 text-xl flex items-center justify-center w-14 h-14 font-medium rounded-[calc(theme(borderRadius.xl)-1px)]"
              >
                {channel.name.slice(0, 2)}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <h3 className="mr-2">{channel.name}</h3>
              </div>

              <div className="flex flex-wrap flex-col sm:flex-row sm:items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                {channel.platform ? (
                  <div className="text-muted-foreground/75 flex items-center gap-2">
                    <div className="rounded-full text-blue-400 bg-blue-400/20 dark:text-blue-500 dark:bg-blue-400/20 p-1">
                      <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                    </div>
                    {channel.platform.name}
                  </div>
                ) : (
                  <div className="text-red-500 flex items-center gap-2 font-medium">
                    <div className="rounded-full text-red-400 bg-red-400/20 dark:text-red-400 dark:bg-red-400/10 p-1">
                      <div className="h-2 w-2 rounded-full bg-current" />
                    </div>
                    Platform not connected
                  </div>
                )}
                <span className="hidden sm:block size-1 rounded-full bg-muted-foreground/50" />
                <p className="text-muted-foreground text-sm font-light">
                  Last updated {formatDate(channel.updatedAt || channel.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="border [&_svg]:size-3 h-6 w-6"
              onClick={() => setIsSettingsDrawerOpen(true)}
            >
              <Settings />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="border [&_svg]:size-3 h-6 w-6"
              onClick={() => setIsManagementDrawerOpen(true)}
            >
              <MoreVertical />
            </Button>
          </div>
        </div>
      </div>

      <EditItemDrawer
        listKey="Channel"
        itemId={channel.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />

      <ChannelManagementDrawer
        open={isManagementDrawerOpen}
        onOpenChange={setIsManagementDrawerOpen}
        channel={channel}
      />

      <ChannelSettingsDrawer
        channel={channel}
        open={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
      />
    </>
  );
};