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
  ArrowUpDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/collapsible";
import { Button } from "@ui/button";
import { Badge, BadgeButton } from "@ui/badge";
import { Separator } from "@ui/separator";
import { useDrawer } from "@keystone/themes/Tailwind/orion/components/Modals/drawer-context";

export const MatchCard = ({
  match,
  onMatchAction,
  handleAcceptPriceChange,
  handleSyncInventory,
  updateChannelItemLoading,
  updateShopProductLoading,
  renderButtons,
}) => {
  const { openEditDrawer } = useDrawer();

  return (
    <div>
      <MatchHeader
        match={match}
        openEditDrawer={openEditDrawer}
        handleSyncInventory={() => handleSyncInventory(match)}
        updateShopProductLoading={updateShopProductLoading}
        renderButtons={renderButtons}
      >
        <Separator />
        <ProductDetailsCollapsible
          items={match.input}
          title="Shop Product"
          openEditDrawer={openEditDrawer}
        />
        <Separator />
        <ProductDetailsCollapsible
          items={match.output}
          title="Channel Product"
          openEditDrawer={openEditDrawer}
          onAcceptPriceChange={handleAcceptPriceChange}
          updateChannelItemLoading={updateChannelItemLoading}
        />
      </MatchHeader>
    </div>
  );
};

const MatchHeader = ({
  match,
  children,
  defaultOpen = false,
  isLoading = false,
  openEditDrawer,
  handleSyncInventory,
  updateShopProductLoading,
  renderButtons, // Add this prop
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { inventoryNeedsToBeSynced } = match;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-wrap gap-2 justify-between p-3 bg-muted/30">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-zinc-500 bg-white border-zinc-200 hover:bg-zinc-100 hover:text-zinc-700 focus:ring-2 focus:ring-blue-700 focus:text-zinc-700 dark:bg-zinc-950 dark:border-zinc-900 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-700 dark:focus:ring-blue-500 dark:focus:text-white"
          >
            {match.id}
            <ChevronRight className="h-4 w-4" />
          </button>
        </CollapsibleTrigger>
        <div className="flex gap-2 items-center">
          {inventoryNeedsToBeSynced?.syncEligible && (
            <InventorySyncButton
              syncEligible={true}
              sourceQuantity={inventoryNeedsToBeSynced.sourceQuantity}
              targetQuantity={inventoryNeedsToBeSynced.targetQuantity}
              onSyncInventory={handleSyncInventory}
              isLoading={updateShopProductLoading}
            />
          )}

          {isLoading && (
            <Loader2 className="mt-0.5 ml-2 animate-spin text-blue-600" />
          )}

          <Button
            variant="secondary"
            size="sm"
            className="p-1.5"
            onClick={() => openEditDrawer(match.id, "Match")}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
          {renderButtons && renderButtons()}
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
}) => {
  if (!syncEligible) return null;

  if (sourceQuantity === targetQuantity) {
    return (
      <BadgeButton
        color="emerald"
        className="flex gap-2 items-center border text-xs font-medium tracking-wide uppercase py-[.3rem]"
      >
        <Check className="h-3 w-3" />
        <span>Inventory Synced</span>
      </BadgeButton>
    );
  }

  return (
    <Badge
      color="red"
      className="flex flex-wrap gap-2 items-center border text-xs font-medium tracking-wide uppercase py-0.5 shadow-xs"
    >
      <AlertTriangle className="h-3 w-3" />
      <span>Inventory Needs Sync</span>
      <Button
        variant="secondary"
        className="text-muted-foreground border bg-background -mr-1.5 py-0.5 px-1.5 text-xs"
        onClick={onSyncInventory}
        disabled={isLoading}
        isLoading={isLoading}
      >
        <div className="flex items-center">
          {sourceQuantity}
          <ArrowRight className="h-3 w-3 mx-1 inline" />
          {targetQuantity}
        </div>
      </Button>
    </Badge>
  );
};

const ProductDetailsCollapsible = ({
  items,
  title,
  defaultOpen = true,
  openEditDrawer,
  onAcceptPriceChange,
  updateChannelItemLoading,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const isShopProduct = title === "Shop Product";

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
            {item.externalDetails.error ? (
              <div className="border bg-background rounded-sm flex flex-col sm:flex-row overflow-hidden">
                <Badge
                  color="red"
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
                            parseFloat(item.externalDetails?.price) *
                            item.quantity
                          ).toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          (${parseFloat(item.externalDetails?.price).toFixed(2)}{" "}
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
                        ${parseFloat(item.externalDetails?.price).toFixed(2)}
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
                      {item.externalDetails?.inventory !== null
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
                  {!isShopProduct && item.priceChanged !== 0 && (
                    <div>
                      <Badge
                        color={item.priceChanged > 0 ? "red" : "green"}
                        className="flex flex-wrap gap-2 items-center border text-xs font-medium tracking-wide uppercase py-0.5 shadow-xs"
                      >
                        {item.priceChanged > 0 ? (
                          <>
                            <ArrowUp className="h-3 w-3" />
                            <span>
                              Price Went Up $
                              {Math.abs(item.priceChanged).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-3 w-3" />
                            <span>
                              Price Went Down $
                              {Math.abs(item.priceChanged).toFixed(2)}
                            </span>
                          </>
                        )}
                        <Button
                          variant="secondary"
                          className="text-muted-foreground flex items-center border bg-background -mr-1.5 py-0 px-1.5 text-[.6rem]"
                          onClick={() =>
                            onAcceptPriceChange(
                              item.id,
                              item.externalDetails.price
                            )
                          }
                          disabled={updateChannelItemLoading}
                          isLoading={updateChannelItemLoading}
                        >
                          ACCEPT
                        </Button>
                      </Badge>
                    </div>
                  )}

                  <div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="p-1"
                      onClick={() =>
                        openEditDrawer(
                          item.id,
                          isShopProduct ? "ShopItem" : "ChannelItem"
                        )
                      }
                    >
                      <MoreHorizontal className="h-3 w-3" />
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
