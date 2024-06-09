"use client";
import React, { useState } from "react";
import { useQuery, gql } from "@keystone-6/core/admin-ui/apollo";
import {
  ChevronDownIcon,
  Circle,
  Ellipsis,
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
import { Badge, BadgeButton } from "@ui/badge";
import { CreateShop } from "./CreateShop";
import { EditItemDrawer } from "@keystone/themes/Tailwind/atlas/components/EditItemDrawer";

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
      createdAt
      updatedAt
    }
    count: shopsCount(where: $where)
  }
`;

export const Shops = ({ openDrawer }) => {
  const { data, loading, error, refetch } = useQuery(SHOPS_QUERY, {
    variables: {
      where: { OR: [] },
      take: 50,
      skip: 0,
    },
  });
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="relative grid gap-3 sm:grid-cols-2 overflow-hidden">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} className="border h-32 w-full rounded-lg" />
          ))}
      </div>
    );
  }

  if (error) return <p>Error loading shops: {error.message}</p>;

  const shopItems = data.items;

  return (
    <div>
      {!showAll && shopItems.length > 6 && (
        <div className="z-10 bg-gradient-to-t from-white to-transparent dark:from-gray-950 dark:to-transparent absolute bottom-0 left-0 right-0 h-36 pointer-events-none" />
      )}

      {shopItems.length ? (
        <div className="relative grid gap-3 md:grid-cols-2 overflow-hidden">
          {shopItems.slice(0, showAll ? shopItems.length : 6).map((shop) => {
            return (
              <div
                key={shop.id}
                className="border flex-1 flex flex-col rounded-lg shadow-sm"
              >
                <div className="border-b py-3 px-4 bg-muted/40 flex items-center justify-between">
                  <span className="text-sm font-medium">{shop.name}</span>
                  <div className="flex gap-2">
                    <BadgeButton
                      color="blue"
                      className="opacity-80 text-xs uppercase tracking-wider font-medium px-1"
                      onClick={() => openDrawer(shop.id, "Shop")}
                    >
                      <Ellipsis className="size-3" />
                    </BadgeButton>
                  </div>
                </div>

                <DescriptionList>
                  <DescriptionTerm className="text-xs">
                    Platform
                  </DescriptionTerm>
                  <DescriptionDetails className="text-xs">
                    {shop.platform ? (
                      shop.platform.name
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
                    title={shop.createdAt}
                  >
                    {format(new Date(shop.createdAt), "PPP")}
                  </DescriptionDetails>
                  <DescriptionTerm className="text-xs">
                    Updated at
                  </DescriptionTerm>
                  <DescriptionDetails
                    className="text-xs"
                    title={shop.updatedAt}
                  >
                    {format(new Date(shop.updatedAt), "PPP")}
                  </DescriptionDetails>
                </DescriptionList>
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
              No <span className="lowercase">Shops</span> found
            </span>
            <span className="text-muted-foreground pb-4">
              Get started by creating a new one.
            </span>
            {/* {showCreate && <CreateButtonLink list={list} />} */}
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
