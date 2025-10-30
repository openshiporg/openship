'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CirclePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformFilterBar } from '@/features/platform/components/PlatformFilterBar';
import { MatchPageClient } from '../components/MatchPageClient';
import { LineItemSelect } from '../../orders/components/LineItemSelect';
import { CartItemSelect } from '../../orders/components/CartItemSelect';
import { MatchDetailsDrawer } from '../components/MatchDetailsDrawer';
import { useToast } from "@/components/ui/use-toast";
import { useListItemsQuery } from '../../../dashboard/hooks/useListItems.query';
import { buildOrderByClause } from '../../../dashboard/lib/buildOrderByClause';
import { buildWhereClause } from '../../../dashboard/lib/buildWhereClause';

interface Match {
  id: string;
  name?: string;
  createdAt: string;
  updatedAt?: string;
  input: any[];
  output: any[];
  [key: string]: any;
}

interface Shop {
  id: string;
  name: string;
  domain?: string;
}

interface Channel {
  id: string;
  name: string;
}

interface SelectedLineItem {
  quantity: number;
  productId: string;
  variantId: string;
  shop: {
    id: string;
    name: string;
  };
  price?: string;
  title?: string;
  image?: string;
}

interface SelectedCartItem {
  quantity: number;
  productId: string;
  variantId: string;
  price: string;
  channel: {
    id: string;
    name: string;
  };
  title?: string;
  image?: string;
}

interface MatchesListPageClientProps {
  list: any;
  matches: Match[];
  count: number;
  statusCounts: {
    matches: number;
    shop: number;
    channel: number;
  };
  searchParams: { [key: string]: string | string[] | undefined };
  shops?: Shop[];
  channels?: Channel[];
  initialData?: { items: any[], count: number };
  initialError?: string | null;
}

