"use server";

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

// Utility function to safely convert price to float
function parsePrice(price: string | number | undefined | null): number | null {
  if (price === null || price === undefined || price === "") {
    return null;
  }
  
  if (typeof price === "number") {
    return price;
  }
  
  const parsed = parseFloat(String(price));
  return isNaN(parsed) ? null : parsed;
}

export interface ShopOrderData {
  orderId: string;
  orderName: string;
  email: string;
  firstName: string;
  lastName: string;
  streetAddress1: string;
  streetAddress2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  phone?: string;
  currency: string;
  totalPrice?: string | number;
  subTotalPrice?: string | number;
  totalDiscounts?: string | number;
  totalTax?: string | number;
  date: string;
  lineItems?: Array<{
    name: string;
    quantity: number;
    price: string | number;
    productId: string;
    variantId: string;
    sku?: string;
    image?: string;
    lineItemId?: string;
  }>;
  cartItems?: Array<{
    name: string;
    quantity: number;
    price: string | number;
    productId: string;
    variantId: string;
    sku?: string;
    image?: string;
    channel?: {
      id: string;
      name: string;
    };
  }>;
  shop: {
    id: string;
  };
  linkOrder?: boolean;
  matchOrder?: boolean;
  processOrder?: boolean;
}

export async function createOrderFromShopOrder(shopOrderData: ShopOrderData) {
  try {
    console.log("=== Creating order from shop order ===");
    console.log("Input shopOrderData:", JSON.stringify(shopOrderData, null, 2));
    
    // Build the order data exactly like the old Openship code
    const orderData: any = {
      orderId: shopOrderData.orderId,
      orderName: shopOrderData.orderName,
      email: shopOrderData.email,
      firstName: shopOrderData.firstName,
      lastName: shopOrderData.lastName,
      streetAddress1: shopOrderData.streetAddress1,
      streetAddress2: shopOrderData.streetAddress2,
      city: shopOrderData.city,
      state: shopOrderData.state,
      zip: shopOrderData.zip,
      country: shopOrderData.country,
      phone: shopOrderData.phone,
      currency: shopOrderData.currency,
      totalPrice: parsePrice(shopOrderData.totalPrice),
      subTotalPrice: parsePrice(shopOrderData.subTotalPrice),
      totalDiscounts: parsePrice(shopOrderData.totalDiscounts),
      totalTax: parsePrice(shopOrderData.totalTax),
      status: "PENDING",
      linkOrder: shopOrderData.linkOrder !== undefined ? shopOrderData.linkOrder : true,
      matchOrder: shopOrderData.matchOrder !== undefined ? shopOrderData.matchOrder : true,
      processOrder: shopOrderData.processOrder !== undefined ? shopOrderData.processOrder : true,
      shop: {
        connect: { id: shopOrderData.shop.id }
      }
    };

    // Add line items using nested create (EXACT copy from old Openship)
    if (shopOrderData.lineItems && shopOrderData.lineItems.length > 0) {
      orderData.lineItems = {
        create: shopOrderData.lineItems.map((item) => ({
          name: item.name,
          image: item.image,
          price: parsePrice(item.price),
          quantity: parseInt(item.quantity),
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku || "",
          lineItemId: item.lineItemId,
        }))
      };
      console.log("Creating order with line items:", orderData.lineItems);
    } else {
      console.log("No line items provided for order creation");
    }

    // Add cart items using nested create (EXACT copy from old Openship)
    if (shopOrderData.cartItems && shopOrderData.cartItems.length > 0) {
      orderData.cartItems = {
        create: shopOrderData.cartItems.map((item) => ({
          name: item.name,
          image: item.image,
          price: String(item.price || ''),
          quantity: parseInt(item.quantity),
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku || "",
          channel: item.channel ? { connect: { id: item.channel.id } } : undefined,
        }))
      };
    }

    // Log the final order data being sent to the mutation
    console.log("Final orderData being sent to mutation:", JSON.stringify(orderData, null, 2));

    // Create the order with all nested items in one mutation (like old Openship)
    const createOrderMutation = `
      mutation CreateOrder($data: OrderCreateInput!) {
        createOrder(data: $data) {
          id
          orderId
          orderName
          status
          email
          firstName
          lastName
          totalPrice
          lineItems {
            id
            name
            quantity
            price
            productId
            variantId
            sku
            image
            lineItemId
          }
          cartItems {
            id
            name
            quantity
            price
            productId
            variantId
            sku
            image
          }
        }
      }
    `;

    const orderResponse = await keystoneClient(createOrderMutation, {
      data: orderData
    });
    
    console.log("GraphQL response:", JSON.stringify(orderResponse, null, 2));

    if (!orderResponse.success) {
      throw new Error(orderResponse.error || "Failed to create order");
    }

    const order = orderResponse.data?.createOrder;
    if (!order) {
      throw new Error("Order creation returned no data");
    }

    // Revalidate the orders page so the new order appears immediately
    revalidatePath('/dashboard/platform/orders');

    return {
      success: true,
      data: order
    };
  } catch (error) {
    console.error("Error creating order from shop order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create order"
    };
  }
}