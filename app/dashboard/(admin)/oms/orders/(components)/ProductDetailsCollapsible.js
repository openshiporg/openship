// components/ProductDetailsCollapsible.js
import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/collapsible";
import {
  Badge,
  BadgeButton,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
import { Button } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/button";
import {
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react";
import { RiLoader2Fill } from "@remixicon/react";

export const ProductDetailsCollapsible = ({
  items,
  title,
  defaultOpen = true,
  openEditDrawer,
  removeEditItemButton,
  updateItem,
  deleteItem,
  updateLoading,
  deleteLoading,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isCartItem = title === "Cart Item";

  const handleQuantityChange = (item, newQuantity) => {
    updateItem(item.id, { quantity: newQuantity });
  };

  const handleDeleteItem = (item) => {
    deleteItem(item.id);
  };

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
          {items.length !== 1 && "s"}
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {items.map((item, index) => (
          <div key={item.lineItemId + "-details-" + index}>
            <div className="border p-2 bg-background rounded-sm flex items-center gap-4 relative">
              {item.purchaseId && (
                <div className="absolute top-1.5 right-1.5 text-xs text-muted-foreground">
                  {item.purchaseId}
                </div>
              )}
              <img
                className="border rounded-sm h-12 w-12 object-cover"
                src={item.image}
                alt={item.name}
              />
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
              </div>
              <div className="flex items-center gap-2 self-end">
                {isCartItem && !item.purchaseId && (
                  <>
                    <div className="flex items-center space-x-1">
                      {(updateLoading || deleteLoading) && (
                        <RiLoader2Fill
                          className="size-4 shrink-0 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      <BadgeButton
                        onClick={() =>
                          handleQuantityChange(
                            item,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        className="border px-1"
                        disabled={updateLoading}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </BadgeButton>
                      <input
                        className="mx-1 border rounded-md text-zinc-800 focus:ring-0 dark:text-zinc-100 text-center appearance-none"
                        style={{
                          width: `${Math.max(
                            2,
                            item.quantity.toString().length * 0.75
                          )}em`,
                        }}
                        type="text"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          handleQuantityChange(item, newQuantity);
                        }}
                        onBlur={() => {
                          const newQuantity = Math.max(1, item.quantity);
                          handleQuantityChange(item, newQuantity);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const newQuantity = Math.max(1, item.quantity);
                            handleQuantityChange(item, newQuantity);
                          }
                        }}
                      />
                      <BadgeButton
                        onClick={() =>
                          handleQuantityChange(item, item.quantity + 1)
                        }
                        className="border px-1"
                        disabled={deleteLoading}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </BadgeButton>
                    </div>
                    <BadgeButton
                      onClick={() => handleDeleteItem(item)}
                      color="red"
                      className="border px-1"
                    >
                      <X className="h-3 w-3" />
                    </BadgeButton>
                  </>
                )}
                {isCartItem && item.url && (
                  <Button
                    className="text-xs h-6 px-2"
                    onClick={() => window.open(item.url, "_blank")}
                  >
                    ORDER <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
                {!removeEditItemButton && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="p-1"
                    onClick={() =>
                      openEditDrawer(
                        item.id,
                        isCartItem ? "CartItem" : "LineItem"
                      )
                    }
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            {item.error && (
              <div className="flex items-center mt-1">
                <Badge color="red" className="text-xs mr-2">
                  Error: {item.error}
                </Badge>
                <BadgeButton
                  color="red"
                  onClick={() => onClearError(item.id)}
                  className="border p-1"
                  disabled={updateLoading}
                >
                  <X className="h-3 w-3" />
                </BadgeButton>
              </div>
            )}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};
