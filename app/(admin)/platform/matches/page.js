"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, gql, useApolloClient } from "@apollo/client";
import { Input } from "@ui/input";
import { Button } from "@ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/dynamic-tabs";
import { Badge, BadgeButton } from "@ui/badge";
import {
  ChevronRight,
  House,
  UsersRound,
  Search,
  ArrowUpDown,
  PanelsTopLeft,
  Box,
  Layers,
  Database,
  Copy,
  PlusIcon,
} from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@ui/drawer";
import { MultipleSelector } from "@keystone/themes/Tailwind/orion/primitives/default/ui/multi-select";
import { SyncInventoryDialog } from "./(components)/SyncInventoryDialog";
import { MatchList } from "./(components)/MatchList";
import { ShowMatchesButton } from "./(components)/ShowMatchesButton";
import { MatchDetailsDialog } from "./(components)/MatchDetailsDialog";
import { cn } from "@keystone/utils/cn";
import { buttonVariants } from "@ui/button";
import { AdminLink } from "@keystone/themes/Tailwind/orion/components/AdminLink";
import { PageBreadcrumbs } from "@keystone/themes/Tailwind/orion/components/PageBreadcrumbs";
import {
  ScrollArea,
  ScrollBar,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/tooltip";
import {
  Square3Stack3DIcon,
  CircleStackIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";
import { SortSelection } from "@keystone/themes/Tailwind/orion/components/SortSelection";
import { useSort } from "@keystone/utils/useSort";
import { useList } from "@keystone/keystoneProvider";
import { RiBarChartFill } from "@remixicon/react";

const SEARCH_SHOP_PRODUCTS = gql`
  query SearchShopProducts($shopId: ID!, $searchEntry: String) {
    searchShopProducts(shopId: $shopId, searchEntry: $searchEntry) {
      image
      title
      productId
      variantId
      price
      availableForSale
      productLink
      inventory
      inventoryTracked
    }
  }
`;

const SEARCH_CHANNEL_PRODUCTS = gql`
  query SearchChannelProducts($channelId: ID!, $searchEntry: String) {
    searchChannelProducts(channelId: $channelId, searchEntry: $searchEntry) {
      image
      title
      productId
      variantId
      price
      availableForSale
      productLink
      inventory
      inventoryTracked
    }
  }
`;

const ALL_SHOPS_QUERY = gql`
  query ALL_SHOPS_QUERY {
    shops {
      id
      name
    }
  }
`;

const ALL_CHANNELS_QUERY = gql`
  query ALL_CHANNELS_QUERY {
    channels {
      id
      name
    }
  }
`;

const SYNC_INVENTORY = gql`
  mutation SyncInventory($ids: [ID!]!) {
    syncInventory(ids: $ids) {
      id
    }
  }
`;

// Add useDebounce hook at the top level
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const MatchesPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchString, setSearchString] = useState("");
  const debouncedSearchString = useDebounce(searchInput, 300); // 300ms delay
  const [selectedTab, setSelectedTab] = useState("shop");
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [selectedChannelIds, setSelectedChannelIds] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const list = useList("Match");
  const orderableFields = new Set(["createdAt", "updatedAt"]);
  const sort = useSort(list, orderableFields);

  const { data: shopsData } = useQuery(ALL_SHOPS_QUERY);
  const { data: channelsData } = useQuery(ALL_CHANNELS_QUERY);

  const [syncInventory] = useMutation(SYNC_INVENTORY);
  const client = useApolloClient();

  // Use useEffect to set first shop as selected when data is loaded
  useEffect(() => {
    if (shopsData?.shops?.length > 0) {
      setSelectedShopId(shopsData.shops[0].id);
    }
  }, [shopsData]);

  useEffect(() => {
    if (channelsData?.channels) {
      setSelectedChannelIds(channelsData.channels.map((channel) => channel.id));
    }
  }, [channelsData]);

  // Update the search string when debounced value changes
  useEffect(() => {
    setSearchString(debouncedSearchString);
  }, [debouncedSearchString]);

  const sortProducts = (products) => {
    return [...products];
  };

  const renderProductList = (products) => {
    const sortedProducts = sortProducts(products);
    return sortedProducts.map((product) => (
      <div
        key={`${product.productId}-${product.variantId}`}
        className="border flex flex-wrap lg:flex-nowrap p-2 bg-muted/40 rounded-md"
      >
        <div className="w-16 h-16 flex-shrink-0">
          {product.image && (
            <img
              src={product.image}
              alt={product.title}
              className="border w-full h-full object-cover rounded-md"
            />
          )}
        </div>
        <div className="flex-grow order-3 lg:order-2 w-full lg:w-auto lg:px-4 mt-2 lg:mt-0">
          <div className="text-sm font-medium">{product.title}</div>
          <div className="text-xs text-gray-500">
            {product.productId} | {product.variantId}
          </div>
          <div className="text-sm font-medium">${product.price}</div>
        </div>
        <div className="ml-auto order-2 lg:order-3">
          <ShowMatchesButton product={product} />
        </div>
      </div>
    ));
  };

  const ShopProducts = ({ shopId }) => {
    const { data: shopProductsData, loading: shopProductsLoading } = useQuery(
      SEARCH_SHOP_PRODUCTS,
      {
        variables: { shopId, searchEntry: debouncedSearchString },
      }
    );

    if (shopProductsLoading) {
      return <div className="p-4">Loading...</div>;
    }

    return (
      <div className="space-y-2">
        {shopProductsData?.searchShopProducts?.length > 0 ? (
          renderProductList(shopProductsData.searchShopProducts)
        ) : (
          <div>
            <Badge
              className="border text-[.7rem] py-0.5 uppercase tracking-wide font-medium"
              color="red"
            >
              No Products Found
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const ChannelProducts = ({ channelId }) => {
    const { data: channelProductsData, loading: channelProductsLoading } =
      useQuery(SEARCH_CHANNEL_PRODUCTS, {
        variables: { channelId, searchEntry: debouncedSearchString },
      });

    if (channelProductsLoading) {
      return <div className="p-4">Loading...</div>;
    }

    return (
      <div className="space-y-2">
        {channelProductsData?.searchChannelProducts?.length > 0 ? (
          renderProductList(channelProductsData.searchChannelProducts)
        ) : (
          <div>
            <Badge
              className="border text-[.7rem] py-0.5 uppercase tracking-wide font-medium"
              color="red"
            >
              No Products Found
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const handleMatchAction = async (action, matchId) => {
    try {
      switch (action) {
        case "sync":
          await syncInventory({ variables: { ids: [matchId] } });
          // Refetch queries to update the UI
          await client.refetchQueries({
            include: [SEARCH_SHOP_PRODUCTS, SEARCH_CHANNEL_PRODUCTS],
          });
          break;
        case "edit":
          // Implement edit logic here
          console.log("Edit match:", matchId);
          break;
        case "delete":
          // Implement delete logic here
          console.log("Delete match:", matchId);
          break;
        default:
          console.log("Unknown action:", action);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  };

  const tabs = [
    {
      value: "shop",
      label: "Shop Products",
      count: shopsData?.shops.length,
      icon: Square3Stack3DIcon,
    },
    {
      value: "channel",
      label: "Channel Products",
      count: channelsData?.channels.length,
      icon: CircleStackIcon,
    },
    {
      value: "matches",
      label: "Matches",
      count: 0,
      icon: Square2StackIcon,
    },
  ];

  const EmptyState = ({ type }) => {
    const content = {
      shop: {
        title: "No shop products found",
        description: "Connect a shop to view and manage your products",
        action: null
      },
      channel: {
        title: "No channel products found",
        description: "Connect a sales channel to view and manage your products",
        action: null
      },
      matches: {
        title: "No matches created",
        description: "Create matches to link products between shops and channels",
        action: (
          <Button 
            onClick={() => document.querySelector('[aria-label="Create Match"]')?.click()}
            className="mt-4"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Match
          </Button>
        )
      }
    };

    return (
      <div className="flex h-72 items-center justify-center rounded-lg border bg-muted">
        <div className="text-center">
          <RiBarChartFill
            className="mx-auto h-7 w-7 text-muted-foreground"
            aria-hidden={true}
          />
          <p className="mt-2 font-medium text-foreground">
            {content[type].title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {content[type].description}
          </p>
          {content[type].action}
        </div>
      </div>
    );
  };

  return (
    <section className="h-screen overflow-hidden flex flex-col">
      <PageBreadcrumbs
        items={[
          {
            type: "link",
            label: "Dashboard",
            href: "/",
          },
          {
            type: "page",
            label: "Platform",
            showModelSwitcher: true,
            switcherType: "platform",
          },
          {
            type: "page",
            label: "Matches",
          },
        ]}
      />

      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between p-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold">Matches</h1>
            <p className="text-muted-foreground">
              Manage matches across shops and channels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SyncInventoryDialog />
            <MatchDetailsDialog />
          
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto flex flex-col">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex flex-col h-full">
            <TabsList className="w-full bg-background h-auto gap-2 px-4 border-b justify-start py-0.5 flex-shrink-0 rounded-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-foreground/50 relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-0.5 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=active]:text-foreground/75"
                  >
                    <Icon
                      className="w-4 h-4 mr-2 opacity-60"
                      size={16}
                      aria-hidden="true"
                    />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="shop" className="flex-1 overflow-auto h-full">
              <div className="flex h-full">
                <Tabs
                  value={selectedShopId}
                  onValueChange={setSelectedShopId}
                  orientation="vertical"
                  className="w-full h-full flex flex-col md:flex-row p-4 gap-4"
                >
                  <TabsList className="justify-start flex-shrink-0 md:w-48 flex flex-row md:flex-col gap-1 bg-transparent sticky top-0 overflow-x-auto md:overflow-x-visible">
                    {shopsData?.shops.map((shop) => (
                      <TabsTrigger
                        key={shop.id}
                        value={shop.id}
                        className="w-auto md:w-full data-[state=active]:bg-muted justify-start data-[state=active]:shadow-none whitespace-nowrap"
                      >
                        {shop.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex-1 overflow-auto">
                    {shopsData?.shops.map((shop) => (
                      <TabsContent
                        key={shop.id}
                        value={shop.id}
                        className="h-full"
                      >
                        <div className="flex flex-col h-full gap-4">
                          <div className="sticky top-0 z-10 bg-background">
                            <div className="relative flex-1 w-full">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <form onSubmit={(e) => e.preventDefault()}>
                                <Input
                                  type="search"
                                  className="pl-9 w-full h-9 rounded-lg placeholder:text-muted-foreground/80 text-sm shadow-sm"
                                  value={searchInput}
                                  onChange={(e) => setSearchInput(e.target.value)}
                                  placeholder="Search shop products..."
                                />
                              </form>
                            </div>
                          </div>
                          <div className="overflow-auto flex-1">
                            <ShopProducts shopId={shop.id} />
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              </div>
            </TabsContent>

            <TabsContent value="channel" className="flex-1 overflow-auto h-full">
              <div className="flex h-full">
                <Tabs
                  value={selectedChannelIds[0]}
                  onValueChange={(value) => setSelectedChannelIds([value])}
                  orientation="vertical"
                  className="w-full h-full flex flex-col md:flex-row p-4 gap-4"
                >
                  <TabsList className="justify-start flex-shrink-0 md:w-48 flex flex-row md:flex-col gap-1 bg-transparent sticky top-0 overflow-x-auto md:overflow-x-visible">
                    {channelsData?.channels.map((channel) => (
                      <TabsTrigger
                        key={channel.id}
                        value={channel.id}
                        className="w-auto md:w-full data-[state=active]:bg-muted justify-start data-[state=active]:shadow-none whitespace-nowrap"
                      >
                        {channel.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex-1 overflow-auto">
                    {channelsData?.channels.map((channel) => (
                      <TabsContent
                        key={channel.id}
                        value={channel.id}
                        className="h-full"
                      >
                        <div className="flex flex-col h-full gap-4">
                          <div className="sticky top-0 z-10 bg-background">
                            <div className="relative flex-1 w-full">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <form onSubmit={(e) => e.preventDefault()}>
                                <Input
                                  type="search"
                                  className="pl-9 w-full h-9 rounded-lg placeholder:text-muted-foreground/80 text-sm shadow-sm"
                                  value={searchInput}
                                  onChange={(e) => setSearchInput(e.target.value)}
                                  placeholder="Search channel products..."
                                />
                              </form>
                            </div>
                          </div>
                          <div className="overflow-auto flex-1">
                            <ChannelProducts channelId={channel.id} />
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              </div>
            </TabsContent>

            <TabsContent value="matches" className="flex-1 overflow-auto h-full">
              <EmptyState type="matches" />
              <MatchList
                onMatchAction={handleMatchAction}
                showCreate={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default MatchesPage;
