"use client";

import React, { useState } from "react";

// Helper function to safely format price - handles text prices that may not be numeric
function formatPrice(price: string | number | undefined, currency: string = '$'): string {
  if (!price) return 'N/A';
  
  // If it's already a formatted price string (contains currency symbols), return as-is
  if (typeof price === 'string' && /[$€£¥₹]/.test(price)) {
    return price;
  }
  
  // Try to parse as number for formatting
  const numericPrice = parseFloat(String(price));
  if (isNaN(numericPrice)) {
    return String(price); // Return the original string if it can't be parsed
  }
  
  // Format currency properly - if it's a currency code like "USD", show it as "USD $26.00"
  // if it's already a symbol like "$", show it as "$26.00"
  if (currency && currency.length === 3 && /^[A-Z]+$/.test(currency)) {
    return `${currency} $${numericPrice.toFixed(2)}`;
  }
  
  return `${currency}${numericPrice.toFixed(2)}`;
}

function calculateTotal(price: string | number | undefined, quantity: number, currency: string = '$'): string {
  if (!price || !quantity) return 'N/A';
  
  const numericPrice = parseFloat(String(price));
  if (isNaN(numericPrice)) {
    return `${String(price)} × ${quantity}`; // Show multiplication if price isn't numeric
  }
  
  // Format currency properly - if it's a currency code like "USD", show it as "USD $26.00"
  // if it's already a symbol like "$", show it as "$26.00"
  if (currency && currency.length === 3 && /^[A-Z]+$/.test(currency)) {
    return `${currency} $${(numericPrice * quantity).toFixed(2)}`;
  }
  
  return `${currency}${(numericPrice * quantity).toFixed(2)}`;
}
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  MoreVertical,
  PenSquare,
  Loader2,
  FilePenLine,
  GitCompareArrows,
  BoltIcon,
  Square,
  Save,
  Ticket,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { ProductDetailsCollapsible } from "./ProductDetailsCollapsible";
import { ChannelSearchAccordion } from './ChannelSearchAccordion';
import { ArrowRight } from "lucide-react";
import { EditItemDrawerClientWrapper } from "@/features/platform/components/EditItemDrawerClientWrapper";
import { useToast } from '@/components/ui/use-toast';
import { Order } from "../lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface OrderDetailsComponentProps {
  order: Order;
  channels: any[];
  loadingActions?: Record<string, Record<string, boolean>>;
  removeEditItemButton?: boolean;
  renderButtons?: () => React.ReactNode;
  onAction: (action: string, orderId: string, data?: any) => void;
  isSelected: boolean;
  onSelectItem: (itemId: string, checked: boolean) => void;
}

