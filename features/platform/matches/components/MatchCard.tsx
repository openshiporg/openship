'use client';

import React, { useState } from "react";
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
import { Separator } from "@/components/ui/separator";

interface ExternalDetails {
  image?: string;
  title?: string;
  productId?: string;
  variantId?: string;
  price?: string;
  availableForSale?: boolean;
  productLink?: string;
  inventory?: number;
  inventoryTracked?: boolean;
  error?: string;
}

interface ShopOrChannel {
  id: string;
  name: string;
  domain?: string;
}

interface MatchItem {
  id: string;
  productId: string;
  variantId: string;
  lineItemId?: string;
  quantity: number;
  price?: string;
  priceChanged?: number;
  externalDetails?: ExternalDetails;
  shop?: ShopOrChannel;
  channel?: ShopOrChannel;
}

interface InventorySync {
  syncEligible?: boolean;
  sourceQuantity?: number;
  targetQuantity?: number;
}

interface Match {
  id: string;
  outputPriceChanged?: string;
  inventoryNeedsToBeSynced?: InventorySync;
  input?: MatchItem[];
  output?: MatchItem[];
  user?: any;
  createdAt: string;
  updatedAt?: string;
}

interface MatchCardProps {
  match: Match;
  onMatchAction?: (action: string, matchId: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onMatchAction,
}) => {
  const handleSyncInventory = () => {
    if (onMatchAction) {
      onMatchAction('sync', match.id);
    }
  };

  const handleAcceptPriceChange = (itemId: string, newPrice: string) => {
    if (onMatchAction) {
      onMatchAction('acceptPriceChange', itemId);
    }
  };

  return (
    <div>
      <MatchHeader
        match={match}
        handleSyncInventory={handleSyncInventory}
        onMatchAction={onMatchAction}
      >
        <Separator />
        <ProductDetailsCollapsible
          items={match.input || []}
          title="Shop Product"
          isShopProduct={true}
        />
        <Separator />
        <ProductDetailsCollapsible
          items={match.output || []}
          title="Channel Product"
          isShopProduct={false}
          onAcceptPriceChange={handleAcceptPriceChange}
        />
      </MatchHeader>
    </div>
  );
};

const MatchHeader: React.FC<{
  match: Match;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isLoading?: boolean;
  handleSyncInventory: () => void;
  onMatchAction?: (action: string, matchId: string) => void;
}> = ({
  match,
  children,
  defaultOpen = false,
  isLoading = false,
  handleSyncInventory,
  onMatchAction,
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
              sourceQuantity={inventoryNeedsToBeSynced.sourceQuantity || 0}
              targetQuantity={inventoryNeedsToBeSynced.targetQuantity || 0}
              onSyncInventory={handleSyncInventory}
              isLoading={isLoading}
            />
          )}

          {isLoading && (
            <Loader2 className="mt-0.5 ml-2 animate-spin text-blue-600" />
          )}

          <Button
            variant="secondary"
            size="icon"
            className="border [&_svg]:size-3 h-6 w-6"
            onClick={() => {
              if (onMatchAction) {
                onMatchAction('edit', match.id);
              }
            }}
          >
            <MoreHorizontal />
          </Button>
        </div>
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
};

const InventorySyncButton: React.FC<{
  syncEligible: boolean;
  sourceQuantity: number;
  targetQuantity: number;
  onSyncInventory: () => void;
  isLoading: boolean;
}> = ({
  syncEligible,
  sourceQuantity,
  targetQuantity,
  onSyncInventory,
  isLoading,
}) => {
  if (!syncEligible) return null;

  if (sourceQuantity === targetQuantity) {
    return (
      <Badge
        variant="secondary"
        className="flex gap-2 items-center border text-xs font-medium tracking-wide uppercase py-0.5 shadow-xs bg-emerald-100 text-emerald-800 border-emerald-200"
      >
        <Check className="h-3 w-3" />
        <span>Inventory Synced</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="destructive"
      className="flex flex-wrap gap-2 items-center border text-xs font-medium tracking-wide uppercase py-0.5 shadow-xs"
    >
      <AlertTriangle className="h-3 w-3" />
      <span>Inventory Needs Sync</span>
      <Button
        variant="secondary"
        className="text-muted-foreground border bg-background -mr-1.5 py-0.5 px-1.5 text-xs"
        onClick={onSyncInventory}
        disabled={isLoading}
      >
        <div className="flex items-center">
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              {sourceQuantity}
              <ArrowRight className="h-3 w-3 mx-1 inline" />
              {targetQuantity}
            </>
          )}
        </div>
      </Button>
    </Badge>
  );
};

const ProductDetailsCollapsible: React.FC<{
  items: MatchItem[];
  title: string;
  isShopProduct: boolean;
  defaultOpen?: boolean;
  onAcceptPriceChange?: (itemId: string, newPrice: string) => void;
}> = ({
  items,
  title,
  isShopProduct,
  defaultOpen = true,
  onAcceptPriceChange,
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
                <Badge
                  variant="destructive"
                  className="m-2 py-2 rounded-sm border border-red-300 dark:border-red-800"
                >
                  <AlertTriangle className="my-auto size-8 p-2" />
                </Badge>
                <div className="grid p-2">
                  <div className="uppercase font-normal tracking-wide text-xs text-muted-foreground">
                    {item.shop?.name || item.channel?.name}
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
                      {item.shop?.name || item.channel?.name}
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
                            parseFloat(item.externalDetails?.price || '0') *
                            item.quantity
                          ).toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          (${parseFloat(item.externalDetails?.price || '0').toFixed(2)}{" "}
                          x {item.quantity})
                          {item.price &&
                            item.price !== item.externalDetails?.price && (
                              <span className="ml-1">
                                (was ${parseFloat(item.price).toFixed(2)})
                              </span>
                            )}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm dark:text-emerald-500 font-medium">
                        ${parseFloat(item.externalDetails?.price || '0').toFixed(2)}
                        {item.price &&
                          item.price !== item.externalDetails?.price && (
                            <span className="ml-1 text-xs text-zinc-500">
                              (was ${parseFloat(item.price).toFixed(2)})
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
                    const currentPriceStr = String(item.externalDetails?.price || '');
                    const savedPriceStr = String(item.price || '');
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
                              onAcceptPriceChange && onAcceptPriceChange(
                                item.id,
                                currentPriceStr
                              )
                            }
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
                      onClick={() => {
                        console.log('Edit item:', item.id);
                      }}
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