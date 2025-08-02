'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, ChevronRight, Loader2 } from 'lucide-react';
import { OrderDetailsComponent } from './OrderDetailsComponent';
import { Order } from '../lib/types';

interface ProcessOrdersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onProcessOrders: (orderIds: string[]) => void;
  processingOrders: string[];
  channels: any[];
  onAction: (action: string, orderId: string, data?: any) => void;
}

export const ProcessOrdersDialog: React.FC<ProcessOrdersDialogProps> = ({
  isOpen,
  onClose,
  orders,
  onProcessOrders,
  processingOrders,
  channels,
  onAction,
}) => {
  const [searchEntry, setSearchEntry] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [removedOrders, setRemovedOrders] = useState<string[]>([]);

  useEffect(() => {
    setSelectedOrders(orders.map((order) => order.id));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      order.orderName.toLowerCase().includes(searchEntry.toLowerCase())
    );
  }, [orders, searchEntry]);

  const handleRemoveOrder = (orderId: string) => {
    setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
    setRemovedOrders((prev) => [...prev, orderId]);
  };

  const handleAddOrder = (orderId: string) => {
    setSelectedOrders((prev) => [...prev, orderId]);
    setRemovedOrders((prev) => prev.filter((id) => id !== orderId));
  };

  const handleProcessOrders = () => {
    onProcessOrders(selectedOrders);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Process Orders</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search orders..."
            className="input pr-10"
            value={searchEntry}
            onChange={(e) => setSearchEntry(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-4 flex-grow overflow-y-auto">
          <details open className="p-4 border rounded-lg bg-muted/40 group">
            <summary className="list-none outline-none [&::-webkit-details-marker]:hidden cursor-pointer">
              <div className="flex gap-3 items-center">
                <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90" />
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Orders to be Processed</h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">
                    {selectedOrders.length} ORDER{selectedOrders.length !== 1 ? 'S' : ''}
                  </span>
                </div>
              </div>
            </summary>
            <div className="overflow-y-auto max-h-[30vh] mt-4">
              {filteredOrders.map(
                (order) =>
                  selectedOrders.includes(order.id) && (
                    <div key={order.id} className="border rounded-lg relative mt-2 bg-background ml-8">
                      <OrderDetailsComponent
                        order={order}
                        channels={channels}
                        onAction={onAction}
                        isSelected={true}
                        onSelectItem={() => {}}
                        renderButtons={() => (
                          <div className="flex gap-2">
                            {processingOrders.includes(order.id) && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            <Button
                              variant="secondary"
                              size="icon"
                              className="border [&_svg]:size-3 h-6 w-6"
                              onClick={() => handleRemoveOrder(order.id)}
                            >
                              <X className="stroke-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      />
                    </div>
                  )
              )}
            </div>
          </details>

          <details open className="p-4 border rounded-lg bg-muted/40 group">
            <summary className="list-none outline-none [&::-webkit-details-marker]:hidden cursor-pointer">
              <div className="flex gap-3 items-center">
                <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90" />
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Removed Orders</h3>
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-200">
                    {removedOrders.length} ORDER{removedOrders.length !== 1 ? 'S' : ''}
                  </span>
                </div>
              </div>
            </summary>
            <div className="overflow-y-auto max-h-[30vh] mt-4">
              {orders
                .filter((order) => removedOrders.includes(order.id))
                .map((order) => (
                  <div key={order.id} className="border rounded-lg opacity-75 mt-2 bg-background ml-8">
                    <OrderDetailsComponent
                      order={order}
                      channels={channels}
                      onAction={onAction}
                      isSelected={false}
                      onSelectItem={() => {}}
                      renderButtons={() => (
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => handleAddOrder(order.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    />
                  </div>
                ))}
            </div>
          </details>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleProcessOrders}
            disabled={selectedOrders.length === 0 || processingOrders.length > 0}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            {processingOrders.length > 0 ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Process ${selectedOrders.length} Orders`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};