export const OrderDetailsComponent = ({
  order,
  channels,
  loadingActions = {},
  removeEditItemButton,
  renderButtons,
  onAction,
  isSelected,
  onSelectItem,
}: OrderDetailsComponentProps) => {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const { toast } = useToast();
  const currentAction = Object.entries(loadingActions).find(
    ([_, value]) => value[order.id]
  )?.[0];

  const getLoadingText = (action: string) => {
    switch (action) {
      case "getMatch":
        return "Getting Match";
      case "saveMatch":
        return "Saving Match";
      case "placeOrder":
        return "Placing Order";
      case "deleteOrder":
        return "Deleting Order";
      case "matchOrder":
        return "Matching Order";
      case "addToCart":
        return "Adding to Cart";
      default:
        return "Loading";
    }
  };

  const handleAddToCart = async (product: any, channelId: string, orderId: string) => {
    onAction('addToCart', orderId, { ...product, name: product.title, channelId });
  };

  const handleMatchOrder = async () => {
    onAction('matchOrder', order.id);
  };

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={order.id} className="border-0">
          <div className="px-4 md:px-6 py-3 md:py-4 flex items-start justify-between w-full border-b relative min-h-[120px]">
            <div className="flex items-start gap-4">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectItem(order.id, !!checked)}
                className="mt-1"
              />
              <div className="flex flex-col items-start text-left gap-2 sm:gap-1.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <Link
                    href={`/dashboard/platform/orders/${order.id}`}
                    className="uppercase font-medium text-sm hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {order.orderName || order.orderId}
                  </Link>
                  <span className="text-xs font-medium">
                    <span className="text-muted-foreground/75">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {order.user && (
                      <>
                        <span className="mx-1.5">‧</span>
                        <Link
                          href={`/dashboard/platform/users/${order.user.id}`}
                          className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 group inline-flex items-center gap-1"
                        >
                          {order.user.name || order.user.email}
                          <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                        </Link>
                      </>
                    )}
                  </span>
                </div>

                {(order.firstName || order.lastName || order.streetAddress1) && (
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    <p>
                      {order.firstName} {order.lastName}
                    </p>
                    {order.streetAddress1 && <p>{order.streetAddress1}</p>}
                    {order.streetAddress2 && <p>{order.streetAddress2}</p>}
                    <p>
                      {order.city}, {order.state} {order.zip}
                    </p>
                    {order.phone && <p>{order.phone}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={order.status as any} />
              {currentAction && (
                <Badge
                  className="uppercase tracking-wide font-medium text-xs flex items-center gap-1.5 border py-0.5"
                >
                  <Loader2 className="size-3.5 shrink-0 animate-spin" />
                  {getLoadingText(currentAction)}
                </Badge>
              )}
              {!removeEditItemButton && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="border [&_svg]:size-3 h-6 w-6"
                    >
                      <MoreVertical className="stroke-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onAction("getMatch", order.id)}>
                      <Square
                        size={16}
                        className="opacity-60 mr-2"
                        aria-hidden="true"
                      />
                      GET MATCH
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction("saveMatch", order.id)}>
                      <Save
                        size={16}
                        className="opacity-60 mr-2"
                        aria-hidden="true"
                      />
                      SAVE MATCH
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction("placeOrder", order.id)}>
                      <Ticket
                        size={16}
                        className="opacity-60 mr-2"
                        aria-hidden="true"
                      />
                      PLACE ORDER
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsEditDrawerOpen(true)}>
                      <FilePenLine
                        size={16}
                        className="opacity-60 mr-2"
                        aria-hidden="true"
                      />
                      EDIT ORDER
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete order ${order.orderName || order.orderId}? This action cannot be undone.`)) {
                          onAction("deleteOrder", order.id);
                        }
                      }}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                    >
                      <Trash2
                        size={16}
                        className="opacity-60 mr-2"
                        aria-hidden="true"
                      />
                      DELETE ORDER
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                variant="secondary"
                size="icon"
                className="border [&_svg]:size-3 h-6 w-6"
                asChild
              >
                <AccordionTrigger className="py-0" />
              </Button>
              {renderButtons && renderButtons()}
            </div>
          </div>
          <AccordionContent className="pb-0">
            <div className="divide-y">
              <ProductDetailsCollapsible
                orderId={order.id}
                title="Line Item"
                totalItems={order.lineItems?.length || 0}
                lineItems={(order.lineItems || []).map((item: any) => ({
                  id: item.id,
                  title: item.name,
                  quantity: item.quantity || 1,
                  sku: item.sku,
                  thumbnail: item.image,
                  formattedUnitPrice: formatPrice(item.price, order.currency || '$'),
                  formattedTotal: calculateTotal(item.price, item.quantity, order.currency || '$'),
                  variantData: {
                    sku: item.sku,
                    productId: item.productId,
                    variantId: item.variantId
                  }
                }))}
              />
              <ProductDetailsCollapsible
                orderId={order.id}
                title="Cart Item"
                totalItems={order.cartItems?.length || 0}
                isCartItem={true}
                lineItems={(order.cartItems || []).map((item: any) => ({
                  id: item.id,
                  title: item.name,
                  quantity: item.quantity || 1,
                  sku: item.sku,
                  thumbnail: item.image,
                  formattedUnitPrice: formatPrice(item.price, order.currency || '$'),
                  formattedTotal: calculateTotal(item.price, item.quantity, order.currency || '$'),
                  purchaseId: item.purchaseId,
                  error: item.error,
                  channel: item.channel,
                  variantData: {
                    sku: item.sku,
                    productId: item.productId,
                    variantId: item.variantId
                  }
                }))}
              />
              <ChannelSearchAccordion
                channels={channels}
                onAddItem={handleAddToCart}
                orderId={order.id}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="orders"
        itemId={order.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />
    </>
  );
};