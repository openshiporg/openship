'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, ChevronLeft, ChevronRight, Plus, Loader2, Check, X, Send } from 'lucide-react';
import { searchShopProducts } from '../../orders/actions/orders';
import { useToast } from '@/components/ui/use-toast';

interface Shop {
  id: string;
  name: string;
  domain?: string;
}

interface Product {
  image?: string;
  title: string;
  productId: string;
  variantId: string;
  price?: string;
  availableForSale?: boolean;
  inventory?: number;
  inventoryTracked?: boolean;
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

interface LineItemSelectProps {
  orderId?: string;
  selectedItems: SelectedLineItem[];
  onSelectionChange: (items: SelectedLineItem[]) => void;
  shops: Shop[];
}

export const LineItemSelect: React.FC<LineItemSelectProps> = ({
  orderId,
  selectedItems,
  onSelectionChange,
  shops,
}) => {
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id || '');
  const [searchEntry, setSearchEntry] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const inputId = useId();
  // Track add status for each product: 'idle' | 'loading' | 'success' | 'error'
  const [addStatus, setAddStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  // Update selected shop when shops change
  useEffect(() => {
    if (!selectedShopId && shops.length > 0) {
      setSelectedShopId(shops[0].id);
    }
  }, [shops, selectedShopId]);

  const handleSearch = async () => {
    if (!selectedShopId || !searchEntry) {
      toast({
        title: 'Missing Information',
        description: 'Please select a shop and enter a search term.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const results = await searchShopProducts(selectedShopId, searchEntry);
      // Handle both array and object with products property
      let products: Product[] = [];
      if (Array.isArray(results)) {
        products = results;
      } else if (results && Array.isArray(results.products)) {
        products = results.products;
      }
      setSearchResults(products);
    } catch (error: any) {
      toast({
        title: 'Search Failed',
        description: error.message,
        variant: 'destructive',
      });
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setQuantities({ ...quantities, [productId]: Math.max(1, newQuantity) });
  };

  const handleAddItem = async (product: Product) => {
    const productId = product.productId;
    setAddStatus((prev) => ({ ...prev, [productId]: 'loading' }));
    try {
      const selectedShop = shops.find(shop => shop.id === selectedShopId);
      if (!selectedShop) return;

      const quantity = quantities[productId] || 1;
      
      // Check if item with same productId and variantId already exists
      const existingItemIndex = selectedItems.findIndex(
        item => item.productId === product.productId && item.variantId === product.variantId
      );

      let updatedItems: SelectedLineItem[];
      
      if (existingItemIndex >= 0) {
        // Item exists, accumulate quantity
        updatedItems = [...selectedItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
      } else {
        // New item, add to list
        const newItem: SelectedLineItem = {
          quantity,
          productId: product.productId,
          variantId: product.variantId,
          shop: {
            id: selectedShop.id,
            name: selectedShop.name,
          },
          price: product.price,
          title: product.title,
          image: product.image,
        };
        updatedItems = [...selectedItems, newItem];
      }

      onSelectionChange(updatedItems);
      setAddStatus((prev) => ({ ...prev, [productId]: 'success' }));
      setQuantities({ ...quantities, [productId]: 1 });
      setTimeout(() => {
        setAddStatus((prev) => ({ ...prev, [productId]: 'idle' }));
      }, 1200);
    } catch (e) {
      setAddStatus((prev) => ({ ...prev, [productId]: 'error' }));
      setTimeout(() => {
        setAddStatus((prev) => ({ ...prev, [productId]: 'idle' }));
      }, 1200);
    }
  };


  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border-t border-b flex flex-col gap-2 py-3 px-4 md:px-6 bg-blue-50/40 dark:bg-blue-900/20"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-blue-500 bg-white border-blue-200 hover:bg-blue-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:text-white"
        >
          Shop Search
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {/* Display existing selected line items - ABOVE search bar */}
        {selectedItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">Selected Line Items ({selectedItems.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto bg-blue-50/50 dark:bg-blue-900/20 rounded-md p-3 border border-blue-200/50 dark:border-blue-800/50">
              {selectedItems.map((item, index) => (
                <div
                  key={`${item.productId}-${item.variantId}-${index}`}
                  className="flex items-center space-x-2 p-2 bg-background rounded-md border shadow-sm"
                >
                  <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="border rounded-md h-12 w-12 bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">IMG</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.productId} | {item.variantId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.shop.name} • Qty: {item.quantity}
                      {item.price && ` • $${(parseFloat(item.price) * item.quantity).toFixed(2)}`}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      const newItems = [...selectedItems];
                      newItems.splice(index, 1);
                      onSelectionChange(newItems);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex rounded-md shadow-xs">
            <Select value={selectedShopId} onValueChange={setSelectedShopId} disabled={shops.length === 0}>
              <SelectTrigger className="w-fit rounded-e-none shadow-none text-muted-foreground hover:text-foreground">
                <SelectValue placeholder={shops.length === 0 ? "No shops available" : "Select Shop"} />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Input
                id={inputId}
                className="-ms-px rounded-s-none shadow-none focus-visible:z-10 flex-1 bg-white pe-10"
                placeholder="Search shop products..."
                value={searchEntry}
                onChange={(e) => setSearchEntry(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Search"
                onClick={handleSearch}
                disabled={loading}
                type="button"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Search Results ({searchResults.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((product) => (
              <div
                key={product.productId}
                className="flex items-center space-x-2 p-2 bg-background rounded-md border"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="border rounded-sm h-12 w-12 bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">IMG</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-sm font-medium truncate">
                    {product.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {product.productId} | {product.variantId}
                  </div>
                  <p className="text-sm dark:text-blue-500 font-medium">
                    ${parseFloat(product.price || '0').toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleQuantityChange(product.productId, (quantities[product.productId] || 1) - 1)}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Input
                      className="mx-1 border rounded-md h-6 w-10 text-center bg-background"
                      type="text"
                      value={quantities[product.productId] || 1}
                      onChange={(e) => handleQuantityChange(product.productId, parseInt(e.target.value, 10))}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleQuantityChange(product.productId, (quantities[product.productId] || 1) + 1)}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleAddItem(product)}
                    disabled={addStatus[product.productId] === 'loading'}
                  >
                    {addStatus[product.productId] === 'loading' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : addStatus[product.productId] === 'success' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : addStatus[product.productId] === 'error' ? (
                      <X className="h-3 w-3 text-red-600" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
        
        {!loading && searchResults.length === 0 && searchEntry && (
          <div className="text-center text-muted-foreground py-4">
            No products found for this shop.
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};