'use client';

import React, { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { createMatch } from '../actions/matches';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X } from 'lucide-react';

interface MatchDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  orderId?: string;
  shops?: any[];
  channels?: any[];
  initialLineItems?: SelectedLineItem[];
  initialCartItems?: SelectedCartItem[];
  onMatchCreated?: () => void;
}

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
}

export const MatchDetailsDrawer: React.FC<MatchDetailsDrawerProps> = ({
  open,
  onClose,
  orderId,
  shops = [],
  channels = [],
  initialLineItems = [],
  initialCartItems = [],
  onMatchCreated,
}) => {
  // Debug logging
  console.log('MatchDetailsDialog channels:', channels);
  console.log('MatchDetailsDialog shops:', shops);
  const [selectedLineItems, setSelectedLineItems] = useState<SelectedLineItem[]>(initialLineItems);
  const [selectedCartItems, setSelectedCartItems] = useState<SelectedCartItem[]>(initialCartItems);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Update state when dialog opens with new initial items
  React.useEffect(() => {
    if (open) {
      setSelectedLineItems(initialLineItems);
      setSelectedCartItems(initialCartItems);
    }
  }, [open, initialLineItems, initialCartItems]);

  const handleCreateMatch = async () => {
    if (selectedLineItems.length === 0 || selectedCartItems.length === 0) {
      toast({
        title: 'Incomplete Selection',
        description: 'Please select both line items and cart items to create a match.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Transform selected items into the format expected by createMatch
      const shopItemIds = selectedLineItems.map(item => ({ id: item.productId })); // This would need proper shop item creation
      const channelItemIds = selectedCartItems.map(item => ({ id: item.productId })); // This would need proper channel item creation
      
      const matchData = {
        input: { connect: shopItemIds },
        output: { connect: channelItemIds },
      };
      
      const response = await createMatch(matchData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: 'Success',
        description: 'Match created successfully!',
      });
      
      // Call the success callback if provided
      onMatchCreated?.();
      
      // Reset state and close dialog
      setSelectedLineItems([]);
      setSelectedCartItems([]);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedLineItems([]);
      setSelectedCartItems([]);
      onClose();
    }
  };

  const removeShopItem = (index: number) => {
    const updatedItems = selectedLineItems.filter((_, i) => i !== index);
    setSelectedLineItems(updatedItems);
  };

  const removeChannelItem = (index: number) => {
    const updatedItems = selectedCartItems.filter((_, i) => i !== index);
    setSelectedCartItems(updatedItems);
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>Create New Match</DrawerTitle>
        </DrawerHeader>
        
        <div className="flex-1 overflow-auto p-6">
          {/* Match Header - mimicking existing match UI structure */}
          <div className="divide-y border rounded-lg">
            <div className="flex flex-wrap gap-2 justify-between p-3 bg-muted/30">
              <button
                type="button"
                className="flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-zinc-500 bg-white border-zinc-200 hover:bg-zinc-100 hover:text-zinc-700 focus:ring-2 focus:ring-blue-700 focus:text-zinc-700 dark:bg-zinc-950 dark:border-zinc-900 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-700 dark:focus:ring-blue-500 dark:focus:text-white"
              >
                New Match
              </button>
              <div className="flex gap-2 items-center">
              </div>
            </div>
            
            {/* Shop Products Section */}
            <div className="flex flex-col gap-2 p-3 bg-green-50/40 dark:bg-emerald-900/20">
              <button
                type="button"
                className="flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-emerald-500 bg-white border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300 dark:hover:text-white dark:hover:bg-emerald-700 dark:focus:ring-blue-500 dark:focus:text-white"
              >
                {selectedLineItems.length} Shop Product{selectedLineItems.length !== 1 ? 's' : ''}
              </button>
              {selectedLineItems.length > 0 && (
                <div className="space-y-2">
                  {selectedLineItems.map((item, index) => (
                    <div key={`${item.productId}-${item.variantId}-${index}`} className="border p-2 bg-background rounded-sm flex justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {item.image && (
                          <img
                            className="border rounded-sm h-12 w-12 object-cover"
                            src={item.image}
                            alt={item.title}
                          />
                        )}
                        <div className="grid">
                          <div className="uppercase font-normal tracking-wide text-xs text-muted-foreground">
                            {item.shop.name}
                          </div>
                          <div className="text-sm font-medium">
                            {item.title || 'Product details not available'}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.productId} | {item.variantId}
                          </p>
                          <p className="text-sm dark:text-emerald-500 font-medium">
                            ${item.price} x {item.quantity}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeShopItem(index)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Channel Products Section */}
            <div className="flex flex-col gap-2 p-3 bg-blue-50/30 dark:bg-indigo-900/10">
              <button
                type="button"
                className="flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-blue-500 bg-white border-blue-200 hover:bg-blue-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:text-white"
              >
                {selectedCartItems.length} Channel Product{selectedCartItems.length !== 1 ? 's' : ''}
              </button>
              {selectedCartItems.length > 0 && (
                <div className="space-y-2">
                  {selectedCartItems.map((item, index) => (
                    <div key={`${item.productId}-${item.variantId}-${index}`} className="border p-2 bg-background rounded-sm flex justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {item.image && (
                          <img
                            className="border rounded-sm h-12 w-12 object-cover"
                            src={item.image}
                            alt={item.title}
                          />
                        )}
                        <div className="grid">
                          <div className="uppercase font-normal tracking-wide text-xs text-muted-foreground">
                            {item.channel.name}
                          </div>
                          <div className="text-sm font-medium">
                            {item.title || 'Product details not available'}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.productId} | {item.variantId}
                          </p>
                          <p className="text-sm dark:text-blue-500 font-medium">
                            ${item.price} x {item.quantity}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChannelItem(index)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 p-6 border-t">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMatch} 
              disabled={loading || selectedLineItems.length === 0 || selectedCartItems.length === 0}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Match
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};