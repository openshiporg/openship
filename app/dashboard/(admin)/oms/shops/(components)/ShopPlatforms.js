"use client";

import React, { useState } from "react";
import { useQuery, gql } from "@keystone-6/core/admin-ui/apollo";
import { EllipsisVertical, Plus } from "lucide-react";
import { Skeleton } from "@ui/skeleton";
import { Button } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/button";

import { Badge } from "@ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/dropdown-menu-depracated";
import { CreatePlatform } from "./CreatePlatform";

export const SHOP_PLATFORMS_QUERY = gql`
  query (
    $where: ShopPlatformWhereInput
    $take: Int!
    $skip: Int!
    $orderBy: [ShopPlatformOrderByInput!]
  ) {
    items: shopPlatforms(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
      id
      name
      updateProductFunction
      getWebhooksFunction
      deleteWebhookFunction
      createWebhookFunction
      searchProductsFunction
      getProductFunction
      searchOrdersFunction
      addTrackingFunction
      addCartToPlatformOrderFunction
      cancelOrderWebhookHandler
      createOrderWebhookHandler
      oAuthFunction
      oAuthCallbackFunction
      appKey
      appSecret
      createdAt
      updatedAt
      __typename
    }
    count: shopPlatformsCount(where: $where)
  }
`;

const ShopPlatformsContent = ({ data, openDrawer, showAll }) => {
  if (!data || !data.items) return null;

  const platformItems = [...data.items];

  return platformItems
    .slice(0, showAll ? platformItems.length : 6)
    .map((platform, index) => (
      <div key={index} className="flex items-center">
        <Button
          variant="secondary"
          className="p-1"
          onClick={() => openDrawer(platform.id, "ShopPlatform")}
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

const useShopPlatformsQuery = () => {
  return useQuery(SHOP_PLATFORMS_QUERY, {
    variables: {
      where: { OR: [] },
      take: 50,
      skip: 0,
    },
  });
};

export const ShopPlatforms = ({ openDrawer }) => {
  const { data, loading, error } = useShopPlatformsQuery();
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
    <ShopPlatformsContent
      data={data}
      openDrawer={openDrawer}
      showAll={showAll}
    />
  );
};

export const ShopPlatformsMobile = ({ openDrawer }) => {
  const { data, loading, error, refetch } = useShopPlatformsQuery();

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
              onClick={() => openDrawer(platform.id, "ShopPlatform")}
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
