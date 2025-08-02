// Channel types for OpenShip
export interface Channel {
  id: string;
  name: string;
  domain: string;
  accessToken: string;
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
  channelItems?: ChannelItem[];
  links?: Link[];
}

export interface ChannelItem {
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
  shop?: {
    id: string;
    name: string;
  };
}
