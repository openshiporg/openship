import React, { useState, useEffect } from "react";
import { BadgeButton } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  X,
} from "lucide-react";

export const LineItemField = ({
  title,
  name,
  image,
  price,
  quantity,
  productId,
  variantId,
  index,
  onRemove,
  onQuantityChange,
}) => {
  const [localQuantity, setLocalQuantity] = useState(quantity.toString());

  const handleQuantityInputChange = (e) => {
    setLocalQuantity(e.target.value);
  };

  const handleQuantityUpdate = () => {
    const newQuantity = Math.max(1, parseInt(localQuantity) || 1);
    onQuantityChange(newQuantity);
    setLocalQuantity(newQuantity.toString());
  };

  const handleQuantityBlur = () => {
    handleQuantityUpdate();
  };

  const handleQuantityKeyDown = (e) => {
    if (e.key === "Enter") {
      handleQuantityUpdate();
    }
  };

  useEffect(() => {
    setLocalQuantity(quantity.toString());
  }, [quantity]);

  return (
    <div className="border flex items-center space-x-2 p-2 bg-muted/40 rounded-md">
      <div className="border w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover rounded-md"
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title || name}</div>
        <div className="text-xs text-gray-500">
          {productId} | {variantId}
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-sm font-semibold text-green-600">
            ${(price * quantity).toFixed(2)}
            {quantity > 1 && (
              <span className="font-normal text-muted-foreground ml-2">
                (${price} x {quantity})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <BadgeButton
              size="sm"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="px-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </BadgeButton>

            <input
              className="mx-1 border rounded-md text-zinc-800 focus:ring-0 dark:text-zinc-100 text-center appearance-none"
              style={{
                width: `${Math.max(2, quantity.toString().length * 0.75)}em`,
              }}
              type="text"
              value={localQuantity}
              onChange={handleQuantityInputChange}
              onBlur={handleQuantityBlur}
              onKeyDown={handleQuantityKeyDown}
            />
            <BadgeButton
              size="sm"
              onClick={() => onQuantityChange(quantity + 1)}
              className="px-1"
            >
              <ChevronRight className="h-4 w-4" />
            </BadgeButton>
            <BadgeButton
              size="sm"
              color="red"
              onClick={onRemove}
              className="px-1"
            >
              <X className="h-4 w-4" />
            </BadgeButton>
          </div>
        </div>
      </div>
    </div>
  );
};