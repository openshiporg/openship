"use client";

import React, { useEffect, useState } from "react";
import { useQuery, gql } from "@keystone-6/core/admin-ui/apollo";
import {
  ChevronDownIcon,
  Circle,
  EllipsisVertical,
  MoreVertical,
  Square,
  SquareStack,
  Ticket,
  Triangle,
  Webhook,
  LinkIcon,
  PlusIcon
} from "lucide-react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@ui/description-list";
import {
  differenceInHours,
  format,
  parseISO,
  differenceInMinutes,
} from "date-fns";
import { Skeleton } from "@ui/skeleton";
import { Badge } from "@keystone/themes/Tailwind/orion/primitives/default/ui/badge";
import { Button } from "@keystone/themes/Tailwind/orion/primitives/default/ui/button";
import { Webhooks } from "./Webhooks";
import { Avatar } from "@keystone/themes/Tailwind/orion/primitives/default/ui/avatar";
import { Squircle } from "@squircle-js/react";
import { Links } from "./Links";
import { RiCalculatorLine, RiMapPin2Line, RiBarChartFill } from "@remixicon/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/dynamic-tabs";
import { SearchOrders } from "./SearchOrders";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ui/tooltip";
import { ScrollArea, ScrollBar } from "@ui/scroll-area";
import { MatchList } from "../../matches/(components)/MatchList";

export const SHOPS_QUERY = gql`
  query (
    $where: ShopWhereInput
    $take: Int!
    $skip: Int!
    $orderBy: [ShopOrderByInput!]
  ) {
    items: shops(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
      id
      name
      platform {
        name
      }
      linkMode
      links(orderBy: [{ rank: asc }]) {
        id
        rank
        channel {
          id
          name
        }
        filters
      }
      ordersCount
      shopItemsCount
      linksCount
      createdAt
      updatedAt
    }
    count: shopsCount(where: $where)
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
  { value: "orders", icon: Ticket, label: "Orders", count: "ordersCount" },
  {
    value: "matches",
    icon: SquareStack,
    label: "Matches",
    count: "shopItemsCount",
  },
  { value: "links", icon: LinkIcon, label: "Links", count: "linksCount" },
  { value: "webhooks", icon: Webhook, label: "Webhooks" },
];


export const Shops = ({ openDrawer, selectedPlatform }) => {
  const { data, loading, error, refetch } = useQuery(SHOPS_QUERY, {
    variables: {
      where: selectedPlatform
        ? { platform: { id: { equals: selectedPlatform } } }
        : { OR: [] },
      take: 50,
      skip: 0,
    },
  });

  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="grid gap-3 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (error) return <div>Error loading shops: {error.message}</div>;

  const shopItems = data?.items || [];

  return (
    <div>
      {!showAll && shopItems.length > 6 && (
        <div className="z-10 bg-gradient-to-t from-white to-transparent dark:from-zinc-950 dark:to-transparent absolute bottom-0 left-0 right-0 h-36 pointer-events-none" />
      )}
      {shopItems.length ? (
        <div className="relative grid">
          {shopItems.slice(0, showAll ? shopItems.length : 6).map((shop) => (
            <div key={shop.id} className="flex flex-col">
              <div className="flex flex-col gap-5 relative *:relative dark:bg-black dark:border-white/15 before:absolute before:inset-0 before:border-white before:from-zinc-100 dark:before:border-white/20 before:bg-gradient-to-bl dark:before:from-zinc-500/15 dark:before:to-transparent">
                <div className="px-4 pt-4 flex gap-4 justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="self-start">
                      <Badge
                        color="teal"
                        className="uppercase tracking-wide border-2 text-xl flex items-center justify-center w-14 h-14 font-medium rounded-[calc(theme(borderRadius.xl)-1px)]"
                      >
                        {shop.name.slice(0, 2)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <h3 className="mr-2">{shop.name}</h3>
                      </div>

                      <div className="flex flex-wrap flex-col sm:flex-row sm:items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                        {shop.platform ? (
                          <div className="text-muted-foreground/75 flex items-center gap-2">
                            <div className="rounded-full text-teal-400 bg-teal-400/20 dark:text-teal-500 dark:bg-teal-400/20 p-1">
                              <div className="h-2 w-2 rounded-full bg-current" />
                            </div>
                            {shop.platform.name}
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
                          Last updated {formatDate(shop.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="border [&_svg]:size-3 h-6 w-6"
                      onClick={() => openDrawer(shop.id, "Shop")}
                    >
                      <MoreVertical />
                    </Button>
                  </div>
                </div>

                <Tabs>
                  <ScrollArea>
                    <TabsList className="justify-start w-full h-auto gap-2 rounded-none bg-transparent px-3 py-1 border-b">
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
                          <span className="hidden sm:inline">{tab.label}</span>
                          {tab.count && (
                            <span className="opacity-50 ml-2 bg-primary text-primary-foreground rounded-md w-4 h-4 flex items-center justify-center text-xs">
                              {shop[tab.count]}
                            </span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>

                  <TabsContent value="orders" className="bg-background p-4 border-b">
                      <SearchOrders
                        shopId={shop.id}
                        searchEntry=""
                        pageSize={10}
                      />
                  </TabsContent>

                  <TabsContent value="matches" className="bg-background p-4 border-b">
                      <MatchList
                        shopId={shop.id}
                        onMatchAction={() => {}}
                        showCreate={false}
                      />
                  </TabsContent>

                  <TabsContent value="links" className="bg-background p-4 border-b">
                    <p className="text-sm text-gray-500 sm:text-gray-500">
                      <div>
                        <Links
                          shopId={shop.id}
                          links={shop.links}
                          linkMode={shop.linkMode}
                          refetch={refetch}
                          editItem={openDrawer}
                        />
                      </div>
                    </p>
                  </TabsContent>

                  <TabsContent value="webhooks" className="bg-background p-4 border-b">
                    <p className="text-sm text-gray-500 sm:text-gray-500">
                      <div className="mb-3 text-sm text-zinc-500 dark:text-zinc-200">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          Create platform webhooks to keep Openship in sync
                        </div>
                      </div>
                      <Webhooks shopId={shop.id} />
                    </p>
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
              <RiBarChartFill
                className="mx-auto h-7 w-7 text-muted-foreground"
                aria-hidden={true}
              />
            </div>

            <span className="pt-4 font-medium text-foreground">
              No <span className="lowercase">Shops</span> found
            </span>
            <span className="text-sm text-muted-foreground pb-4">
              Connect your e-commerce stores to start managing your inventory
            </span>
            <Button 
              onClick={() => document.querySelector('[aria-label="Create Shop"]')?.click()}
              className="mt-2"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Connect Shop
            </Button>
          </div>
        </div>
      )}
      {!showAll && shopItems.length > 6 && (
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
