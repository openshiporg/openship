// Shop types for OpenShip
export interface Shop {
  id: string;
  name: string;
  domain: string;
  accessToken: string;
  linkMode?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  platform?: {
    id: string;
    name: string;
    appKey?: string;
    appSecret?: string;
  };
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  orders?: Order[];
  shopItems?: ShopItem[];
  links?: Link[];
}

export interface Order {
  id: string;
  orderId: string;
  orderName: string;
  status: string;
  totalPrice?: number;
  createdAt: string;
}

export interface ShopItem {
  id: string;
  name: string;
  image?: string;
  price?: number;
  quantity?: number;
  productId: string;
  variantId: string;
}

export interface Link {
  id: string;
  channel?: {
    id: string;
    name: string;
  };
}
