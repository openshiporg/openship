import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Button } from "@ui/button";
import { Skeleton } from "@ui/skeleton";
import { Badge, BadgeButton } from "@ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CirclePlus,
  ChevronDown,
  ArrowRight as ArrowRightIcon,
  MoreHorizontal,
} from "lucide-react";
import { Input } from "@ui/input";
import { cn } from "@keystone/utils/cn";
import { buttonVariants } from "@ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/collapsible";

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

export function SearchOrders({
  shops,
  shopId: initialShopId,
  pageSize = 10,
  onOrderSelect,
}) {
  const [searchEntry, setSearchEntry] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const [after, setAfter] = useState(null);
  const [selectedShopId, setSelectedShopId] = useState(initialShopId || "ALL");

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

  const handleShopChange = (shopId) => {
    setSelectedShopId(shopId);
    setSkip(0);
    setAfter(null);
    setActiveSearch("");
    setSearchEntry("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 space-y-4">
        <div className="flex items-center gap-2">
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
                onClick={handleSearch}
                className="border text-xs py-0.5 uppercase tracking-wide font-medium"
              >
                Search
              </BadgeButton>
            </div>
          </div>
        </div>
        {shops && (
          <div className="flex flex-wrap gap-2">
            <Badge
              color={selectedShopId === "ALL" ? "sky" : "zinc"}
              className={`cursor-pointer uppercase tracking-wide border px-3 py-1 text-xs font-medium rounded-[calc(theme(borderRadius.lg)-1px)] ${
                selectedShopId === "ALL" ? "opacity-100" : "opacity-70"
              }`}
              onClick={() => handleShopChange("ALL")}
            >
              All Shops
            </Badge>
            {shops.map((shop) => (
              <Badge
                key={shop.id}
                color={selectedShopId === shop.id ? "sky" : "zinc"}
                className={`cursor-pointer uppercase tracking-wide border px-3 py-1 text-xs font-medium rounded-[calc(theme(borderRadius.lg)-1px)] ${
                  selectedShopId === shop.id ? "opacity-100" : "opacity-70"
                }`}
                onClick={() => handleShopChange(shop.id)}
              >
                {shop.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex-grow overflow-y-auto mt-4">
        {selectedShopId === "ALL" ? (
          <AllShopsAccordion
            shops={shops}
            searchEntry={activeSearch}
            skip={skip}
            after={after}
            pageSize={pageSize}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            onOrderSelect={onOrderSelect}
          />
        ) : (
          <OrdersContent
            shopId={selectedShopId}
            searchEntry={activeSearch}
            skip={skip}
            after={after}
            pageSize={pageSize}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            onOrderSelect={onOrderSelect}
          />
        )}
      </div>
    </div>
  );
}

function AllShopsAccordion({
  shops,
  searchEntry,
  skip,
  after,
  pageSize,
  onNextPage,
  onPreviousPage,
  onOrderSelect,
}) {
  return (
    <div className="space-y-2">
      {shops.map((shop) => (
        <ShopCollapsible
          key={shop.id}
          shop={shop}
          searchEntry={searchEntry}
          skip={skip}
          after={after}
          pageSize={pageSize}
          onNextPage={onNextPage}
          onPreviousPage={onPreviousPage}
          onOrderSelect={onOrderSelect}
        />
      ))}
    </div>
  );
}

function ShopCollapsible({
  shop,
  searchEntry,
  skip,
  after,
  pageSize,
  onNextPage,
  onPreviousPage,
  onOrderSelect,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details open={isOpen} className="p-4 border rounded-lg bg-muted/40n group">
      <summary
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className="list-none outline-none [&::-webkit-details-marker]:hidden cursor-pointer"
      >
        <div className="flex gap-3 items-center">
          <div
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "self-start p-1 transition-transform group-open:rotate-90"
            )}
          >
            <ChevronRight className="size-3" />
          </div>
          <div className="flex flex-col gap-1">
            <text className="relative text-lg/5 font-medium">{shop.name}</text>
            {/* <Badge className="border text-[.7rem] py-0.5 uppercase tracking-wide font-medium">
              Search Results
            </Badge> */}
          </div>
        </div>
      </summary>
      <div className="mt-4 max-h-[30vh] overflow-y-auto">
        <OrdersContent
          shopId={shop.id}
          searchEntry={searchEntry}
          skip={skip}
          after={after}
          pageSize={pageSize}
          onNextPage={onNextPage}
          onPreviousPage={onPreviousPage}
          onOrderSelect={onOrderSelect}
        />
      </div>
    </details>
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
}) {
  const { data, loading, error } = useQuery(SEARCH_SHOP_ORDERS, {
    variables: { shopId, searchEntry, take: pageSize, skip, after },
    fetchPolicy: "network-only",
    skip: !shopId,
  });

  if (!shopId) return null;
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
    <div className="border bg-background rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 divide-y">
        {orders.map((order) => (
          <OrderDetailsComponent
            key={order.orderId}
            order={order}
            shopId={shopId}
            onSelect={() =>
              onOrderSelect && onOrderSelect({ ...order, shop: { id: shopId } })
            }
            isSearchResult={true}
          />
        ))}
      </div>
    </div>
  );
}

const OrderDetailsComponent = ({ order, shopId, onSelect, isSearchResult }) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={order.orderId} className="border-0">
        <div className="px-4 py-2 flex items-start justify-between w-full border-b">
          <div className="flex flex-col items-start text-left gap-1.5">
            <div className="flex items-center space-x-4">
              <a href={order.link} target="_blank" rel="noopener noreferrer" className="uppercase font-medium text-sm">
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
            <BadgeButton
              color="sky"
              className="border px-1.5 font-medium tracking-wide py-0.5 text-xs flex gap-1 items-center"
              onClick={() => onSelect(order)}
            >
              <CirclePlus className="h-3 w-3" />{" "}
              {isSearchResult ? "SELECT" : "CREATE"}
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
              // <>{JSON.stringify(order.cartItems)}</>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

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
          <ChevronDown className="h-4 w-4" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {items.map((item, index) => (
          <div key={item.lineItemId + "-details-" + index}>
            <div className="border p-2 bg-background rounded-sm flex items-center gap-4 relative">
              {item.image && (
                <img
                  className="border rounded-sm h-12 w-12 object-cover"
                  src={item.image}
                  alt={item.name}
                />
              )}
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
                  <Badge
                    color="zinc"
                    className="border text-xs font-medium tracking-wide"
                  >
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
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SearchOrders;
