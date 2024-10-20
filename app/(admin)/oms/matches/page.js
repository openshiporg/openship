"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, gql, useApolloClient } from "@apollo/client";
import { Input } from "@ui/input";
import { Button } from "@ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/tabs";
import { Badge, BadgeButton } from "@ui/badge";
import { Search, ArrowUpDown } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@ui/drawer";
import { MultiSelect } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/multi-select";
import { SyncInventoryDialog } from "./(components)/SyncInventoryDialog";
import { MatchList } from "./(components)/MatchList";
import { ShowMatchesButton } from "./(components)/ShowMatchesButton";
import { MatchDetailsDialog } from "./(components)/MatchDetailsDialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/breadcrumb";
import { cn } from "@keystone/utils/cn";
import { buttonVariants } from "@ui/button";
import { ChevronRight } from "lucide-react";
import {
  CircleStackIcon,
  Square2StackIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/16/solid";
import { AdminLink } from "@keystone/themes/Tailwind/atlas/components/AdminLink";

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

const MatchesPage = () => {
  const [searchString, setSearchString] = useState("");
  const [selectedTab, setSelectedTab] = useState("shop");
  const [selectedShopIds, setSelectedShopIds] = useState([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortField, setSortField] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");

  const { data: shopsData } = useQuery(ALL_SHOPS_QUERY);
  const { data: channelsData } = useQuery(ALL_CHANNELS_QUERY);

  const [syncInventory] = useMutation(SYNC_INVENTORY);
  const client = useApolloClient();

  // Use useEffect to set all shops and channels as selected when data is loaded
  useEffect(() => {
    if (shopsData?.shops) {
      setSelectedShopIds(shopsData.shops.map((shop) => shop.id));
    }
  }, [shopsData]);

  useEffect(() => {
    if (channelsData?.channels) {
      setSelectedChannelIds(channelsData.channels.map((channel) => channel.id));
    }
  }, [channelsData]);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setSearchString(e.target.value);
    }
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortProducts = (products) => {
    return [...products].sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const renderProductList = (products) => {
    const sortedProducts = sortProducts(products);
    return sortedProducts.map((product) => (
      <div
        key={`${product.productId}-${product.variantId}`}
        className="first:mt-2 mt-0 border flex flex-wrap lg:flex-nowrap p-2 bg-background rounded-md"
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

  const ShopSummary = ({ shopId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const shop = shopsData?.shops.find((s) => s.id === shopId);

    const { data: shopProductsData, loading: shopProductsLoading } = useQuery(
      SEARCH_SHOP_PRODUCTS,
      {
        variables: { shopId, searchEntry: searchString },
        skip: !isOpen,
      }
    );

    const handleToggle = () => {
      setIsOpen(!isOpen);
    };

    return (
      <details open={isOpen} className="p-4 border rounded-lg bg-muted group">
        <summary
          onClick={(e) => {
            e.preventDefault();
            handleToggle();
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
              <text className="relative text-lg/5 font-medium">
                {shop?.name}
              </text>
            </div>
          </div>
        </summary>
        {isOpen && (
          <div className="ml-8 max-h-[60vh] overflow-y-auto flex flex-col gap-2">
            {shopProductsLoading ? (
              <div>Loading...</div>
            ) : shopProductsData?.searchShopProducts?.length > 0 ? (
              renderProductList(shopProductsData.searchShopProducts)
            ) : (
              <div>
                <Badge
                  className="mt-2 border text-[.7rem] py-0.5 uppercase tracking-wide font-medium"
                  color="red"
                >
                  No Products Found
                </Badge>
              </div>
            )}
          </div>
        )}
      </details>
    );
  };

  const ChannelSummary = ({ channelId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const channel = channelsData?.channels.find((c) => c.id === channelId);

    const { data: channelProductsData, loading: channelProductsLoading } =
      useQuery(SEARCH_CHANNEL_PRODUCTS, {
        variables: { channelId, searchEntry: searchString },
        skip: !isOpen,
      });

    const handleToggle = () => {
      setIsOpen(!isOpen);
    };

    return (
      <details open={isOpen} className="p-4 border rounded-lg bg-muted group">
        <summary
          onClick={(e) => {
            e.preventDefault();
            handleToggle();
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
              <text className="relative text-lg/5 font-medium">
                {channel?.name}
              </text>
            </div>
          </div>
        </summary>
        {isOpen && (
          <div className="ml-8 max-h-[60vh] overflow-y-auto flex flex-col gap-2">
            {channelProductsLoading ? (
              <div>Loading...</div>
            ) : channelProductsData?.searchChannelProducts?.length > 0 ? (
              renderProductList(channelProductsData.searchChannelProducts)
            ) : (
              <div>
                <Badge
                  className="mt-2 border text-[.7rem] py-0.5 uppercase tracking-wide font-medium"
                  color="red"
                >
                  No Products Found
                </Badge>
              </div>
            )}
          </div>
        )}
      </details>
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

  return (
    <main>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink>
              <AdminLink href="/">Dashboard</AdminLink>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>OMS</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Matches</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row mb-4 gap-2 justify-between">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">Matches</h1>
          <p className="text-muted-foreground">
            Manage matches across shops and channels
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SyncInventoryDialog />
          <MatchDetailsDialog />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList
          variant="solid"
          className="border w-auto shadow-inner flex-wrap"
        >
          <TabsTrigger
            value="shop"
            className="border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm flex gap-2 items-center"
          >
            <Square3Stack3DIcon className="w-3.5 h-3.5" />
            Shop Products
          </TabsTrigger>
          <TabsTrigger
            value="channel"
            className="border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm flex gap-2 items-center"
          >
            <CircleStackIcon className="w-3.5 h-3.5" />
            Channel Products
          </TabsTrigger>
          <TabsTrigger
            value="matches"
            className="border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm flex gap-2 items-center"
          >
            <Square2StackIcon className="w-4 h-4" />
            Matches
          </TabsTrigger>
        </TabsList>
        <TabsContent value="shop">
          <div className="flex items-center space-x-2 mb-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                className="pl-10"
                placeholder="Search products..."
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
              />
            </div>
          </div>
          <MultiSelect
            options={
              shopsData?.shops.map((shop) => ({
                label: shop.name,
                value: shop.id,
              })) || []
            }
            onValueChange={setSelectedShopIds}
            defaultValue={selectedShopIds}
            placeholder={
              <Badge
                color="sky"
                className="uppercase tracking-wide border mr-1 flex items-center gap-2 text-[.825rem] py-0.5 px-2 font-medium"
              >
                Select shop...
              </Badge>
            }
            className="text-base mb-4 bg-background"
          />

          <div className="space-y-4">
            {selectedShopIds.map((shopId) => (
              <ShopSummary key={shopId} shopId={shopId} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="channel">
          <div className="flex items-center space-x-2 mb-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                className="pl-10 shadow-none"
                placeholder="Search products..."
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
              />
            </div>
          </div>
          <MultiSelect
            options={
              channelsData?.channels.map((channel) => ({
                label: channel.name,
                value: channel.id,
              })) || []
            }
            onValueChange={setSelectedChannelIds}
            defaultValue={selectedChannelIds}
            placeholder={
              <Badge
                color="sky"
                className="uppercase tracking-wide border mr-1 flex items-center gap-2 text-[.825rem] py-0.5 px-2 font-medium"
              >
                Select channel...
              </Badge>
            }
            className="text-base mb-4"
          />

          <div className="space-y-4">
            {selectedChannelIds.map((channelId) => (
              <ChannelSummary key={channelId} channelId={channelId} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="matches">
          <MatchList onMatchAction={handleMatchAction} />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default MatchesPage;