export function MatchesListPageClient({
  list,
  matches,
  count,
  statusCounts,
  searchParams,
  shops = [],
  channels = [],
  initialData,
  initialError,
}: MatchesListPageClientProps) {
  const urlSearchParams = useSearchParams();
  const { toast } = useToast();
  const [selectedShopItems, setSelectedShopItems] = useState<SelectedLineItem[]>([]);
  const [selectedChannelItems, setSelectedChannelItems] = useState<SelectedCartItem[]>([]);
  const [showMatchDialog, setShowMatchDialog] = useState(false);

  // Extract current search params (reactive to URL changes)
  const currentSearchParams = useMemo(() => {
    const params: Record<string, string> = {}
    urlSearchParams?.forEach((value, key) => {
      params[key] = value
    })
    return params
  }, [urlSearchParams])

  const currentPage = parseInt(currentSearchParams.page || '1', 10) || 1
  const pageSize = parseInt(currentSearchParams.pageSize || list.pageSize?.toString() || '50', 10)
  const searchString = currentSearchParams.search || ''

  // Build query variables from current search params
  const variables = useMemo(() => {
    const orderBy = buildOrderByClause(list, currentSearchParams)
    const filterWhere = buildWhereClause(list, currentSearchParams)
    const searchParameters = searchString ? { search: searchString } : {}
    const searchWhere = buildWhereClause(list, searchParameters)

    // Combine search and filters
    const whereConditions = []
    if (Object.keys(searchWhere).length > 0) {
      whereConditions.push(searchWhere)
    }
    if (Object.keys(filterWhere).length > 0) {
      whereConditions.push(filterWhere)
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {}

    return {
      where,
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      orderBy
    }
  }, [list, currentSearchParams, currentPage, pageSize, searchString])

  // For matches, use raw GraphQL string to include relationship fields (from working action)
  const querySelectedFields = `
    id
    outputPriceChanged
    inventoryNeedsToBeSynced {
      syncEligible
      sourceQuantity
      targetQuantity
      syncNeeded
    }
    input {
      id
      productId
      variantId
      lineItemId
      quantity
      externalDetails {
        image
        title
        productId
        variantId
        price
        availableForSale
        productLink
        inventory
        inventoryTracked
        error
      }
      shop {
        id
        name
        domain
      }
    }
    output {
      id
      productId
      variantId
      lineItemId
      quantity
      price
      priceChanged
      externalDetails {
        image
        title
        productId
        variantId
        price
        availableForSale
        productLink
        inventory
        inventoryTracked
        error
      }
      channel {
        id
        name
        domain
      }
    }
    user {
      id
      name
      email
    }
    createdAt
    updatedAt
  `

  // Use React Query hook with server-side initial data
  // Use React Query hook with server-side initial data
  const { data: queryData, error: queryError, isLoading, isFetching } = useListItemsQuery(
    {
      listKey: list.key,
      variables,
      selectedFields: querySelectedFields
    },
    {
      initialData: initialError ? undefined : (initialData || { items: matches, count }),
    }
  )

  // Use query data, fallback to initial data or matches prop
  const data = queryData || initialData || { items: matches, count }
  const error = queryError ? queryError.message : initialError

  const hasSelectedItems = selectedShopItems.length > 0 || selectedChannelItems.length > 0;

  return (
    <section
      aria-label="Matches overview"
      className="overflow-hidden flex flex-col"
    >
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
          },
          {
            type: "page",
            label: "Matches",
          },
        ]}
      />

      <div className="flex flex-col flex-1 min-h-0">
        <div className="border-gray-200 dark:border-gray-800">
          <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  Matches
                </h1>
                <p className="text-muted-foreground">
                  <span>Create and manage your product matches</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="px-4 md:px-6">
            <Tabs defaultValue="matches" className="w-full">
              <div className="flex items-center justify-between mb-3">
                <ScrollArea>
                  <TabsList className="bg-background h-auto -space-x-px p-0 shadow-xs rtl:space-x-reverse">
                    <TabsTrigger 
                      value="matches" 
                      className="data-[state=active]:bg-muted data-[state=active]:after:bg-primary relative overflow-hidden rounded-none border h-10 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e"
                    >
                      Matches
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-background border border-border rounded-md">
                        {data.count}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="shop" 
                      className="data-[state=active]:bg-muted data-[state=active]:after:bg-primary relative overflow-hidden rounded-none border h-10 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e"
                    >
                      Shop Products
                      {selectedShopItems.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-background border border-border rounded-md">
                          {selectedShopItems.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="channel" 
                      className="data-[state=active]:bg-muted data-[state=active]:after:bg-primary relative overflow-hidden rounded-none border h-10 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e"
                    >
                      Channel Products
                      {selectedChannelItems.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-background border border-border rounded-md">
                          {selectedChannelItems.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
                
                {/* Create Match Button - Right Side */}
                {hasSelectedItems && (
                  <div className="ml-4">
                    <button
                      onClick={() => setShowMatchDialog(true)}
                      className={cn(
                        buttonVariants({ size: "icon" }),
                        "lg:px-4 lg:py-2 lg:w-auto rounded-lg"
                      )}
                    >
                      <CirclePlus />
                      <span className="hidden lg:inline">Create Match</span>
                    </button>
                  </div>
                )}
              </div>
              <TabsContent value="matches" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <div>
                  <PlatformFilterBar
                    list={{
                      key: list.key,
                      path: list.path,
                      label: list.label,
                      singular: list.singular,
                      plural: list.plural,
                      description: list.description || undefined,
                      labelField: list.labelField as string,
                      initialColumns: list.initialColumns,
                      groups: list.groups as unknown as string[],
                      graphql: {
                        plural: list.plural,
                        singular: list.singular
                      },
                      fields: list.fields
                    }}
                  />
                </div>
                
                <div className="flex flex-col h-full">
                  <div>
                    <MatchPageClient
                      matches={data.items}
                      onAcceptPriceChange={async (channelItemId: string, newPrice: string) => {
                        const { updateChannelItem } = await import('../actions/matches');
                        try {
                          const result = await updateChannelItem(channelItemId, { price: newPrice });
                          if (result.success) {
                            toast({
                              title: "Success",
                              description: "Price updated successfully",
                            });
                            // The updateChannelItem action already revalidates the matches path
                          } else {
                            toast({
                              title: "Error",
                              description: result.error || "Failed to update price",
                              variant: "destructive",
                            });
                          }
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "An error occurred while updating price",
                            variant: "destructive",
                          });
                        }
                      }}
                      onSyncInventory={async (match) => {
                        const { syncInventory } = await import('../actions/matches');
                        try {
                          const result = await syncInventory([match.id]);
                          if (result.success) {
                            toast({
                              title: "Success",
                              description: "Inventory synced successfully",
                            });
                          } else {
                            toast({
                              title: "Error",
                              description: result.error || "Failed to sync inventory",
                              variant: "destructive",
                            });
                          }
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "An error occurred while syncing inventory",
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shop" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <LineItemSelect
                  shops={shops}
                  selectedItems={selectedShopItems}
                  onSelectionChange={setSelectedShopItems}
                />
              </TabsContent>

              <TabsContent value="channel" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <CartItemSelect
                  channels={channels}
                  selectedItems={selectedChannelItems}
                  onSelectionChange={setSelectedChannelItems}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <MatchDetailsDrawer
        open={showMatchDialog}
        onClose={() => setShowMatchDialog(false)}
        shops={shops}
        channels={channels}
        initialLineItems={selectedShopItems}
        initialCartItems={selectedChannelItems}
        onMatchCreated={() => {
          setSelectedShopItems([]);
          setSelectedChannelItems([]);
          setShowMatchDialog(false);
        }}
      />
    </section>
  );
}