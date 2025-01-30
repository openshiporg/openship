"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@keystone-6/core/admin-ui/apollo";
import { gql } from "@apollo/client";
import { Skeleton } from "@ui/skeleton";
import { Badge } from "@keystone/themes/Tailwind/orion/primitives/default/ui/badge";
import { Button } from "@keystone/themes/Tailwind/orion/primitives/default/ui/button";
import { Webhooks } from "./Webhooks";
import { Links } from "./Links";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/dynamic-tabs";
import { ScrollArea, ScrollBar } from "@ui/scroll-area";
import { SearchOrders } from "./SearchOrders";
import {
  ChevronDownIcon,
  Circle,
  EllipsisVertical,
  MoreVertical,
  Square,
  Triangle,
  Webhook,
  Box,
  PanelsTopLeft,
  Settings,
  UsersRound,
  Ticket,
  SquareStack,
} from "lucide-react";

import {
  format,
  parseISO,
  differenceInMinutes,
  differenceInHours,
} from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ui/tooltip";
import { MatchList } from "../../matches/(components)/MatchList";

export const CHANNELS_QUERY = gql`
  query (
    $where: ChannelWhereInput
    $take: Int!
    $skip: Int!
    $orderBy: [ChannelOrderByInput!]
  ) {
    items: channels(
      where: $where
      take: $take
      skip: $skip
      orderBy: $orderBy
    ) {
      id
      name
      platform {
        name
      }
      links(orderBy: [{ rank: asc }]) {
        id
        rank
        channel {
          id
          name
        }
        filters
      }
      channelItemsCount
      linksCount
      createdAt
      updatedAt
    }
    count: channelsCount(where: $where)
  }
`;

function formatDate(dateString) {
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

const tabsData = [
  { value: "orders", icon: Ticket, label: "Orders" },
  {
    value: "matches",
    icon: SquareStack,
    label: "Matches",
    count: "channelItemsCount",
  },
  { value: "webhooks", icon: Webhook, label: "Webhooks" },
];

export const Channels = ({ openDrawer, selectedPlatform }) => {
  const { data, loading, error, refetch } = useQuery(CHANNELS_QUERY, {
    variables: {
      where: selectedPlatform
        ? { platform: { id: { equals: selectedPlatform } } }
        : { OR: [] },
      take: 50,
      skip: 0,
    },
  });

  useEffect(() => {
    refetch();
  }, [selectedPlatform]);

  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="grid gap-3">
        {Array(3)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="py-4 overflow-hidden rounded-xl border flex flex-col gap-5 relative dark:bg-black dark:border-white/15"
            >
              <div className="px-4 flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <div className="px-4">
                <div className="flex space-x-2">
                  {["Orders", "Matches", "Links", "Webhooks"].map((tab, i) => (
                    <Skeleton key={i} className="h-8 w-20" />
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  }

  if (error) return <p>Error loading channels: {error.message}</p>;

  const channelItems = data.items;

  return (
    <div>
      {!showAll && channelItems.length > 6 && (
        <div className="z-10 bg-gradient-to-t from-white to-transparent dark:from-zinc-950 dark:to-transparent absolute bottom-0 left-0 right-0 h-36 pointer-events-none" />
      )}
      {channelItems.length ? (
        <div className="relative grid gap-3">
          {channelItems
            .slice(0, showAll ? channelItems.length : 6)
            .map((channel) => (
              <div key={channel.id} className="flex flex-col -space-y-4">
                <div className="overflow-hidden rounded-xl pt-4 border flex flex-col gap-5 relative *:relative dark:bg-black dark:border-white/15 before:absolute before:inset-0 before:border-white before:from-zinc-100 dark:before:border-white/20 before:bg-gradient-to-bl dark:before:from-zinc-500/15 dark:before:to-transparent before:shadow dark:before:shadow-zinc-950">
                  <div className="px-4 flex gap-1 justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="self-start">
                        <Badge
                          color="teal"
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
                              <div className="rounded-full text-teal-400 bg-teal-400/20 dark:text-teal-500 dark:bg-teal-400/20 p-1">
                                <div className="h-2 w-2 rounded-full bg-current" />
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
                            Last updated {formatDate(channel.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="border [&_svg]:size-3 h-6 w-6"
                        onClick={() => openDrawer(channel.id, "Channel")}
                      >
                        <MoreVertical />
                      </Button>
                    </div>
                  </div>
                  <Tabs>
                    <ScrollArea>
                      <TabsList className="justify-start w-full h-auto gap-2 rounded-none bg-transparent px-3 py-1">
                        {tabsData.map((tab) => (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="text-foreground/50 relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=active]:text-foreground/75"
                          >
                            <tab.icon
                              className="-ms-0.5 me-1.5 opacity-60"
                              size={16}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                            <span className="hidden sm:inline">
                              {tab.label}
                            </span>
                            {tab.count && (
                              <span className="opacity-50 ml-2 bg-primary text-primary-foreground rounded-md w-4 h-4 flex items-center justify-center text-xs">
                                {channel[tab.count]}
                              </span>
                            )}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    <TabsContent
                      value="webhooks"
                      className="bg-background p-4 border-t"
                    >
                      <p className="text-sm text-gray-500 sm:text-gray-500">
                        <div className="text-sm text-zinc-500 dark:text-zinc-200">
                          <div className="text-sm text-muted-foreground mb-4">
                            Create platform webhooks to keep Openship in sync
                          </div>
                        </div>
                        <Webhooks channelId={channel.id} />
                      </p>
                    </TabsContent>
                    <TabsContent
                      value="orders"
                      className="bg-background p-4 border-t"
                    >
                      <div className="h-[300px] overflow-y-auto">
                        <SearchOrders
                          channelId={channel.id}
                          searchEntry=""
                          pageSize={10}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent
                      value="matches"
                      className="bg-background p-4 border-t"
                    >
                      <div className="h-[300px] overflow-y-auto">
                        <MatchList
                          channelId={channel.id}
                          onMatchAction={() => {}}
                          showCreate={false}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="w-full">
          <div className="flex flex-col items-center p-10 border-dashed border-2 rounded-lg">
            <div className="flex opacity-40">
              <Triangle className="w-8 h-8 fill-indigo-200 stroke-indigo-400 dark:stroke-indigo-600 dark:fill-indigo-950" />
              <Circle className="w-8 h-8 fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-950" />
              <Square className="w-8 h-8 fill-orange-300 stroke-orange-500 dark:stroke-amber-600 dark:fill-amber-950" />
            </div>

            <span className="pt-4 font-semibold">
              No <span className="lowercase">Channels</span> found
            </span>
            <span className="text-muted-foreground pb-4">
              Get started by creating a new one.
            </span>
          </div>
        </div>
      )}
      {!showAll && channelItems.length > 6 && (
        <div className="col-span-full flex justify-center -mt-4">
          <button
            onClick={() => setShowAll(true)}
            className="text-zinc-950 dark:text-zinc-50 font-medium text-sm"
          >
            Show More
            <ChevronDownIcon />
          </button>
        </div>
      )}
    </div>
  );
};
