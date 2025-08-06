'use client';

import React, { useState, useMemo, useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Package,
  User,
  MapPin,
  ShoppingCart,
  ShoppingBag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createOrderFromShopOrder, type ShopOrderData } from "@/features/platform/orders/actions/create-from-shop-order";
import { LineItemSelect } from "@/features/platform/orders/components/LineItemSelect";
import { CartItemSelect } from "@/features/platform/orders/components/CartItemSelect";

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
  sku?: string;
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
  sku?: string;
}

const ORDER_SECTIONS = [
  {
    id: 1,
    key: "orderDetails",
    label: "Order Details",
    description: "Basic order information and pricing",
    icon: <Package className="h-5 w-5" />,
    fields: [
      "orderId",
      "orderName", 
      "currency",
      "totalPrice",
      "subTotalPrice",
      "totalDiscounts",
      "totalTax",
    ],
  },
  {
    id: 2,
    key: "customerInfo",
    label: "Customer Info",
    description: "Customer contact details",
    icon: <User className="h-5 w-5" />,
    fields: ["email", "firstName", "lastName", "phone"],
  },
  {
    id: 3,
    key: "shippingAddress", 
    label: "Shipping Address",
    description: "Delivery location information",
    icon: <MapPin className="h-5 w-5" />,
    fields: [
      "streetAddress1",
      "streetAddress2",
      "city",
      "state",
      "zip",
      "country",
    ],
  },
  {
    id: 4,
    key: "lineItems",
    label: "Shop Products",
    description: "Products from connected shops",
    icon: <ShoppingBag className="h-5 w-5" />,
    fields: ["lineItems"],
  },
  {
    id: 5,
    key: "cartItems",
    label: "Channel Products",
    description: "Products from connected channels",
    icon: <ShoppingCart className="h-5 w-5" />,
    fields: ["cartItems"],
  },
  {
    id: 6,
    key: "orderActions",
    label: "Order Actions",
    description: "Configure order processing behavior",
    icon: <Package className="h-5 w-5" />,
    fields: ["linkOrder", "matchOrder", "processOrder"],
  },
];

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  shopId: string;
  onOrderCreated?: (order: any) => void;
  shops?: any[];
  channels?: any[];
}

