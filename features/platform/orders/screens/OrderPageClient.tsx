'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { OrderDetailsComponent } from '../components/OrderDetailsComponent';
import { Order } from '../lib/types';
import { addToCart, matchOrder, placeOrders, addMatchToCart } from '../actions/orders';
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from 'next/navigation';

interface OrderPageClientProps {
  orders: Order[];
  channels: any[];
  selectedOrders: Set<string>;
  onSelectedOrdersChange: (newSelectedOrders: Set<string>) => void;
}

export function OrderPageClient({
  orders,
  channels,
  selectedOrders,
  onSelectedOrdersChange,
}: OrderPageClientProps) {
  const { toast } = useToast();
  const [loadingActions, setLoadingActions] = useState<Record<string, Record<string, boolean>>>({});
  const router = useRouter();

  const handleAction = async (action: string, orderId: string, data?: any) => {
    setLoadingActions(prev => ({ ...prev, [action]: { ...(prev[action] || {}), [orderId]: true } }));
    try {
      let response;
      if (action === 'addToCart') {
        response = await addToCart({ ...data, quantity: String(data.quantity), orderId });
      } else if (action === 'matchOrder') {
        response = await matchOrder(orderId);
      } else if (action === 'getMatch') {
        response = await addMatchToCart(orderId);
      } else if (action === 'saveMatch') {
        response = await matchOrder(orderId);
      } else if (action === 'placeOrder') {
        response = await placeOrders([orderId]);
      }

      if (response?.success) {
        toast({ title: 'Success', description: `${action} completed successfully.` });
      } else if(response?.error) {
        throw new Error(response?.error || 'An unknown error occurred.');
      }
    } catch (error: any) {
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingActions(prev => ({ ...prev, [action]: { ...(prev[action] || {}), [orderId]: false } }));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedOrders = new Set<string>();
    if (checked) {
      orders.forEach(order => newSelectedOrders.add(order.id));
    }
    onSelectedOrdersChange(newSelectedOrders);
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelectedOrders = new Set(selectedOrders);
    if (checked) {
      newSelectedOrders.add(itemId);
    } else {
      newSelectedOrders.delete(itemId);
    }
    onSelectedOrdersChange(newSelectedOrders);
  };

  return (
    <div className="grid grid-cols-1 divide-y">
      {orders.map((order: Order) => (
        <OrderDetailsComponent
          key={order.id}
          order={order}
          channels={channels}
          onAction={handleAction}
          loadingActions={loadingActions}
          isSelected={selectedOrders.has(order.id)}
          onSelectItem={handleSelectItem}
        />
      ))}
    </div>
  );
}