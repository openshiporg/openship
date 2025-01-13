"use client";

import React, { useState } from "react";
import { useQuery, gql } from "@keystone-6/core/admin-ui/apollo";
import { EllipsisVertical, Plus } from "lucide-react";
import { Skeleton } from "@ui/skeleton";
import { Button } from "@keystone/themes/Tailwind/orion/primitives/default/ui/button";

import { Badge } from "@ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/dropdown-menu-depracated";
import { CreatePlatform } from "./CreatePlatform";

export const CHANNEL_PLATFORMS_QUERY = gql`
  query (
    $where: ChannelPlatformWhereInput
    $take: Int!
    $skip: Int!
    $orderBy: [ChannelPlatformOrderByInput!]
  ) {
    items: channelPlatforms(
      where: $where
      take: $take
      skip: $skip
      orderBy: $orderBy
    ) {
      id
      name
      createPurchaseFunction
      searchProductsFunction
      getProductFunction
      getWebhooksFunction
      deleteWebhookFunction
      createWebhookFunction
      cancelPurchaseWebhookHandler
      createTrackingWebhookHandler
      oAuthFunction
      oAuthCallbackFunction
      appKey
      appSecret
      createdAt
      updatedAt
      __typename
    }
    count: channelPlatformsCount(where: $where)
  }
`;

const ChannelPlatformsContent = ({ data, openDrawer, showAll }) => {
  if (!data || !data.items) return null;

  const platformItems = [...data.items];

  return platformItems
    .slice(0, showAll ? platformItems.length : 6)
    .map((platform, index) => (
      <div key={index} className="flex items-center">
        <Button
          variant="secondary"
          className="p-1"
          onClick={() => openDrawer(platform.id, "ChannelPlatform")}
        >
          <EllipsisVertical className="size-2.5" />
        </Button>
        <label
          htmlFor={`filter-${platform.id}`}
          className="ml-3 text-sm text-muted-foreground"
        >
          {platform.name}
        </label>
      </div>
    ));
};

const useChannelPlatformsQuery = () => {
  return useQuery(CHANNEL_PLATFORMS_QUERY, {
    variables: {
      where: { OR: [] },
      take: 50,
      skip: 0,
    },
  });
};

export const ChannelPlatforms = ({ openDrawer }) => {
  const { data, loading, error } = useChannelPlatformsQuery();
  const [showAll, setShowAll] = useState(true);

  if (loading) {
    return (
      <div className="grid gap-2 overflow-hidden">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} className="h-8 w-full rounded-lg" />
          ))}
      </div>
    );
  }

  if (error) return <p>Error loading platforms: {error.message}</p>;

  return (
    <ChannelPlatformsContent
      data={data}
      openDrawer={openDrawer}
      showAll={showAll}
    />
  );
};

export const ChannelPlatformsMobile = ({ openDrawer }) => {
  const { data, loading, error, refetch } = useChannelPlatformsQuery();

  if (loading) {
    return (
      <div className="grid gap-2 overflow-hidden">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} className="h-8 w-full rounded-lg" />
          ))}
      </div>
    );
  }

  if (error) return <p>Error loading platforms: {error.message}</p>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {data.items.length && (
          <Button
            variant="secondary"
            className="rounded-r-none flex items-center gap-3"
          >
            Platforms
            <Badge
              color="teal"
              className="rounded-sm border text-xs/tight py-[1px] px-1.5"
            >
              {data.items.length}
            </Badge>
          </Button>
        )}
      </DropdownMenuTrigger>
      <CreatePlatform
        refetch={refetch}
        trigger={
          data.items.length ? (
            <Button
              variant="secondary"
              className="border-l-0 shadow-sm px-1.5 rounded-l-none flex items-center"
            >
              <Badge
                color="blue"
                className="rounded-sm border text-[.7rem] py-0 px-0"
              >
                <Plus className="size-4 p-0.5" />
              </Badge>
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="h-full flex items-center gap-3"
            >
              Platform
              <Badge
                color="blue"
                className="rounded-sm border text-[.7rem] py-0 px-0"
              >
                <Plus className="size-4 p-0.5" />
              </Badge>
            </Button>
          )
        }
      />
      <DropdownMenuPortal>
        <DropdownMenuContent className="w-40 origin-top-right shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          {data.items.map((platform) => (
            <DropdownMenuItem
              key={platform.id}
              onClick={() => openDrawer(platform.id, "ChannelPlatform")}
              className="block w-full text-left px-4 py-2 text-sm"
            >
              {platform.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};
