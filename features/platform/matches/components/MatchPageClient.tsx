'use client';

import React, { useState } from 'react';
import {
  Loader2,
  MoreHorizontal,
  ChevronRight,
  ChevronsUpDown,
  AlertTriangle,
  Check,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeButton } from "@/components/ui/badge-button";
import { Separator } from "@/components/ui/separator";
import { EditItemDrawerClientWrapper } from "@/features/platform/components/EditItemDrawerClientWrapper";
import { Chevron } from 'react-day-picker';

interface ExternalDetails {
  title?: string;
  image?: string;
  price?: string;
  productLink?: string;
  inventory?: number | null;
  inventoryTracked?: boolean;
  error?: string;
}

interface ShopItem {
  id: string;
  quantity: number;
  productId: string;
  variantId: string;
  lineItemId?: string;
  externalDetails?: ExternalDetails;
  shop?: {
    id: string;
    name: string;
  };
}

interface ChannelItem {
  id: string;
  quantity: number;
  productId: string;
  variantId: string;
  lineItemId?: string;
  priceChanged?: number;
  externalDetails?: ExternalDetails;
  price?: string;
  channel?: {
    id: string;
    name: string;
  };
}

interface InventoryNeedsSync {
  syncEligible: boolean;
  sourceQuantity: number;
  targetQuantity: number;
}

interface Match {
  id: string;
  input: ShopItem[];
  output: ChannelItem[];
  createdAt: string;
  outputPriceChanged?: boolean;
  inventoryNeedsToBeSynced?: InventoryNeedsSync;
}

interface MatchPageClientProps {
  matches: Match[];
  onAcceptPriceChange?: (channelItemId: string, newPrice: string) => Promise<void>;
  onSyncInventory?: (match: Match) => Promise<void>;
  onEditMatch?: (matchId: string) => void;
  updateChannelItemLoading?: boolean;
  updateShopProductLoading?: boolean;
}

export function MatchPageClient({
  matches,
  onAcceptPriceChange,
  onSyncInventory,
  onEditMatch,
  updateChannelItemLoading = false,
  updateShopProductLoading = false,
}: MatchPageClientProps) {
  const [editDrawer, setEditDrawer] = useState<{
    listKey: string;
    itemId: string;
    open: boolean;
  }>({
    listKey: '',
    itemId: '',
    open: false,
  });

  const handleEditItem = (itemId: string, listKey: string) => {
    setEditDrawer({
      listKey,
      itemId,
      open: true,
    });
  };

  const handleCloseEditDrawer = () => {
    setEditDrawer(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <div className="divide-y border rounded-lg">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onAcceptPriceChange={onAcceptPriceChange}
            onSyncInventory={onSyncInventory}
            onEditMatch={onEditMatch}
            onEditItem={handleEditItem}
            updateChannelItemLoading={updateChannelItemLoading}
            updateShopProductLoading={updateShopProductLoading}
          />
        ))}
      </div>

      <EditItemDrawerClientWrapper
        listKey={editDrawer.listKey}
        itemId={editDrawer.itemId}
        open={editDrawer.open}
        onClose={handleCloseEditDrawer}
        onSave={(updatedItem) => {
          // TODO: Handle save if needed
          console.log('Item updated:', updatedItem);
          handleCloseEditDrawer();
        }}
      />
    </>
  );
}

const MatchCard = ({
  match,
  onAcceptPriceChange,
  onSyncInventory,
  onEditMatch,
  onEditItem,
  updateChannelItemLoading,
  updateShopProductLoading,
}: {
  match: Match;
  onAcceptPriceChange?: (channelItemId: string, newPrice: string) => Promise<void>;
  onSyncInventory?: (match: Match) => Promise<void>;
  onEditMatch?: (matchId: string) => void;
  onEditItem?: (itemId: string, listKey: string) => void;
  updateChannelItemLoading?: boolean;
  updateShopProductLoading?: boolean;
}) => {
  return (
    <div>
      <MatchHeader
        match={match}
        onEditMatch={onEditMatch}
        onEditItem={onEditItem}
        onSyncInventory={() => onSyncInventory?.(match)}
        updateShopProductLoading={updateShopProductLoading}
      >
        <Separator />
        <ProductDetailsCollapsible
          items={match.input}
          title="Shop Product"
          isShopProduct={true}
          onEditItem={onEditItem}
        />
        <Separator />
        <ProductDetailsCollapsible
          items={match.output}
          title="Channel Product"
          isShopProduct={false}
          onAcceptPriceChange={onAcceptPriceChange}
          updateChannelItemLoading={updateChannelItemLoading}
          onEditItem={onEditItem}
        />
      </MatchHeader>
    </div>
  );
};

