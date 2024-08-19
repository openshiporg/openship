import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/card";
import { Button } from "@ui/button";
import { Skeleton } from "@ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ui/accordion";
import { Badge, BadgeButton } from "@ui/badge";
import {
  PlusIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  Plus,
  ChevronsUpDown,
  MoreVertical,
  Search,
} from "lucide-react";
import { Input } from "@ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/collapsible";
import { Avatar } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/dialog";
import { OrderDetailsDialog } from "./OrderDetailsDialog";

const SEARCH_SHOP_ORDERS = gql`
  query SearchShopOrders(
    $shopId: ID!
    $searchEntry: String
    $take: Int!
    $skip: Int
    $after: String
  ) {
    searchShopOrders(
      shopId: $shopId
      searchEntry: $searchEntry
      take: $take
      skip: $skip
      after: $after
    ) {
      orders {
        orderId
        orderName
        link
        date
        firstName
        lastName
        streetAddress1
        streetAddress2
        city
        state
        zip
        country
        email
        cartItems {
          productId
          variantId
          quantity
          price
          name
          image
          channel {
            id
            name
          }
        }
        lineItems {
          name
          quantity
          price
          image
          productId
          variantId
          lineItemId
        }
        fulfillments {
          company
          number
          url
        }
        note
        totalPrice
        cursor
      }
      hasNextPage
    }
  }
`;

export function SearchOrders({ shopId, pageSize = 10 }) {
  const [searchEntry, setSearchEntry] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const [after, setAfter] = useState(null);

  const handleSearch = () => {
    setSkip(0);
    setAfter(null);
    setActiveSearch(searchEntry);
  };

  const handleNextPage = (newSkip, newAfter) => {
    setSkip(newSkip);
    setAfter(newAfter);
  };

  const handlePreviousPage = (newSkip) => {
    setSkip(newSkip);
    setAfter(null);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1">
          <Button
            variant="secondary"
            onClick={() => handlePreviousPage(Math.max(0, skip - pageSize))}
            disabled={skip === 0}
            className="h-10 px-2.5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleNextPage(skip + pageSize, after)}
            className="h-10 px-2.5"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search orders..."
            className="input pr-10"
            value={searchEntry}
            onChange={(e) => setSearchEntry(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <div className="absolute right-2 top-2">
            <BadgeButton
              variant="secondary"
              onClick={handleSearch}
              className="border h-6 py-1 uppercase text-xs font-medium tracking-wider"
            >
              Search
            </BadgeButton>
          </div>
        </div>
      </div>
      <OrdersContent
        shopId={shopId}
        searchEntry={activeSearch}
        skip={skip}
        after={after}
        pageSize={pageSize}
        onNextPage={handleNextPage}
        onPreviousPage={handlePreviousPage}
      />
    </div>
  );
}

// This component handles data fetching and display
function OrdersContent({
  shopId,
  searchEntry,
  skip,
  after,
  pageSize,
  onNextPage,
  onPreviousPage,
}) {
  const { data, loading, error } = useQuery(SEARCH_SHOP_ORDERS, {
    variables: { shopId, searchEntry, take: pageSize, skip, after },
    fetchPolicy: "network-only",
  });

  if (loading) return <Skeleton className="h-[200px] w-full" />;
  if (error)
    return (
      <div>
        <Badge color="rose" className="border opacity-80 text-sm w-full">
          Error loading orders: {error?.message}
        </Badge>
      </div>
    );

  const { orders, hasNextPage } = data?.searchShopOrders || {
    orders: [],
    hasNextPage: false,
  };

  return (
    <div className="border bg-background mt-4 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 divide-y">
        {orders.map((order) => (
          <OrderDetailsComponent
            key={order.orderId}
            order={order}
            shopId={shopId}
          />
        ))}
      </div>
    </div>
  );
}

const ProductDetailsCollapsible = ({ items, title, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isCartItem = title === "Cart Item";

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
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={`flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium ${
            isCartItem
              ? "text-emerald-500 bg-white border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300 dark:hover:text-white dark:hover:bg-emerald-700 dark:focus:ring-blue-500 dark:focus:text-white"
              : "text-blue-500 bg-white border-blue-200 hover:bg-blue-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:text-white"
          }`}
        >
          {items.length} {title}
          {items.length > 1 && "s"}
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {items.map((item, index) => (
          <div key={item.lineItemId + "-details-" + index}>
            <div className="border p-2 bg-background rounded-sm flex items-center gap-4">
              <img
                className="border rounded-sm h-12 w-12 object-cover"
                src={item.image}
                alt={item.name}
              />
              <div className="grid flex-grow">
                <div className="uppercase font-normal tracking-wide text-xs text-muted-foreground">
                  {item.channel?.name || "CHANNEL"}
                </div>
                <span className="text-sm font-medium">{item.name}</span>
                <p className="text-xs text-muted-foreground">{item.sku}</p>
                {item.quantity > 1 ? (
                  <div className="flex gap-2 items-center">
                    <p className="text-sm dark:text-emerald-500 font-medium">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      (${parseFloat(item.price).toFixed(2)} x {item.quantity})
                    </p>
                  </div>
                ) : (
                  <p className="text-sm dark:text-emerald-500 font-medium">
                    ${parseFloat(item.price).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 self-end">
                {isCartItem && (
                  <Button
                    className="text-xs h-6 px-2"
                    // variant="outline"
                    // className="bg-green-100 text-green-600"
                  >
                    ORDER <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
                <Button variant="secondary" size="sm" className="p-1">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const OrderDetailsComponent = ({ order, shopId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={order.orderId} className="border-0">
          <div className="px-4 py-2 flex items-start justify-between w-full border-b">
            <div className="flex flex-col items-start text-left gap-1.5">
              <div className="flex items-center space-x-4">
                <span className="uppercase font-medium text-sm">
                  {order.orderName}
                </span>
                <span className="text-xs font-medium opacity-65">
                  {order.date}
                </span>
              </div>
              <div className="text-sm opacity-75">
                <p>
                  {order.firstName} {order.lastName}
                </p>
                <p>{order.streetAddress1}</p>
                {order.streetAddress2 && <p>{order.streetAddress2}</p>}
                <p>
                  {order.city}, {order.state} {order.zip}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BadgeButton
                color="sky"
                className="border p-1"
                onClick={() => setIsDialogOpen(true)}
              >
                <MoreVertical className="h-3 w-3" />
              </BadgeButton>
              <AccordionTrigger hideArrow className="py-0">
                <BadgeButton color="zinc" className="border p-1">
                  <ChevronDown className="h-3 w-3" />
                </BadgeButton>
              </AccordionTrigger>
            </div>
          </div>
          <AccordionContent>
            <div className="divide-y">
              <ProductDetailsCollapsible
                items={order.lineItems}
                title="Line Item"
                defaultOpen={true}
              />
              {order.cartItems && order.cartItems.length > 0 && (
                <ProductDetailsCollapsible
                  items={order.cartItems}
                  title="Cart Item"
                  defaultOpen={true}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <OrderDetailsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        order={order}
        shopId={shopId}
      />
    </>
  );
};
