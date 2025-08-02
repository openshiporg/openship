'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Plus, Loader2, Check, X, Send } from 'lucide-react';
import { searchShopProducts } from '../actions/orders';
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

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    onSelectionChange(newItems);
  };

  const handleSelectedItemQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedItems = [...selectedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: newQuantity
    };
    onSelectionChange(updatedItems);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Selected Items Section - 2/5 of space */}
      <div className="flex-[2] min-h-0 mb-4">
        {selectedItems.length > 0 ? (
          <div className="bg-blue-50/30 dark:bg-indigo-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-900 h-full flex flex-col">
            <h4 className="text-sm font-medium uppercase tracking-wide mb-3 text-blue-500 dark:text-blue-300 flex-shrink-0">
              Line Items ({selectedItems.length})
            </h4>
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0 p-1">
              {selectedItems.map((item, index) => (
                <div
                  key={`${item.productId}-${item.variantId}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-white rounded-lg ring-1 ring-foreground/10 shadow-inner"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    {item.image ? (
                      <img 
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                      />
                    ) : (
                      <div className="border rounded-md h-12 w-12 bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-muted-foreground">IMG</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">{item.shop.name}</p>
                      <h3 className="font-medium text-xs leading-tight">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{item.productId} | {item.variantId}</p>
                      <p className="text-xs font-medium mt-1">
                        ${item.price && (parseFloat(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <div className="relative inline-flex h-7 w-20 items-center overflow-hidden rounded-md border border-input text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                      <Input
                        className="bg-background text-foreground flex-1 px-2 py-1 tabular-nums text-xs border-0 shadow-none focus-visible:ring-0 h-full [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleSelectedItemQuantityChange(index, parseInt(e.target.value) || 1)}
                      />
                      <div className="flex h-[calc(100%+2px)] flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="border-input bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground -me-px flex h-1/2 w-5 flex-1 items-center justify-center border-l text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 rounded-none p-0"
                          onClick={() => handleSelectedItemQuantityChange(index, item.quantity + 1)}
                        >
                          <ChevronUp size={10} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="border-input bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground -me-px -mt-px flex h-1/2 w-5 flex-1 items-center justify-center border-l border-t text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 rounded-none p-0"
                          onClick={() => handleSelectedItemQuantityChange(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <ChevronDown size={10} aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-blue-50/30 dark:bg-indigo-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-900 h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No line items selected</p>
          </div>
        )}
      </div>

      {/* Search UI - Fixed in Middle */}
      <div className="flex-shrink-0 py-2">
        <div className="flex space-x-2">
          <Select value={selectedShopId} onValueChange={setSelectedShopId} disabled={shops.length === 0}>
            <SelectTrigger className="w-auto min-w-[200px] h-9">
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
              placeholder="Search shop products..." 
              className="flex-1 h-9 pr-10"
              value={searchEntry}
              onChange={(e) => setSearchEntry(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              className="absolute inset-y-0 right-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
              aria-label="Search"
              onClick={handleSearch}
              disabled={loading}
              type="button"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Search Results Section - 2/5 of space */}
      <div className="flex-[2] min-h-0 mt-4">
        {searchResults.length > 0 ? (
          <div className="bg-foreground/5 p-4 rounded-lg border h-full flex flex-col">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex-shrink-0">
              Search Results ({searchResults.length})
            </h4>
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0 p-1">
              {searchResults.map((product) => (
                <div
                  key={product.productId}
                  className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-white rounded-lg ring-1 ring-foreground/10 shadow-inner"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    {product.image ? (
                      <img 
                        src={product.image}
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                      />
                    ) : (
                      <div className="border rounded-md h-12 w-12 bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-muted-foreground">IMG</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs leading-tight">{product.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{product.productId} | {product.variantId}</p>
                      <p className="text-xs font-medium mt-1">${parseFloat(product.price || '0').toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <div className="relative inline-flex h-7 w-20 items-center overflow-hidden rounded-md border border-input text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                      <Input
                        className="bg-background text-foreground flex-1 px-2 py-1 tabular-nums text-xs border-0 shadow-none focus-visible:ring-0 h-full [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        type="number"
                        min="1"
                        value={quantities[product.productId] || 1}
                        onChange={(e) => handleQuantityChange(product.productId, parseInt(e.target.value) || 1)}
                      />
                      <div className="flex h-[calc(100%+2px)] flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="border-input bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground -me-px flex h-1/2 w-5 flex-1 items-center justify-center border-l text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 rounded-none p-0"
                          onClick={() => handleQuantityChange(product.productId, (quantities[product.productId] || 1) + 1)}
                        >
                          <ChevronUp size={10} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="border-input bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground -me-px -mt-px flex h-1/2 w-5 flex-1 items-center justify-center border-l border-t text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 rounded-none p-0"
                          onClick={() => handleQuantityChange(product.productId, (quantities[product.productId] || 1) - 1)}
                          disabled={(quantities[product.productId] || 1) <= 1}
                        >
                          <ChevronDown size={10} aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
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
        ) : (
          <div className="bg-foreground/5 p-4 rounded-lg border h-full flex items-center justify-center">
            {!loading && searchEntry ? (
              <p className="text-sm text-muted-foreground">No products found for this shop.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Search for products to add</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};