export function OrderDetailsDialog({ 
  isOpen, 
  onClose, 
  order, 
  shopId,
  onOrderCreated,
  shops = [],
  channels = [] 
}: OrderDetailsDialogProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [selectedLineItems, setSelectedLineItems] = useState<SelectedLineItem[]>([]);
  const [selectedCartItems, setSelectedCartItems] = useState<SelectedCartItem[]>([]);
  const [formData, setFormData] = useState({
    orderId: "",
    orderName: "",
    email: "",
    firstName: "",
    lastName: "",
    streetAddress1: "",
    streetAddress2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
    currency: "",
    totalPrice: "",
    subTotalPrice: "",
    totalDiscounts: "",
    totalTax: "",
    linkOrder: true,
    matchOrder: true,
    processOrder: true,
  });

  useEffect(() => {
    if (order && isOpen) {
      setFormData({
        orderId: order.orderId || "",
        orderName: order.orderName || "",
        email: order.email || "",
        firstName: order.firstName || "",
        lastName: order.lastName || "",
        streetAddress1: order.streetAddress1 || "",
        streetAddress2: order.streetAddress2 || "",
        city: order.city || "",
        state: order.state || "",
        zip: order.zip || "",
        country: order.country || "",
        phone: order.phone || "",
        currency: order.currency || "",
        totalPrice: order.totalPrice || "",
        subTotalPrice: order.subTotalPrice || "",
        totalDiscounts: order.totalDiscounts || "",
        totalTax: order.totalTax || "",
        linkOrder: order.linkOrder ?? true,
        matchOrder: order.matchOrder ?? true,
        processOrder: order.processOrder ?? true,
      });

      // Convert existing line items to SelectedLineItem format
      if (order.lineItems) {
        const convertedLineItems: SelectedLineItem[] = order.lineItems.map((item: any) => ({
          quantity: item.quantity || 1,
          productId: item.productId || "",
          variantId: item.variantId || "",
          shop: {
            id: shopId,
            name: "Shop" // Keep simple to avoid dependency issues
          },
          price: item.price || "0",
          title: item.name || item.title || "",
          image: item.image || "",
        }));
        setSelectedLineItems(convertedLineItems);
      }

      // Convert existing cart items to SelectedCartItem format
      if (order.cartItems) {
        const convertedCartItems: SelectedCartItem[] = order.cartItems.map((item: any) => ({
          quantity: item.quantity || 1,
          productId: item.productId || "",
          variantId: item.variantId || "",
          price: item.price || "0",
          channel: {
            id: item.channel?.id || "",
            name: item.channel?.name || "Channel"
          },
          title: item.name || item.title || "",
          image: item.image || "",
        }));
        setSelectedCartItems(convertedCartItems);
      }
    }
  }, [order, isOpen, shopId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsCreating(true);
    try {
      // Convert selected items back to the format expected by createOrderFromShopOrder
      const lineItems = selectedLineItems.map(item => ({
        name: item.title || `Product ${item.productId}`,
        productId: item.productId,
        variantId: item.variantId,
        price: item.price || "0",
        quantity: item.quantity,
        image: item.image,
        sku: item.sku || "", // Include SKU for parity with webhook
      }));

      const cartItems = selectedCartItems.map(item => ({
        name: item.title || `Product ${item.productId}`,
        productId: item.productId,
        variantId: item.variantId,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        sku: item.sku || "", // Include SKU for parity with webhook
        channel: {
          id: item.channel.id,
          name: item.channel.name,
        },
      }));

      const shopOrderData: ShopOrderData = {
        orderId: formData.orderId,
        orderName: formData.orderName,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        streetAddress1: formData.streetAddress1,
        streetAddress2: formData.streetAddress2,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        phone: formData.phone,
        currency: order?.currency || formData.currency || "USD", // Use order currency or default to USD
        totalPrice: formData.totalPrice || order?.totalPrice,
        subTotalPrice: formData.subTotalPrice || order?.subTotalPrice || formData.totalPrice,
        totalDiscounts: formData.totalDiscounts || order?.totalDiscounts || "0",
        totalTax: formData.totalTax || order?.totalTax || "0",
        date: order?.date || new Date().toISOString(),
        lineItems,
        cartItems,
        shop: { id: shopId },
        linkOrder: formData.linkOrder,
        matchOrder: formData.matchOrder,
        processOrder: formData.processOrder
      };

      const result = await createOrderFromShopOrder(shopOrderData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Order created successfully",
        });
        if (onOrderCreated) {
          onOrderCreated(result.data);
        }
        onClose();
      } else {
        throw new Error(result.error || "Failed to create order");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const renderField = (field: string) => {
    const value = formData[field as keyof typeof formData];
    
    switch (field) {
      case "lineItems":
        return (
            <LineItemSelect
              selectedItems={selectedLineItems}
              onSelectionChange={setSelectedLineItems}
              shops={shops}
            />
        );
      
      case "cartItems":
        return (
            <CartItemSelect
              selectedItems={selectedCartItems}
              onSelectionChange={setSelectedCartItems}
              channels={channels}
            />
        );

      case "linkOrder": {
        const linkOrderId = useId();
        return (
          <div className="relative flex w-full items-start gap-2 rounded-md border-0 ring-1 ring-border p-4 shadow-xs outline-none">
            <Checkbox
              id={linkOrderId}
              className="order-1 after:absolute after:inset-0"
              checked={formData.linkOrder}
              onCheckedChange={(checked) => handleInputChange("linkOrder", checked as boolean)}
              aria-describedby={`${linkOrderId}-description`}
            />
            <div className="grid grow gap-2">
              <Label htmlFor={linkOrderId}>
                Link Order
              </Label>
              <p id={`${linkOrderId}-description`} className="text-muted-foreground text-xs">
                Automatically link this order to matching channels based on shop configuration
              </p>
            </div>
          </div>
        );
      }

      case "matchOrder": {
        const matchOrderId = useId();
        return (
          <div className="relative flex w-full items-start gap-2 rounded-md border-0 ring-1 ring-border p-4 shadow-xs outline-none">
            <Checkbox
              id={matchOrderId}
              className="order-1 after:absolute after:inset-0"
              checked={formData.matchOrder}
              onCheckedChange={(checked) => handleInputChange("matchOrder", checked as boolean)}
              aria-describedby={`${matchOrderId}-description`}
            />
            <div className="grid grow gap-2">
              <Label htmlFor={matchOrderId}>
                Match Order
              </Label>
              <p id={`${matchOrderId}-description`} className="text-muted-foreground text-xs">
                Get product matches from available channels for this order's line items
              </p>
            </div>
          </div>
        );
      }

      case "processOrder": {
        const processOrderId = useId();
        return (
          <div className="relative flex w-full items-start gap-2 rounded-md border-0 ring-1 ring-border p-4 shadow-xs outline-none">
            <Checkbox
              id={processOrderId}
              className="order-1 after:absolute after:inset-0"
              checked={formData.processOrder}
              onCheckedChange={(checked) => handleInputChange("processOrder", checked as boolean)}
              aria-describedby={`${processOrderId}-description`}
            />
            <div className="grid grow gap-2">
              <Label htmlFor={processOrderId}>
                Process Order
              </Label>
              <p id={`${processOrderId}-description`} className="text-muted-foreground text-xs">
                Automatically place the order on connected channels after matching
              </p>
            </div>
          </div>
        );
      }
      
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={field}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
            </Label>
            <Input
              id={field}
              value={value as string}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={`Enter ${field}`}
            />
          </div>
        );
    }
  };

  const OrderSectionRenderer = () => {
    const currentSectionData = ORDER_SECTIONS.find(section => section.id === currentSection);
    
    if (!currentSectionData) return null;

    return (
      <div className="space-y-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
            {currentSectionData.label}
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentSectionData.description}
          </p>
        </div>
        
        <div className="space-y-4">
          {currentSectionData.fields.map((field) => (
            <div key={field}>
              {renderField(field)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-4xl gap-0 max-w-[95vw]">
        <DialogHeader className="border-b px-6 py-4 mb-0">
          <DialogTitle>Create Order</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col-reverse md:flex-row">
          <div className="flex flex-col justify-between md:w-80 md:border-r">
            <div className="flex-1 grow">
              <div className="border-t p-6 md:border-none">
                <div className="flex items-center space-x-3">
                  <div className="inline-flex shrink-0 items-center justify-center rounded-sm bg-muted p-3">
                    <Package
                      className="size-5 text-foreground"
                      aria-hidden={true}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-medium text-foreground">
                      Order Creation
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure order details and products
                    </p>
                  </div>
                </div>
                <Separator className="my-4" />

                <h4 className="text-sm font-medium text-foreground mb-4">
                  Order Sections
                </h4>
                
                <div className="space-y-2">
                  {ORDER_SECTIONS.map((section) => (
                    <button
                      key={section.key}
                      onClick={() => setCurrentSection(section.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-md transition-colors",
                        "hover:bg-muted/50",
                        currentSection === section.id
                          ? "bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                          : "border border-transparent"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "inline-flex items-center justify-center rounded-sm size-6 text-xs border transition-colors",
                          currentSection === section.id
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-muted border-border text-muted-foreground"
                        )}>
                          {section.id}
                        </div>
                        <div className="flex-1">
                          <div className={cn(
                            "font-medium text-sm",
                            currentSection === section.id ? "text-blue-700 dark:text-blue-300" : "text-foreground"
                          )}>
                            {section.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {section.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col border-t">
              <div className="flex items-center justify-between p-4">
                <Button variant="outline" onClick={onClose} disabled={isCreating}>
                  Cancel
                </Button>
                {isCreating ? (
                  <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </Button>
                ) : (
                  <Button onClick={handleSave}>Create Order</Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 max-h-[70vh] overflow-y-auto p-6 md:px-6 md:pb-8 md:pt-6">
            <OrderSectionRenderer />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}