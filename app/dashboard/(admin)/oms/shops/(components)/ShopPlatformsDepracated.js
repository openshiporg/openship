"use client";
import React, { useState } from "react";
import { useQuery,gql } from "@keystone-6/core/admin-ui/apollo";
import { ChevronDownIcon } from "lucide-react";
import { DotFillIcon } from "@primer/octicons-react";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import { useList } from "@keystone/keystoneProvider";
import { Skeleton } from "@ui/skeleton";
import { Badge, BadgeButton } from "@ui/badge";
import { shopFunctions } from "../../../../../../shopFunctions";

const mockShopFunctions = {
  ...shopFunctions,
  Webflow: () => import("../../../../../../shopFunctions/shopify"),
  WiX: () => import("../../../../../../shopFunctions/bigcommerce"),
  Medusa: () => import("../../../../../../shopFunctions/woocommerce"),
  Openfront: () => import("../../../../../../shopFunctions/shopify"),
  Stripe: () => import("../../../../../../shopFunctions/bigcommerce"),
};

const SHOP_PLATFORMS_QUERY = gql`
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
      createdAt
      updatedAt
      __typename
    }
    count: shopPlatformsCount(where: $where)
  }
`;

export const ShopPlatforms = () => {
  const { data, loading, error, refetch } = useQuery(SHOP_PLATFORMS_QUERY, {
    variables: {
      where: { OR: [] },
      take: 50,
      skip: 0,
    },
  });
  const [showAll, setShowAll] = useState(false);
  const list = useList("ShopPlatform");
  const { createWithData, state } = useCreateItem(list);

  const handlePlatformActivation = async (platformKey) => {
    const platformName =
      platformKey.charAt(0).toUpperCase() + platformKey.slice(1);

    const inputData = {
      data: {
        name: platformName,
        updateProductFunction: platformKey,
        getWebhooksFunction: platformKey,
        deleteWebhookFunction: platformKey,
        createWebhookFunction: platformKey,
        searchProductsFunction: platformKey,
        getProductFunction: platformKey,
        searchOrdersFunction: platformKey,
        addTrackingFunction: platformKey,
        addCartToPlatformOrderFunction: platformKey,
        oAuthFunction: platformKey,
        cancelOrderWebhookHandler: platformKey,
        createOrderWebhookHandler: platformKey,
      },
    };

    // try {
    await createWithData(inputData);
    refetch();

    //   console.log(`Activated platform: ${platformName}`);
    // } catch (error) {
    //   console.error(`Failed to activate platform: ${platformKey}`, error);
    // }
  };

  if (loading) {
    return (
      <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3 overflow-hidden">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
      </div>
    );
  }

  if (error) return <p>Error loading platforms: {error.message}</p>;

  const isPlatformActivated = (platform, key) => {
    return (
      // platform.name === key.charAt(0).toUpperCase() + key.slice(1) &&
      platform.updateProductFunction === key &&
      platform.getWebhooksFunction === key &&
      platform.deleteWebhookFunction === key &&
      platform.createWebhookFunction === key &&
      platform.searchProductsFunction === key &&
      platform.getProductFunction === key &&
      platform.searchOrdersFunction === key &&
      platform.addTrackingFunction === key &&
      platform.addCartToPlatformOrderFunction === key &&
      platform.oAuthFunction === key &&
      platform.cancelOrderWebhookHandler === key &&
      platform.createOrderWebhookHandler === key
    );
  };

  const activePlatforms = data.items.filter((platform) =>
    Object.keys(mockShopFunctions).some((key) =>
      isPlatformActivated(platform, key)
    )
  );

  const inactivePlatforms = Object.keys(mockShopFunctions).filter(
    (key) =>
      !activePlatforms.some((platform) => isPlatformActivated(platform, key))
  );

  const platformItems = [
    ...data.items,
    ...inactivePlatforms.map((key) => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
    })),
  ];

  return (
    <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3 overflow-hidden">
      {!showAll && platformItems.length > 6 && (
        <div className="z-10 bg-gradient-to-t from-white to-transparent dark:from-zinc-900 dark:to-transparent absolute bottom-0 left-0 right-0 h-36 pointer-events-none" />
      )}

      {platformItems
        .slice(0, showAll ? platformItems.length : 6)
        .map((platform, index) => {
          const key = Object.keys(mockShopFunctions).find((k) =>
            isPlatformActivated(platform, k)
          );
          const isActive = key ? true : false;
          const platformName =
            platform.name ||
            platform.key.charAt(0).toUpperCase() + platform.key.slice(1);

          return (
            <div
              key={platform.key || index}
              className={`${
                !isActive && "opacity-50 hover:opacity-100"
              } transition-opacity duration-300 border flex-1 flex flex-col rounded-lg shadow-sm`}
            >
              <div className="py-3 px-4 bg-muted/40 flex items-center justify-between">
                <span className="text-sm font-medium">{platformName}</span>
                {isActive ? (
                  <Badge
                    color="blue"
                    className="flex items-center text-xs uppercase tracking-wider font-medium"
                  >
                    <div className="mr-2 flex items-center p-[0.07rem] rounded-full bg-blue-200 dark:bg-blue-900/50">
                      <DotFillIcon className="size-3" />
                    </div>
                    Active
                  </Badge>
                ) : (
                  <BadgeButton
                    onClick={() => handlePlatformActivation(platform.key)}
                    color="cyan"
                    isLoading={state === "loading"}
                    className="text-xs uppercase tracking-wider font-medium"
                  >
                    Activate
                  </BadgeButton>
                )}
              </div>
            </div>
          );
        })}

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
