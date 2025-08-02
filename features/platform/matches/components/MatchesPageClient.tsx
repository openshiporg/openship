"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusTabs } from "./StatusTabs";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchShopProducts, searchChannelProducts } from "../actions/matches";

// Inline useDebounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Match {
  id: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

interface Shop {
  id: string;
  name: string;
  domain?: string;
}

interface Channel {
  id: string;
  name: string;
  domain?: string;
}

interface Product {
  image?: string;
  title: string;
  productId: string;
  variantId: string;
  price: string;
  availableForSale: boolean;
  inventory?: number;
  inventoryTracked: boolean;
  productLink?: string;
  cursor?: string;
}

interface MatchesPageClientProps {
  matches: Match[];
  shops: Shop[];
  channels: Channel[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  list: any;
}

const statusCounts = {
  all: 0,
  matches: 0,
  shop: 0,
  channel: 0,
};

export const MatchesPageClient: React.FC<MatchesPageClientProps> = ({
  matches,
  shops,
  channels,
  totalCount,
  currentPage,
  pageSize,
  list
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState("");
  const [selectedShopId, setSelectedShopId] = useState<string>(shops[0]?.id || "");
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || "");
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [channelProducts, setChannelProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  const debouncedSearchTerm = useDebounce(searchInput, 300);

  // Update status counts
  statusCounts.all = totalCount;
  statusCounts.matches = matches.length;
  statusCounts.shop = shops.length;
  statusCounts.channel = channels.length;

  const currentTab = searchParams.get("!type_matches") || "matches";

  const handleTabChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") {
      params.delete("!type_matches");
    } else {
      params.set("!type_matches", `[{"field":"type","value":"${status}"}]`);
    }
    params.set("page", "1");
    router.push(`/dashboard/platform/matches?${params.toString()}`);
  };

  const handleSearch = async () => {
    if (!debouncedSearchTerm) return;
    
    setIsSearching(true);
    startTransition(async () => {
      try {
        if (currentTab === "shop" && selectedShopId) {
          const response = await searchShopProducts(selectedShopId, debouncedSearchTerm);
          if (response.success) {
            setShopProducts(response.data?.searchShopProducts?.products || []);
          }
        } else if (currentTab === "channel" && selectedChannelId) {
          const response = await searchChannelProducts(selectedChannelId, debouncedSearchTerm);
          if (response.success) {
            setChannelProducts(response.data?.searchChannelProducts?.products || []);
          }
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    });
  };

  React.useEffect(() => {
    if (debouncedSearchTerm && (currentTab === "shop" || currentTab === "channel")) {
      handleSearch();
    }
  }, [debouncedSearchTerm, currentTab, selectedShopId, selectedChannelId]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMatches(new Set(matches.map(match => match.id)));
    } else {
      setSelectedMatches(new Set());
    }
  };

  const handleSelectMatch = (matchId: string, checked: boolean) => {
    const newSelected = new Set(selectedMatches);
    if (checked) {
      newSelected.add(matchId);
    } else {
      newSelected.delete(matchId);
    }
    setSelectedMatches(newSelected);
  };

  const EmptyState = ({ type }: { type: string }) => {
    const content = {
      matches: {
        title: "No matches found",
        description: "Create matches to synchronize products between shops and channels"
      },
      shop: {
        title: "Search shop products",
        description: "Select a shop and search for products to create matches"
      },
      channel: {
        title: "Search channel products", 
        description: "Select a channel and search for products to create matches"
      }
    };

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="mt-2 font-medium text-foreground">
          {content[type as keyof typeof content].title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {content[type as keyof typeof content].description}
        </p>
      </div>
    );
  };

  const renderProducts = (products: Product[], type: 'shop' | 'channel') => (
    <div className="grid gap-4">
      {products.map((product) => (
        <Card key={`${product.productId}-${product.variantId}`}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {product.image && (
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <CardTitle className="text-sm">{product.title}</CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    ID: {product.productId} | Variant: {product.variantId}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{product.price}</div>
                <Badge variant={product.availableForSale ? "default" : "secondary"}>
                  {product.availableForSale ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {product.inventoryTracked && (
              <div className="text-sm text-muted-foreground">
                Inventory: {product.inventory || 0}
              </div>
            )}
            <Button size="sm" className="mt-2">
              Create Match
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Matches</h1>
          <p className="text-muted-foreground">
            Manage matches across shops and channels
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Match
        </Button>
      </div>

      {/* Status Tabs */}
      <StatusTabs 
        statusCounts={statusCounts}
        currentStatus={currentTab}
        onStatusChange={handleTabChange}
        selectedCount={selectedMatches.size}
        onSelectAll={handleSelectAll}
        showSelectAll={currentTab === "matches"}
      />

      {/* Search for products */}
      {(currentTab === "shop" || currentTab === "channel") && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <select 
                value={currentTab === "shop" ? selectedShopId : selectedChannelId}
                onChange={(e) => currentTab === "shop" ? setSelectedShopId(e.target.value) : setSelectedChannelId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {(currentTab === "shop" ? shops : channels).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${currentTab} products...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {currentTab === "matches" && (
          matches.length === 0 ? (
            <EmptyState type="matches" />
          ) : (
            <div className="grid gap-4">
              {matches.map((match) => (
                <Card key={match.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedMatches.has(match.id)}
                        onCheckedChange={(checked) => handleSelectMatch(match.id, checked as boolean)}
                      />
                      <CardTitle className="text-sm flex items-center gap-1 min-w-0" title={`Match ${match.id}`}>Match <span className="truncate">{match.id}</span></CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(match.createdAt).toLocaleDateString()}
                    </div>
                    {match.updatedAt && (
                      <div className="text-sm text-muted-foreground">
                        Updated: {new Date(match.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {currentTab === "shop" && (
          isSearching || isPending ? (
            <div className="text-center p-8">Searching products...</div>
          ) : shopProducts.length === 0 ? (
            <EmptyState type="shop" />
          ) : (
            renderProducts(shopProducts, "shop")
          )
        )}

        {currentTab === "channel" && (
          isSearching || isPending ? (
            <div className="text-center p-8">Searching products...</div>
          ) : channelProducts.length === 0 ? (
            <EmptyState type="channel" />
          ) : (
            renderProducts(channelProducts, "channel")
          )
        )}
      </div>
    </div>
  );
};