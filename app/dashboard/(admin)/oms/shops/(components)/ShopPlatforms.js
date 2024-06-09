"use client";

import React, { useState } from "react";
import { useQuery, gql } from "@keystone-6/core/admin-ui/apollo";
import {
  ChevronDownIcon,
  Circle,
  Edit2,
  Ellipsis,
  Plus,
  Square,
  Triangle,
} from "lucide-react";
import { DotFillIcon } from "@primer/octicons-react";
import { Skeleton } from "@ui/skeleton";
import { Badge, BadgeButton } from "@ui/badge";
import { CreatePlatform } from "./CreatePlatform";
import { EditItemDrawer } from "@keystone/themes/Tailwind/atlas/components/EditItemDrawer";
import {
  EllipsisHorizontalCircleIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/16/solid";
// import { CreateShop } from "./CreateShop";
import { RiEditFill } from "@remixicon/react";

export const SHOP_PLATFORMS_QUERY = gql`
  query (
    $where: ShopPlatformWhereInput
    $take: Int!
    $skip: Int!
    $orderBy: [ShopPlatformOrderByInput!]
  ) {
    items: shopPlatforms(
      where: $where
      take: $take
      skip: $skip
      orderBy: $orderBy
    ) {
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
      oAuthFunction
      oAuthCallbackFunction
      cancelOrderWebhookHandler
      createOrderWebhookHandler
      appKey
      appSecret
      createdAt
      updatedAt
      __typename
    }
    count: shopPlatformsCount(where: $where)
  }
`;

export const ShopPlatforms = ({ openDrawer }) => {
  const { data, loading, error, refetch } = useQuery(SHOP_PLATFORMS_QUERY, {
    variables: {
      where: { OR: [] },
      take: 50,
      skip: 0,
    },
  });

  const [showAll, setShowAll] = useState(false);

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

  const platformItems = [...data.items];

  return (
    <div className="bg-muted/40 shadow-sm py-3 px-5 border rounded-lg">
      <div className="col-span-full flex justify-between items-center mb-3">
        <h2 className="text-xs uppercase tracking-wide font-medium">
          Platforms
        </h2>
      </div>

      {/* <CreateShop
        selectedPlatformId={selectedPlatformId}
        setSelectedPlatformId={setSelectedPlatformId}
        refetch={refetch}
      /> */}

      {!showAll && platformItems.length > 6 && (
        <div className="z-10 bg-gradient-to-t from-white to-transparent dark:from-zinc-900 dark:to-transparent absolute bottom-0 left-0 right-0 h-36 pointer-events-none" />
      )}

      <div className="grid gap-2 overflow-hidden">
        {platformItems
          .slice(0, showAll ? platformItems.length : 6)
          .map((platform, index) => {
            const platformName = platform.name;
            return (
              <div
                key={index}
                className={`transition-opacity duration-300 flex-1 flex flex-col`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                    <Square3Stack3DIcon className="size-3.5" />

                    {platformName}
                  </span>
                  <BadgeButton
                    color="blue"
                    className="opacity-80 text-xs uppercase tracking-wider font-medium px-1"
                    onClick={() => openDrawer(platform.id, "ShopPlatform")}
                  >
                    <Ellipsis className="size-3" />
                  </BadgeButton>
                </div>
              </div>
            );
          })}
        <CreatePlatform
          refetch={refetch}
          trigger={
            <button className="flex items-center gap-2 text-sm text-muted-foreground">
              <Plus className="size-3.5" /> Add...
            </button>
          }
        />
      </div>

      {!showAll && platformItems.length > 6 && (
        <div className="col-span-full flex justify-center -mt-4">
          <button
            onClick={() => setShowAll(true)}
            className="text-zinc-950 dark:text-zinc-50 font-medium text-sm"
          >
            <ChevronDownIcon />
          </button>
        </div>
      )}
    </div>
  );
};
