import React, { useState } from "react";
import {
  useDeleteItem,
  useUpdateItem,
} from "@keystone/themes/Tailwind/orion/components/EditItemDrawer";
import {
  Badge,
  BadgeButton,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/badge";
import { Button } from "@keystone/themes/Tailwind/orion/primitives/default/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { RiLoader2Fill } from "@remixicon/react";

export const CartItem = ({
  item,
  isCartItem,
  openEditDrawer,
  removeEditItemButton,
}) => {
  const { handleDelete, deleteLoading } = useDeleteItem(
    isCartItem ? "CartItem" : "LineItem"
  );
  const { handleUpdate, updateLoading } = useUpdateItem(
    isCartItem ? "CartItem" : "LineItem"
  );
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = async (newQuantity) => {
    setQuantity(newQuantity);
    await handleUpdate(item.id, { quantity: newQuantity });
  };

  const handleDeleteItem = async () => {
    await handleDelete(item.id);
  };

  const handleAcceptError = async () => {
    await handleUpdate(item.id, {
      error: "",
    });
  };

  return (
    <div className="border p-2 bg-background rounded-sm flex flex-col sm:flex-row gap-4">
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
        {quantity > 1 ? (
          <div className="flex gap-2 items-center">
            <p className="text-sm dark:text-emerald-500 font-medium">
              ${(parseFloat(item.price) * quantity).toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">
              (${parseFloat(item.price).toFixed(2)} x {quantity})
            </p>
          </div>
        ) : (
          <p className="text-sm dark:text-emerald-500 font-medium">
            ${parseFloat(item.price).toFixed(2)}
          </p>
        )}
      </div>
      <div className="flex flex-wrap sm:flex-col justify-between sm:items-end gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {item.error && (
            <Badge
              color="red"
              className="flex gap-1 items-center justify-between border text-xs font-medium tracking-wide uppercase py-0.5 shadow-xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-grow">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Error: {item.error}</span>
              </div>
              <Button
                variant="secondary"
                className="text-muted-foreground flex items-center border bg-background py-0 px-1.5 text-[.6rem] self-end -mr-1.5"
                onClick={handleAcceptError}
                disabled={updateLoading}
                isLoading={updateLoading}
              >
                ACCEPT
              </Button>
            </Badge>
          )}
          {!removeEditItemButton && (
            <Button
              variant="secondary"
              size="sm"
              className="p-1"
              onClick={() =>
                openEditDrawer(item.id, isCartItem ? "CartItem" : "LineItem")
              }
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          )}
        </div>
        {isCartItem && !item.purchaseId && (
          <div className="flex items-center gap-1">
            <div className="flex items-center space-x-1">
              {(updateLoading || deleteLoading) && (
                <RiLoader2Fill
                  className="size-4 shrink-0 animate-spin"
                  aria-hidden="true"
                />
              )}
              <BadgeButton
                onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                className="border px-1"
                disabled={updateLoading}
              >
                <ChevronLeft className="h-3 w-3" />
              </BadgeButton>
              <input
                className="mx-1 border rounded-md text-zinc-800 focus:ring-0 dark:text-zinc-100 text-center appearance-none"
                style={{
                  width: `${Math.max(2, quantity.toString().length * 0.75)}em`,
                }}
                type="text"
                value={quantity}
                onChange={(e) => {
                  const newQuantity = parseInt(e.target.value) || 1;
                  handleQuantityChange(newQuantity);
                }}
                onBlur={() => {
                  const newQuantity = Math.max(1, quantity);
                  handleQuantityChange(newQuantity);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const newQuantity = Math.max(1, quantity);
                    handleQuantityChange(newQuantity);
                  }
                }}
              />
              <BadgeButton
                onClick={() => handleQuantityChange(quantity + 1)}
                className="border px-1"
                disabled={updateLoading}
              >
                <ChevronRight className="h-3 w-3" />
              </BadgeButton>
            </div>
            <BadgeButton
              onClick={handleDeleteItem}
              color="red"
              className="border px-1"
              disabled={deleteLoading}
            >
              <X className="h-3 w-3" />
            </BadgeButton>
          </div>
        )}

        {isCartItem && item.url && (
          <div>
            <Button
              className="text-xs h-6 px-2"
              onClick={() => window.open(item.url, "_blank")}
            >
              {item.purchaseId ? item.purchaseId : "Order"}{" "}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
