"use client";

import { ShopDetailsComponent } from "./ShopDetailsComponent";

interface Shop {
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
  };
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  orders?: Array<{
    id: string;
  }>;
  shopItems?: Array<{
    id: string;
  }>;
  links?: Array<{
    id: string;
  }>;
}

interface ShopListClientProps {
  shops: Shop[];
  channels?: any[];
}

export function ShopListClient({ shops, channels = [] }: ShopListClientProps) {
  return (
    <div className="relative grid gap-3 p-4">
      {shops.map((shop: Shop) => (
        <ShopDetailsComponent
          key={shop.id}
          shop={shop as any}
          shops={shops}
          channels={channels}
        />
      ))}
    </div>
  );
}
