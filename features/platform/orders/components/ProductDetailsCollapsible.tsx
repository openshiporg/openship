"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  ChevronsUpDown,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { ItemPagination } from "./ItemPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateLineItemQuantity, deleteLineItem } from "../actions/line-items";
import {
  updateCartItemQuantity,
  deleteCartItem,
  clearCartItemError,
} from "../actions/cart-items";
import { updateMatchPrice } from "../actions/update-match-price";
import { useToast } from "@/components/ui/use-toast";
import { parseErrorString, ErrorType, extractPriceChangeDetails } from "../utils/error-codes";
import { EditItemDrawerClientWrapper } from "@/features/platform/components/EditItemDrawerClientWrapper";

interface LineItem {
  id: string;
  title: string;
  quantity: number;
  sku?: string;
  thumbnail?: string;
  formattedUnitPrice?: string;
  formattedTotal?: string;
  variantData?: any;
  productData?: any;
  purchaseId?: string;
  url?: string;
  error?: string;
  channel?: {
    id: string;
    name: string;
  };
}

interface ProductDetailsCollapsibleProps {
  orderId: string;
  title: string;
  defaultOpen?: boolean;
  totalItems: number;
  lineItems: LineItem[];
  isCartItem?: boolean;
}

export const ProductDetailsCollapsible = ({
  orderId,
  title,
  defaultOpen = true,
  totalItems,
  lineItems,
  isCartItem = false,
}: ProductDetailsCollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const itemsPerPage = 5;

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = lineItems.slice(startIndex, endIndex);

  const getQuantity = (item: LineItem) => {
    return quantities[item.id] ?? item.quantity;
  };

  const setQuantity = (itemId: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(1, quantity) }));
  };

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const handleQuantityUpdate = async (item: LineItem, newQuantity: number) => {
    if (newQuantity === item.quantity) return;

    setLoading((prev) => ({ ...prev, [item.id]: true }));
    try {
      const response = isCartItem
        ? await updateCartItemQuantity(item.id, newQuantity)
        : await updateLineItemQuantity(item.id, newQuantity);

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: `${
          isCartItem ? "Cart item" : "Line item"
        } quantity updated`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      // Reset quantity on error
      setQuantity(item.id, item.quantity);
    } finally {
      setLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleDelete = async (item: LineItem) => {
    setLoading((prev) => ({ ...prev, [item.id]: true }));
    try {
      const response = isCartItem
        ? await deleteCartItem(item.id)
        : await deleteLineItem(item.id);

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: `${isCartItem ? "Cart item" : "Line item"} deleted`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleClearError = async (item: LineItem) => {
    if (!isCartItem || !item.error) return;

    setLoading((prev) => ({ ...prev, [item.id]: true }));
    try {
      const response = await clearCartItemError(item.id);

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: "Error cleared",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleUpdateMatchPrice = async (item: LineItem) => {
    if (!isCartItem || !item.error) return;

    setLoading((prev) => ({ ...prev, [item.id]: true }));
    try {
      const response = await updateMatchPrice(item.id, item.error);

      if (!response.success) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: "Match price updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const triggerClassName =
    "flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-blue-500 bg-white border-blue-200 hover:bg-blue-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:text-white";

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="flex flex-col gap-2 py-3 px-4 md:px-6 bg-blue-50/30 dark:bg-indigo-900/10 border-b"
      >
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <button type="button" className={triggerClassName}>
              {totalItems} {title}
              {totalItems !== 1 && "s"}
              <ChevronsUpDown className="h-4 w-4" />
            </button>
          </CollapsibleTrigger>
          {isOpen && totalItems > 5 && (
            <ItemPagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
        <CollapsibleContent className="space-y-2">
          {isOpen && (
            <>
              {totalItems > 5 && (
                <div className="text-xs text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
                  {totalItems} items
                </div>
              )}
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="border p-2 bg-background rounded-sm flex flex-col sm:flex-row gap-4 relative"
                >
                  <div className="flex-shrink-0">
                    {item.thumbnail && !imageErrors[item.id] ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        width={48}
                        height={48}
                        className="size-12 rounded-lg object-cover"
                        onError={() => handleImageError(item.id)}
                      />
                    ) : (
                      <div className="border rounded-lg h-12 w-12 bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">IMG</span>
                      </div>
                    )}
                  </div>
                  <div className="grid flex-grow">
                    {/* Channel name for cart items */}
                    {isCartItem && item.channel && (
                      <div className="uppercase font-medium tracking-wide text-xs text-muted-foreground mb-1">
                        {item.channel.name}
                      </div>
                    )}
                    <span className="text-sm font-medium">{item.title}</span>
                    <div className="text-xs text-muted-foreground">
                      {item.sku
                        ? `SKU: ${item.sku}`
                        : item.variantData?.sku
                        ? `SKU: ${item.variantData.sku}`
                        : ""}
                      {item.variantData?.barcode && (
                        <> | Barcode: {item.variantData.barcode}</>
                      )}
                      {/* Product/Variant ID for both line items and cart items */}
                      {item.variantData && (
                        <>
                          {(item.sku || item.variantData?.sku || item.variantData?.barcode) && <> | </>}
                          {item.variantData.productId} | {item.variantData.variantId}
                        </>
                      )}
                    </div>

                    {/* Error display removed - now shown in tooltip */}

                    <div className="flex flex-col gap-2">
                      {/* Quantity display */}
                      <p className="text-xs font-medium">
                        Quantity: {isCartItem && !item.purchaseId ? getQuantity(item) : item.quantity}
                      </p>

                      <div className="flex flex-col gap-2">
                        <div className={`text-xs ${isCartItem ? 'text-emerald-600 dark:text-emerald-500 font-medium' : ''}`}>
                          {item.formattedTotal || ""}
                          {item.quantity > 1 && item.formattedUnitPrice && (
                            <span className="text-muted-foreground ml-1">
                              ({item.formattedUnitPrice} × {item.quantity})
                            </span>
                          )}
                        </div>
                        
                        {/* Quantity controls for cart items - below price */}
                        {isCartItem && !item.purchaseId && (
                          <div className="flex items-center gap-2">
                            <div className="relative inline-flex h-7 w-20 items-center overflow-hidden rounded-md border border-input text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                              <Input
                                className="bg-background text-foreground flex-1 px-2 py-1 tabular-nums text-xs border-0 shadow-none focus-visible:ring-0 h-full [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                type="number"
                                min="1"
                                value={getQuantity(item)}
                                onChange={(e) => {
                                  const newQuantity = parseInt(e.target.value) || 1;
                                  setQuantity(item.id, newQuantity);
                                }}
                                onBlur={() => handleQuantityUpdate(item, getQuantity(item))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleQuantityUpdate(item, getQuantity(item));
                                  }
                                }}
                                disabled={loading[item.id]}
                              />
                              <div className="flex h-[calc(100%+2px)] flex-col">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="border-input bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground -me-px flex h-1/2 w-5 flex-1 items-center justify-center border-l text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 rounded-none p-0"
                                  onClick={() => {
                                    const newQuantity = getQuantity(item) + 1;
                                    setQuantity(item.id, newQuantity);
                                    handleQuantityUpdate(item, newQuantity);
                                  }}
                                  disabled={loading[item.id]}
                                >
                                  <ChevronUp size={10} aria-hidden="true" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="border-input bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground -me-px -mt-px flex h-1/2 w-5 flex-1 items-center justify-center border-l border-t text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 rounded-none p-0"
                                  onClick={() => {
                                    const newQuantity = getQuantity(item) - 1;
                                    if (newQuantity >= 1) {
                                      setQuantity(item.id, newQuantity);
                                      handleQuantityUpdate(item, newQuantity);
                                    }
                                  }}
                                  disabled={loading[item.id] || getQuantity(item) <= 1}
                                >
                                  <ChevronDown size={10} aria-hidden="true" />
                                </Button>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleDelete(item)}
                              disabled={loading[item.id]}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons - Updated to match original Openship structure */}
                  <div className="flex flex-wrap sm:flex-col justify-between sm:items-end gap-2">
                    {/* Error badges and edit button */}
                    <div className="flex flex-wrap items-center gap-2">
                      {loading[item.id] && (
                        <div className="flex items-center justify-center w-6 h-6">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}

                      {/* Error warning button for cart items with errors */}
                    {isCartItem && item.error && (() => {
                      const errorInfo = parseErrorString(item.error);
                      const priceDetails = extractPriceChangeDetails(item.error);
                      
                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              disabled={loading[item.id]}
                            >
                              {loading[item.id] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent side="left" className="max-w-sm">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium text-xs">{errorInfo.title}</p>
                                {priceDetails && errorInfo.type === ErrorType.PRICE_CHANGE ? (
                                  <p className="text-xs opacity-90 mt-1">
                                    Price changed: {priceDetails.oldPrice} → {priceDetails.newPrice}
                                  </p>
                                ) : (
                                  <p className="text-xs opacity-90 mt-1">
                                    {errorInfo.message}
                                  </p>
                                )}
                                <div className="flex gap-1 mt-3">
                                  {errorInfo.actions.map((action) => (
                                    <Button
                                      key={action.type}
                                      variant={action.variant || "outline"}
                                      size="sm"
                                      onClick={() => {
                                        if (action.type === 'dismiss') {
                                          handleClearError(item);
                                        } else if (action.type === 'update_price') {
                                          handleUpdateMatchPrice(item);
                                        }
                                        // Add more action handlers as needed
                                      }}
                                      disabled={loading[item.id]}
                                      className="text-xs px-2 py-1 h-auto"
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    })()}

                      {/* Edit dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            disabled={loading[item.id]}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => setEditingItemId(item.id)}
                          >
                            Edit {isCartItem ? "Cart Item" : "Line Item"}
                          </DropdownMenuItem>
                          {!isCartItem && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(item)}
                              className="text-red-600"
                            >
                              Delete Line Item
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Purchase ID button - separate div at bottom like original Openship */}
                    {isCartItem && item.purchaseId && (
                      <div>
                        <Button
                          className="text-xs h-6 px-2"
                          onClick={() => {
                            if (item.url) {
                              window.open(item.url, "_blank");
                            } else {
                              // If no URL, could show a message or do nothing
                              console.log('Purchase ID:', item.purchaseId, 'but no URL available');
                            }
                          }}
                        >
                          {item.purchaseId}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {editingItemId && (
        <EditItemDrawerClientWrapper
          listKey={isCartItem ? "cart-items" : "line-items"}
          itemId={editingItemId}
          open={!!editingItemId}
          onClose={() => setEditingItemId(null)}
        />
      )}
    </>
  );
};
