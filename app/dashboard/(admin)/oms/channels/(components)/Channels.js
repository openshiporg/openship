"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@keystone-6/core/admin-ui/apollo";
import { gql } from "@apollo/client";
import { Skeleton } from "@ui/skeleton";
import { Badge } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
import { Button } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/button";
import { Webhooks } from "./Webhooks";
import { Links } from "./Links";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/tabs";
import { SearchOrders } from "./SearchOrders";
import {
  ChevronDownIcon,
  Circle,
  EllipsisVertical,
  Square,
  Triangle,
  Webhook,
} from "lucide-react";
import {
  TicketIcon,
  Square2StackIcon,
  LinkIcon,
} from "@heroicons/react/16/solid";
import {
  format,
  parseISO,
  differenceInMinutes,
  differenceInHours,
} from "date-fns";

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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array(6).fill(0).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border flex flex-col gap-5 relative dark:bg-black dark:border-white/15">
            <div className="px-4 pt-4 flex items-start gap-4">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <div className="px-4">
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="px-4 pb-4">
              <Skeleton className="h-24 w-full" />
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
                  <div className="px-4 flex flex-col sm:flex-row sm:items-start gap-4">
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

                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
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
                        <span className="block size-1 rounded-full bg-muted-foreground/50" />
                        <p className="text-muted-foreground text-sm font-light">
                          Last updated {formatDate(channel.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      className="ml-auto px-1.5"
                      onClick={() => openDrawer(channel.id, "Channel")}
                    >
                      <EllipsisVertical className="size-2.5" />
                    </Button>
                  </div>
                  <Tabs>
                    <TabsList className="px-4" variant="line">
                      <TabsTrigger value="orders" className="inline-flex gap-2">
                        <TicketIcon
                          className="-ml-1 size-4"
                          aria-hidden="true"
                        />
                        Orders
                      </TabsTrigger>
                      <TabsTrigger
                        value="matches"
                        className="inline-flex gap-2"
                      >
                        <Square2StackIcon
                          className="-ml-1 size-4"
                          aria-hidden="true"
                        />
                        Matches
                        <Badge
                          color="zinc"
                          className="opacity-75 text-[.8rem]/3 px-1.5 border"
                        >
                          {channel.channelItemsCount}
                        </Badge>
                      </TabsTrigger>
                      {/* <TabsTrigger value="links" className="inline-flex gap-2">
                        <LinkIcon className="-ml-1 size-4" aria-hidden="true" />
                        Links
                        <Badge
                          color="zinc"
                          className="opacity-75 text-[.8rem]/3 px-1.5 border"
                        >
                          {channel.linksCount}
                        </Badge>
                      </TabsTrigger> */}
                      <TabsTrigger
                        value="webhooks"
                        className="inline-flex gap-2 -mb-[3px]"
                      >
                        <Webhook className="-ml-1 size-4" aria-hidden="true" />
                        Webhooks
                      </TabsTrigger>
                    </TabsList>
                    <div className="-mb-1 px-4">
                      <TabsContent value="webhooks">
                        <p className="text-sm text-gray-500 sm:text-gray-500">
                          <div className="mb-3 text-sm text-zinc-500 dark:text-zinc-200">
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                              Create platform webhooks to keep Openship in sync
                            </div>
                          </div>
                          <Webhooks channelId={channel.id} />
                        </p>
                      </TabsContent>
                      {/* <TabsContent value="links">
                        <p className="text-sm text-gray-500 sm:text-gray-500">
                          <div>
                            <Links
                              channelId={channel.id}
                              links={channel.links}
                              refetch={refetch}
                              editItem={openDrawer}
                            />
                          </div>
                        </p>
                      </TabsContent> */}
                      <TabsContent value="orders">
                        <SearchOrders
                          channelId={channel.id}
                          searchEntry=""
                          pageSize={10}
                        />
                      </TabsContent>
                    </div>
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
