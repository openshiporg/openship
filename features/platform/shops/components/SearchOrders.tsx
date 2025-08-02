"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Plus,
  ChevronDown,
  ArrowRight as ArrowRightIcon,
  CircleAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { searchShopOrders } from "../actions/search-orders";
import { Checkbox } from "@/components/ui/checkbox";

export function SearchOrders({
  shops,
  shopId,
  searchEntry,
  pageSize = 10,
  onOrderSelect,
  hideSearchBar = false,
  onOrderCreated,
}: {
  shops?: any[];
  shopId?: string;
  searchEntry?: string;
  pageSize?: number;
  onOrderSelect?: (order: any) => void;
  hideSearchBar?: boolean;
  onOrderCreated?: (order: any) => void;
}) {
  const [searchInput, setSearchInput] = useState(searchEntry || '');
  const [activeSearch, setActiveSearch] = useState(searchEntry || '');
  const [skip, setSkip] = useState(0);
  const [after, setAfter] = useState(null);
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>(
    shopId ? [shopId] : shops?.map(shop => shop.id) || []
  );

  const handleSearch = () => {
    setSkip(0);
    setAfter(null);
    setActiveSearch(searchInput);
  };

  const handleNextPage = (newSkip: number, newAfter: any) => {
    setSkip(newSkip);
    setAfter(newAfter);
  };

  const handlePreviousPage = (newSkip: number) => {
    setSkip(newSkip);
    setAfter(null);
  };

  return (
    <div className="flex flex-col h-full">
      {!hideSearchBar && (
        <div className="flex-shrink-0 space-y-4">
          <div className="flex items-center gap-2 p-2">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePreviousPage(Math.max(0, skip - pageSize))}
                disabled={skip === 0}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handleNextPage(skip + pageSize, after)}
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
              >
                SEARCH
              </button>
            </div>
          </div>
          
          {/* Shop Selector */}
          {shops && shops.length > 1 && (
            <div className="px-2 pb-2">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>
                      {selectedShopIds.length === shops.length 
                        ? "All Shops Selected" 
                        : `${selectedShopIds.length} Shop${selectedShopIds.length !== 1 ? 's' : ''} Selected`
                      }
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 p-3 border rounded-lg bg-muted/20">
                  <div className="flex gap-2 mb-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedShopIds(shops.map(s => s.id))}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedShopIds([])}
                    >
                      Clear All
                    </Button>
                  </div>
                  {shops.map((shop) => (
                    <div key={shop.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={shop.id}
                        checked={selectedShopIds.includes(shop.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedShopIds(prev => [...prev, shop.id]);
                          } else {
                            setSelectedShopIds(prev => prev.filter(id => id !== shop.id));
                          }
                        }}
                      />
                      <label htmlFor={shop.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{shop.name}</div>
                        <div className="text-sm text-muted-foreground">{shop.domain}</div>
                      </label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      )}
      <div className="flex-grow overflow-y-auto">
        {/* Single shop mode */}
        {shopId && !shops ? (
          <OrdersContent
            shopId={shopId}
            searchEntry={activeSearch}
            skip={skip}
            after={after}
            pageSize={pageSize}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            onOrderSelect={onOrderSelect}
            onOrderCreated={onOrderCreated}
          />
        ) : (
          /* Multi-shop mode */
          <div className="space-y-2 p-2">
            {selectedShopIds.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Please select at least one shop to search orders.
              </div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {selectedShopIds.map((selectedShopId) => {
                  const shop = shops?.find(s => s.id === selectedShopId);
                  if (!shop) return null;
                  
                  return (
                    <AccordionItem key={selectedShopId} value={selectedShopId}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="text-left">
                            <div className="font-medium">{shop.name}</div>
                            <div className="text-sm text-muted-foreground">{shop.domain}</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <OrdersContent
                          shopId={selectedShopId}
                          searchEntry={activeSearch}
                          skip={0}
                          after={null}
                          pageSize={pageSize}
                          onNextPage={() => {}} // Simplified for accordion
                          onPreviousPage={() => {}} // Simplified for accordion
                          onOrderSelect={onOrderSelect}
                          onOrderCreated={onOrderCreated}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersContent({
  shopId,
  searchEntry,
  skip,
  after,
  pageSize,
  onNextPage,
  onPreviousPage,
  onOrderSelect,
  onOrderCreated,
}: {
  shopId: string;
  searchEntry: string;
  skip: number;
  after: any;
  pageSize: number;
  onNextPage: (skip: number, after: any) => void;
  onPreviousPage: (skip: number) => void;
  onOrderSelect?: (order: any) => void;
  onOrderCreated?: (order: any) => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!shopId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchShopOrders(shopId, searchEntry, pageSize, skip, after);
      
      if (response.success) {
        const searchResults = response.data?.searchShopOrders;
        setOrders(searchResults?.orders || []);
        setHasNextPage(searchResults?.hasNextPage || false);
      } else {
        setError(response.error || "Failed to load orders");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [shopId, searchEntry, skip, after]);

  if (!shopId) return null;
  if (loading) return <Skeleton className="h-[200px] w-full" />;
  if (error)
    return (
      <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600">
        <p className="text-sm">
          <CircleAlert
            className="me-3 -mt-0.5 inline-flex opacity-60"
            size={16}
            aria-hidden="true"
          />
          Error loading orders: {error}
        </p>
      </div>
    );

  if (!orders.length) {
    return (
      <div className="text-center p-8">
        <p className="text-sm text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="bg-background overflow-hidden">
      <div className="grid grid-cols-1 divide-y border-t border-b">
        {orders.map((order: any) => (
          <OrderDetailsComponent
            key={order.orderId}
            order={order}
            shopId={shopId}
            onSelect={() =>
              onOrderSelect && onOrderSelect({ ...order, shop: { id: shopId } })
            }
            onCreateOrder={() => {
              // Instead of creating directly, call onOrderSelect to open dialog
              if (onOrderSelect) {
                onOrderSelect({ ...order, shop: { id: shopId } });
              }
            }}
            isSearchResult={true}
          />
        ))}
      </div>
    </div>
  );
}

const OrderDetailsComponent = ({ order, shopId, onSelect, onCreateOrder, isSearchResult }: {
  order: any;
  shopId: string;
  onSelect: () => void;
  onCreateOrder?: () => Promise<void>;
  isSearchResult: boolean;
}) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateOrder = async () => {
    if (!onCreateOrder) return;

    setIsCreating(true);
    try {
      await onCreateOrder();
      // Show success message or handle success
    } catch (error) {
      console.error("Error creating order:", error);
      // Show error message
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={order.orderId} className="border-0">
        <div className="px-4 py-2 flex items-start justify-between w-full border-b">
          <div className="flex flex-col items-start text-left gap-1.5">
            <div className="flex items-center space-x-4">
              <a
                href={order.link}
                target="_blank"
                rel="noopener noreferrer"
                className="uppercase font-medium text-sm hover:text-blue-600"
              >
                {order.orderName}
              </a>
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
            {isSearchResult && onCreateOrder ? (
              <Button
                size="sm"
                className="text-xs h-6"
                onClick={handleCreateOrder}
                disabled={isCreating}
              >
                <Plus className="size-3" />
                {isCreating ? "CREATING..." : "CREATE"}
              </Button>
            ) : (
              <Button
                size="sm"
                className="text-xs h-6"
                onClick={() => onSelect()}
              >
                <Plus className="size-3" />
                SELECT
              </Button>
            )}
            <AccordionTrigger className={cn(buttonVariants({ variant: "outline" }), "size-6")} />
          </div>
        </div>
        <AccordionContent className="pb-0">
          <div className="divide-y">
            <ProductDetailsCollapsible
              items={order.lineItems || []}
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
  );
};

const ProductDetailsCollapsible = ({ items, title, defaultOpen = true }: {
  items: any[];
  title: string;
  defaultOpen?: boolean;
}) => {
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
          className={
            isCartItem
              ? "flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-emerald-500 bg-white border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 focus:z-10 focus:ring-2 focus:ring-emerald-700 focus:text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300 dark:hover:text-white dark:hover:bg-emerald-700 dark:focus:ring-emerald-500 dark:focus:text-white"
              : "flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-blue-500 bg-white border-blue-200 hover:bg-blue-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:text-white"
          }
        >
          {items.length} {title}
          {items.length > 1 && "s"}
          <ChevronDown className="h-4 w-4" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {items.map((item: any, index: number) => (
          <div key={item.lineItemId + "-details-" + index}>
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
                {item.purchaseId && (
                  <Badge className="border text-xs font-medium tracking-wide w-fit">
                    {item.purchaseId}
                  </Badge>
                )}
              </div>
                <div className="flex items-center gap-2 self-end">
                  {isCartItem && item.url && (
                    <Button
                      className="text-xs h-6 px-2"
                      onClick={() => window.open(item.url, "_blank")}
                    >
                      ORDER <ArrowRightIcon className="h-3 w-3 ml-1" />
                    </Button>
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

export default SearchOrders;
