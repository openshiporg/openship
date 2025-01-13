// components/ProductDetailsCollapsible.js
import React, { useState } from "react";
import { useQuery } from "@keystone-6/core/admin-ui/apollo";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/collapsible";

import {
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react";

import { ItemPagination, ItemPaginationStats } from "./ItemPagination";
import { gql } from "@keystone-6/core/admin-ui/apollo";
import { Skeleton } from "@keystone/themes/Tailwind/orion/primitives/default/ui/skeleton";

import { CartItem } from "./CartItem";

export const CART_ITEMS_QUERY = gql`
  query CART_ITEMS_QUERY($orderId: ID!, $take: Int!, $skip: Int!) {
    cartItems(
      where: { order: { id: { equals: $orderId } } }
      take: $take
      skip: $skip
      orderBy: [{ updatedAt: desc }]
    ) {
      id
      name
      image
      price
      quantity
      productId
      variantId
      purchaseId
      url
      error
      channel {
        id
        name
      }
    }
    cartItemsCount(where: { order: { id: { equals: $orderId } } })
  }
`;

export const LINE_ITEMS_QUERY = gql`
  query LINE_ITEMS_QUERY($orderId: ID!, $take: Int!, $skip: Int!) {
    lineItems(
      where: { order: { id: { equals: $orderId } } }
      take: $take
      skip: $skip
      orderBy: [{ updatedAt: desc }]
    ) {
      id
      name
      quantity
      price
      image
      productId
      variantId
    }
    lineItemsCount(where: { order: { id: { equals: $orderId } } })
  }
`;

export const ProductDetailsCollapsible = ({
  orderId,
  title,
  defaultOpen = true,
  openEditDrawer,
  removeEditItemButton,
  totalItems,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [currentPage, setCurrentPage] = useState(1);
  const isCartItem = title === "Cart Item";
  const itemsPerPage = 5;

  const query = isCartItem ? CART_ITEMS_QUERY : LINE_ITEMS_QUERY;
  const { data, loading, error, refetch } = useQuery(query, {
    variables: {
      orderId,
      take: itemsPerPage,
      skip: (currentPage - 1) * itemsPerPage,
    },
    skip: !isOpen,
  });

  const items = isCartItem ? data?.cartItems : data?.lineItems;
  const itemsCount = isCartItem ? data?.cartItemsCount : data?.lineItemsCount;

  const triggerClassName = `flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium ${
    isCartItem
      ? "text-emerald-500 bg-white border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300 dark:hover:text-white dark:hover:bg-emerald-700 dark:focus:ring-blue-500 dark:focus:text-white"
      : "text-blue-500 bg-white border-blue-200 hover:bg-blue-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:text-white"
  }`;

  const renderSkeletonItem = () => (
    <div className="border p-2 bg-background rounded-sm flex items-center gap-4 relative">
      <Skeleton className="h-12 w-12 rounded-sm" />
      <div className="grid flex-grow gap-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`flex flex-col gap-2 p-3 ${
        isCartItem
          ? "bg-green-50/40 dark:bg-emerald-900/20"
          : "bg-blue-50/30 dark:bg-indigo-900/10"
      }`}
    >
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <button type="button" className={triggerClassName}>
            {itemsCount || totalItems} {title}
            {(itemsCount || totalItems) !== 1 && "s"}
            <ChevronsUpDown className="h-4 w-4" />
          </button>
        </CollapsibleTrigger>
        {isOpen && totalItems > 5 && (
          <ItemPagination
            currentPage={currentPage}
            totalItems={itemsCount || totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            isCartItem={isCartItem}
          />
        )}
      </div>
      <CollapsibleContent className="space-y-2">
        {isOpen && (
          <>
            {totalItems > 5 && (
              <ItemPaginationStats
                currentPage={currentPage}
                totalItems={itemsCount || totalItems}
                itemsPerPage={itemsPerPage}
              />
            )}
            {loading ? (
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <div key={`skeleton-${index}`}>{renderSkeletonItem()}</div>
              ))
            ) : error ? (
              <div className="text-red-500">
                Error loading items: {error.message}
              </div>
            ) : (
              items?.map((item, index) => (
                <CartItem
                  key={item.id + "-details-" + index}
                  item={item}
                  isCartItem={isCartItem}
                  openEditDrawer={openEditDrawer}
                  removeEditItemButton={removeEditItemButton}
                />
              ))
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
