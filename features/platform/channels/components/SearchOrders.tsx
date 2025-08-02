"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchChannelOrders } from "../actions/search-orders";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SearchOrders({
  channelId,
  searchEntry = "",
  pageSize = 10,
  onOrderSelect,
  hideSearchBar = false,
}: {
  channelId: string;
  searchEntry?: string;
  pageSize?: number;
  onOrderSelect?: (order: any) => void;
  hideSearchBar?: boolean;
}) {
  const [searchInput, setSearchInput] = useState(searchEntry);
  const [activeSearch, setActiveSearch] = useState(searchEntry);
  const [skip, setSkip] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async (search: string, skipCount: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await searchChannelOrders(channelId, search, pageSize, skipCount);
      
      if (response.orders) {
        setOrders(response.orders);
      } else {
        setError("Failed to load orders");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(activeSearch, skip);
  }, [channelId, activeSearch, skip]);

  const handleSearch = () => {
    setSkip(0);
    setActiveSearch(searchInput);
  };

  const handleNextPage = () => {
    startTransition(() => {
      setSkip(skip + pageSize);
    });
  };

  const handlePreviousPage = () => {
    startTransition(() => {
      setSkip(Math.max(0, skip - pageSize));
    });
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-red-600">
        <CircleAlert className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!hideSearchBar && (
        <div className="flex items-center gap-2 p-2">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousPage}
              disabled={skip === 0 || isPending}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPage}
              disabled={orders.length < pageSize || isPending}
              className="h-10 w-10"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-full flex rounded-lg shadow-sm">
            <Input
              className="-me-px flex-1 rounded-lg rounded-e-none shadow-none focus-visible:z-10"
              placeholder="Search orders..."
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <button 
              className="tracking-wide inline-flex items-center rounded-e-lg border border-input bg-background px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={handleSearch}
              disabled={isPending}
            >
              SEARCH
            </button>
          </div>
        </div>
      )}

      <div className="bg-background overflow-hidden">
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {activeSearch ? "No orders found matching your search." : "No orders found for this channel."}
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-y border-t border-b">
            {orders.map((order) => (
              <ChannelOrderDisplay
                key={order.id}
                order={order}
                onOrderSelect={onOrderSelect}
              />
            ))}
          </div>
        )}
      </div>

      {orders.length === pageSize && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {skip + 1}-{skip + orders.length} orders
        </div>
      )}
    </div>
  );
}

const ChannelOrderDisplay = ({ order, onOrderSelect }: {
  order: any;
  onOrderSelect?: (order: any) => void;
}) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={order.id} className="border-0">
        <div className="px-4 py-2 flex items-start justify-between w-full border-b">
          <div className="flex flex-col items-start text-left gap-1.5">
            <div className="flex items-center space-x-4">
              <span className="uppercase font-medium text-sm">
                {order.orderName}
              </span>
              <span className="text-xs font-medium opacity-65">
                {new Date(order.createdAt).toLocaleDateString()}
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
            <AccordionTrigger className={cn(buttonVariants({ variant: "outline" }), "size-6")} />
          </div>
        </div>
        <AccordionContent className="pb-0">
          <div className="divide-y">
            <ProductDetailsCollapsible
              items={order.cartItems || []}
              title="Line Item"
              defaultOpen={true}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const ProductDetailsCollapsible = ({ items, title, defaultOpen = true }: {
  items: any[];
  title: string;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col gap-2 p-3 bg-blue-50/30 dark:bg-indigo-900/10"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-blue-500 bg-white border-blue-200 hover:bg-blue-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:text-white"
        >
          {items.length} {title}
          {items.length > 1 && "s"}
          <ChevronDown className="h-4 w-4" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {items.map((item: any, index: number) => (
          <div key={item.id + "-details-" + index}>
            <div className="border p-2 bg-background rounded-sm flex flex-col gap-4 relative">
              <div className="flex items-center gap-4">
              {item.image ? (
                <img
                  className="border rounded-sm h-12 w-12 object-cover"
                  src={item.image}
                  alt={item.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                    if (placeholder) {
                      (placeholder as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : (
                <div className="border rounded-sm h-12 w-12 bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">IMG</span>
                </div>
              )}
              <div className="border rounded-sm h-12 w-12 bg-muted flex items-center justify-center" style={{ display: 'none' }}>
                <span className="text-xs text-muted-foreground">IMG</span>
              </div>
              <div className="grid flex-grow">
                <div className="uppercase font-medium tracking-wide text-xs text-muted-foreground">
                  {item.channel?.name}
                </div>
                <span className="text-sm font-medium">{item.name}</span>
                <div className="text-xs text-muted-foreground">
                  {item.productId} | {item.variantId}
                </div>
                {item.quantity > 1 ? (
                  <div className="flex gap-2 items-center">
                    <p className="text-sm dark:text-blue-500 font-medium">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      (${parseFloat(item.price).toFixed(2)} x {item.quantity})
                    </p>
                  </div>
                ) : (
                  <p className="text-sm dark:text-blue-500 font-medium">
                    ${parseFloat(item.price).toFixed(2)}
                  </p>
                )}
                {item.purchaseId && (
                  <Badge className="border text-xs font-medium tracking-wide w-fit">
                    {item.purchaseId}
                  </Badge>
                )}
              </div>
              </div>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};
