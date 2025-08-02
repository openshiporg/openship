'use client';

import { useState } from 'react';
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

interface Match {
  id: string;
  name?: string;
  createdAt: string;
  updatedAt?: string;
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
}

export function MatchesListPageClient({
  list,
  matches,
  count,
  statusCounts,
  searchParams,
  shops = [],
  channels = [],
}: MatchesListPageClientProps) {
  const currentSearchParams = useSearchParams();
  const { toast } = useToast();
  const [selectedShopItems, setSelectedShopItems] = useState<SelectedLineItem[]>([]);
  const [selectedChannelItems, setSelectedChannelItems] = useState<SelectedCartItem[]>([]);
  const [showMatchDialog, setShowMatchDialog] = useState(false);

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
                        {count}
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
                      matches={matches}
                      onAcceptPriceChange={async (channelItemId: string, newPrice: string) => {
                        const { updateChannelItem } = await import('../actions/matches');
                        try {
                          const result = await updateChannelItem(channelItemId, { price: newPrice });
                          if (result.success) {
                            toast({
                              title: "Success",
                              description: "Price updated successfully",
                            });
                            window.location.reload();
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