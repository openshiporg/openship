// Basic Openship order types
export interface Order {
  id: string;
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
  totalPrice?: number;
  subTotalPrice?: number;
  totalDiscounts?: number;
  totalTax?: number;
  status: string;
  error?: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  shop?: {
    id: string;
    name: string;
    domain?: string;
  };
  lineItems?: LineItem[];
  cartItems?: CartItem[];
}

export interface LineItem {
  id: string;
  name: string;
  image?: string;
  price?: number;
  quantity?: number;
  productId: string;
  variantId: string;
  sku?: string;
  lineItemId?: string;
}

export interface CartItem {
  id: string;
  name: string;
  image?: string;
  price?: number;
  quantity?: number;
  productId: string;
  variantId: string;
  sku?: string;
  purchaseId?: string;
  url?: string;
  error?: string;
  channel?: {
    id: string;
    name: string;
  };
}