const MatchHeader = ({
  match,
  children,
  defaultOpen = false,
  onEditMatch,
  onEditItem,
  onSyncInventory,
  updateShopProductLoading,
}: {
  match: Match;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onEditMatch?: (matchId: string) => void;
  onEditItem?: (itemId: string, listKey: string) => void;
  onSyncInventory?: () => void;
  updateShopProductLoading?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { inventoryNeedsToBeSynced } = match;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex gap-2 justify-between items-center p-3 bg-muted/30">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center rounded-sm shadow-sm uppercase tracking-wide border gap-2 pl-2.5 pr-1 py-[3px] text-sm font-medium text-zinc-500 bg-white border-zinc-200 hover:bg-zinc-100 hover:text-zinc-700 focus:ring-2 focus:ring-blue-700 focus:text-zinc-700 dark:bg-zinc-950 dark:border-zinc-900 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-700 dark:focus:ring-blue-500 dark:focus:text-white min-w-0 flex-shrink"
            title={match.id}
          >
            <span className="truncate">{match.id}</span>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          </button>
        </CollapsibleTrigger>
        <div className="flex gap-2 items-center flex-shrink-0">
          {inventoryNeedsToBeSynced?.syncEligible && (
            <InventorySyncButton
              syncEligible={true}
              sourceQuantity={inventoryNeedsToBeSynced.sourceQuantity}
              targetQuantity={inventoryNeedsToBeSynced.targetQuantity}
              onSyncInventory={onSyncInventory}
              isLoading={updateShopProductLoading}
            />
          )}

          {updateShopProductLoading && (
            <Loader2 className="mt-0.5 ml-2 animate-spin text-blue-600" />
          )}

          <Button
            variant="secondary"
            size="icon"
            className="border [&_svg]:size-3 h-6 w-6"
            onClick={() => onEditItem?.(match.id, 'matches')}
          >
            <MoreHorizontal />
          </Button>
        </div>
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
};

const InventorySyncButton = ({
  syncEligible,
  sourceQuantity,
  targetQuantity,
  onSyncInventory,
  isLoading,
}: {
  syncEligible: boolean;
  sourceQuantity: number;
  targetQuantity: number;
  onSyncInventory?: () => void;
  isLoading?: boolean;
}) => {
  if (!syncEligible) return null;

  if (sourceQuantity === targetQuantity) {
    return (
      <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded text-xs font-medium uppercase tracking-wide">
        <Check className="h-3 w-3" />
        <span>Inventory Synced</span>
      </div>
    );
  }

  return (
    <Badge color="red" className="flex flex-wrap gap-2 items-center border text-xs font-medium tracking-wide uppercase py-0.5 shadow-xs">
      <AlertTriangle className="h-3 w-3" />
      <span>Inventory Needs Sync</span>
      <Button
        variant="secondary"
        className="text-muted-foreground border bg-background -mr-1.5 h-5 text-[12px] flex items-center gap-1"
        onClick={onSyncInventory}
        disabled={isLoading}
      >
        <div className="flex items-center">
          {sourceQuantity}
          <ChevronRight className="size-3 inline" />
          {targetQuantity}
        </div>
      </Button>
    </Badge>
  );
};

const ProductDetailsCollapsible = ({
  items,
  title,
  isShopProduct,
  defaultOpen = true,
  onAcceptPriceChange,
  updateChannelItemLoading,
  onEditItem,
}: {
  items: (ShopItem | ChannelItem)[];
  title: string;
  isShopProduct: boolean;
  defaultOpen?: boolean;
  onAcceptPriceChange?: (channelItemId: string, newPrice: string) => Promise<void>;
  updateChannelItemLoading?: boolean;
  onEditItem?: (itemId: string, listKey: string) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`flex flex-col gap-2 p-3 ${
        isShopProduct
          ? "bg-green-50/40 dark:bg-emerald-900/20"
          : "bg-blue-50/30 dark:bg-indigo-900/10"
      }`}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={`flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium ${
            isShopProduct
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
          <div key={item.id + "-details-" + index}>
            {item.externalDetails?.error ? (
              <div className="border bg-background rounded-sm flex flex-col sm:flex-row overflow-hidden">
                <Badge className="m-2 py-2 rounded-sm border border-red-300 dark:border-red-800 bg-red-100 text-red-800">
                  <AlertTriangle className="my-auto size-8 p-2" />
                </Badge>
                <div className="grid p-2">
                  <div className="uppercase font-normal tracking-wide text-xs text-muted-foreground">
                    {(item as ShopItem).shop?.name || (item as ChannelItem).channel?.name}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.productId} | {item.variantId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    QTY: {item.quantity}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border p-2 bg-background rounded-sm flex justify-between gap-4">
                <div className="flex items-center gap-4">
                  {item.externalDetails?.image && (
                    <img
                      className="border rounded-sm h-12 w-12 object-cover"
                      src={item.externalDetails?.image}
                      alt={item.externalDetails?.title}
                    />
                  )}
                  <div className="grid">
                    <div className="uppercase font-normal tracking-wide text-xs text-muted-foreground">
                      {(item as ShopItem).shop?.name || (item as ChannelItem).channel?.name}
                    </div>
                    <a
                      href={item.externalDetails?.productLink}
                      target="_blank"
                      className="text-sm font-medium"
                    >
                      {item.externalDetails?.title ||
                        "Details could not be fetched"}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {item.productId} | {item.variantId}
                    </p>
                    {item.quantity > 1 ? (
                      <div className="flex gap-2 items-center">
                        <p className="text-sm dark:text-emerald-500 font-medium">
                          $
                          {(
                            parseFloat(item.externalDetails?.price || "0") *
                            item.quantity
                          ).toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          (${parseFloat(item.externalDetails?.price || "0").toFixed(2)}{" "}
                          x {item.quantity})
                          {(item as ChannelItem).price &&
                            (item as ChannelItem).price !== item.externalDetails?.price && (
                              <span className="ml-1">
                                (was ${parseFloat((item as ChannelItem).price || "0").toFixed(2)})
                              </span>
                            )}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm dark:text-emerald-500 font-medium">
                        ${parseFloat(item.externalDetails?.price || "0").toFixed(2)}
                        {(item as ChannelItem).price &&
                          (item as ChannelItem).price !== item.externalDetails?.price && (
                            <span className="ml-1 text-xs text-zinc-500">
                              (was ${parseFloat((item as ChannelItem).price || "0").toFixed(2)})
                            </span>
                          )}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      INVENTORY:{" "}
                      {item.externalDetails?.inventory !== null && item.externalDetails?.inventory !== undefined
                        ? item.externalDetails?.inventory >= 1e9
                          ? `${(item.externalDetails?.inventory / 1e9).toFixed(
                              1
                            )}B`
                          : item.externalDetails?.inventory >= 1e6
                          ? `${(item.externalDetails?.inventory / 1e6).toFixed(
                              1
                            )}M`
                          : item.externalDetails?.inventory >= 1e3
                          ? `${(item.externalDetails?.inventory / 1e3).toFixed(
                              1
                            )}k`
                          : item.externalDetails?.inventory.toString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-2 mt-2 sm:mt-0">
                  {!isShopProduct && (() => {
                    const channelItem = item as ChannelItem;
                    const currentPriceStr = String(channelItem.externalDetails?.price || '');
                    const savedPriceStr = String(channelItem.price || '');
                    const hasPriceChange = currentPriceStr !== savedPriceStr && currentPriceStr !== '' && savedPriceStr !== '';
                    
                    if (!hasPriceChange) return null;
                    
                    return (
                      <div>
                        <Badge className="flex flex-wrap gap-2 items-center border text-xs font-medium tracking-wide uppercase py-0.5 shadow-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                          <ArrowUp className="h-3 w-3" />
                          <span>
                            Price Changed: {savedPriceStr} → {currentPriceStr}
                          </span>
                          <Button
                            variant="secondary"
                            className="text-muted-foreground flex items-center border bg-background -mr-1.5 py-0 px-1.5 text-[.6rem]"
                            onClick={() =>
                              onAcceptPriceChange?.(
                                channelItem.id,
                                currentPriceStr
                              )
                            }
                            disabled={updateChannelItemLoading}
                          >
                            ACCEPT
                          </Button>
                        </Badge>
                      </div>
                    );
                  })()}

                  <div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="shadow-none border [&_svg]:size-3 h-6 w-6"
                      onClick={() => onEditItem?.(item.id, isShopProduct ? 'shop-items' : 'channel-items')}
                    >
                      <MoreHorizontal />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};