"use client";
import React, { useState } from "react";
import { useQuery, gql } from "@keystone-6/core/admin-ui/apollo";
import {
  ChevronDownIcon,
  Circle,
  Ellipsis,
  EllipsisVertical,
  Square,
  Triangle,
} from "lucide-react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@ui/description-list";
import { format } from "date-fns";
import { Skeleton } from "@ui/skeleton";
import {
  Badge,
  BadgeButton,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
import { Button } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/button";
import { Webhooks } from "./Webhooks";

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
      createdAt
      updatedAt
    }
    count: channelsCount(where: $where)
  }
`;

export const Channels = ({ openDrawer }) => {
  const { data, loading, error, refetch } = useQuery(CHANNELS_QUERY, {
    variables: {
      where: { OR: [] },
      take: 50,
      skip: 0,
    },
  });
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-3 overflow-hidden">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} className="border h-32 w-full rounded-lg" />
          ))}
      </div>
    );
  }

  if (error) return <p>Error loading channels: {error.message}</p>;

  const channelItems = data.items;

  return (
    <div>
      {!showAll && channelItems.length > 6 && (
        <div className="z-10 bg-gradient-to-t from-white to-transparent dark:from-gray-950 dark:to-transparent absolute bottom-0 left-0 right-0 h-36 pointer-events-none" />
      )}

      {channelItems.length ? (
        <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-3 overflow-hidden">
          {channelItems
            .slice(0, showAll ? channelItems.length : 6)
            .map((channel) => {
              return (
                <div>
                  <div
                    key={channel.id}
                    className="dark:bg-zinc-950 border flex-1 flex flex-col rounded-lg shadow-sm"
                  >
                    <div className="border-b py-3 px-4 bg-muted/40 dark:bg-muted/30 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {channel.name}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="px-1.5"
                          onClick={() => openDrawer(channel.id, "Channel")}
                        >
                          <EllipsisVertical className="size-2.5" />
                        </Button>
                      </div>
                    </div>

                    <DescriptionList>
                      <DescriptionTerm className="text-xs">
                        Platform
                      </DescriptionTerm>
                      <DescriptionDetails className="text-xs">
                        {channel.platform ? (
                          channel.platform.name
                        ) : (
                          <Badge
                            color="red"
                            className="text-[.6rem]/3 py-[2px] font-medium tracking-wide"
                          >
                            REQUIRED
                          </Badge>
                        )}
                      </DescriptionDetails>
                      <DescriptionTerm className="text-xs">
                        Created at
                      </DescriptionTerm>
                      <DescriptionDetails
                        className="text-xs"
                        title={channel.createdAt}
                      >
                        {format(new Date(channel.createdAt), "PPP")}
                      </DescriptionDetails>
                      <DescriptionTerm className="text-xs">
                        Updated at
                      </DescriptionTerm>
                      <DescriptionDetails
                        className="text-xs"
                        title={channel.updatedAt}
                      >
                        {format(new Date(channel.updatedAt), "PPP")}
                      </DescriptionDetails>
                    </DescriptionList>
                    {channel.platform && (
                      <div className="border-t border-zinc-950/5 dark:border-white/5 px-4 mb-4 flex flex-col">
                        <text className="text-xs col-start-1 border-t border-zinc-950/5 pt-3 text-zinc-500 first:border-none sm:border-t sm:border-zinc-950/5 sm:py-3 dark:border-white/5 dark:text-zinc-400 sm:dark:border-white/5">
                          Webhooks
                        </text>
                        <Webhooks channelId={channel.id} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
            {/* {showCreate && <CreateButtonLink list={list} />} */}
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
