'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { searchShopProducts } from '../actions/matches';
import { useToast } from '@/components/ui/use-toast';
import { ShowMatchesButton } from './ShowMatchesButton';

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
  price: string;
  availableForSale?: boolean;
  inventory?: number;
  inventoryTracked?: boolean;
}

interface ShopProductsSearchProps {
  shops: Shop[];
}

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const ShopProductsSearch: React.FC<ShopProductsSearchProps> = ({
  shops,
}) => {
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id || '');
  const [searchEntry, setSearchEntry] = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const debouncedSearchEntry = useDebounce(searchEntry, 300);

  useEffect(() => {
    if (selectedShopId && debouncedSearchEntry) {
      handleSearch(selectedShopId, debouncedSearchEntry);
    }
  }, [selectedShopId, debouncedSearchEntry]);

  const handleSearch = async (shopId: string, searchTerm: string) => {
    if (!shopId || !searchTerm) return;

    setLoading(prev => ({ ...prev, [shopId]: true }));
    try {
      const response = await searchShopProducts(shopId, searchTerm);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setSearchResults(prev => ({
        ...prev,
        [shopId]: response.searchShopProducts?.products || []
      }));
    } catch (error: any) {
      toast({
        title: 'Search Failed',
        description: error.message,
        variant: 'destructive',
      });
      setSearchResults(prev => ({
        ...prev,
        [shopId]: []
      }));
    } finally {
      setLoading(prev => ({ ...prev, [shopId]: false }));
    }
  };

  const currentResults = searchResults[selectedShopId] || [];
  const isLoading = loading[selectedShopId] || false;

  return (
    <div className="flex h-full">
      {/* Vertical shop tabs */}
      <div className="w-64 border-r">
        <Tabs value={selectedShopId} onValueChange={setSelectedShopId} orientation="vertical">
          <TabsList className="h-auto flex-col justify-start bg-transparent p-0">
            {shops.map((shop) => (
              <TabsTrigger
                key={shop.id}
                value={shop.id}
                className="w-full justify-start p-3 data-[state=active]:bg-muted"
              >
                <div className="text-left">
                  <div className="font-medium">{shop.name}</div>
                  {shop.domain && (
                    <div className="text-xs text-muted-foreground">{shop.domain}</div>
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Search content area */}
      <div className="flex-1 flex flex-col">
        {/* Sticky search bar */}
        <div className="sticky top-0 bg-background border-b p-4 z-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shop products..."
                value={searchEntry}
                onChange={(e) => setSearchEntry(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Searching products...</span>
            </div>
          ) : currentResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentResults.map((product) => (
                <div
                  key={`${product.productId}-${product.variantId}`}
                  className="border rounded-lg p-4 bg-background hover:shadow-md transition-shadow"
                >
                  {product.image && (
                    <div className="w-full h-32 mb-3 rounded-md overflow-hidden bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
                    <div className="text-xs text-muted-foreground">
                      <div>Product ID: {product.productId}</div>
                      <div>Variant ID: {product.variantId}</div>
                    </div>
                    {product.price && (
                      <div className="text-sm font-medium text-green-600">
                        ${parseFloat(product.price).toFixed(2)}
                      </div>
                    )}
                    {product.inventoryTracked && (
                      <div className="text-xs text-muted-foreground">
                        Stock: {product.inventory || 0}
                      </div>
                    )}
                    <ShowMatchesButton 
                      product={product}
                      onMatchAction={(action, matchId) => {
                        console.log('Match action:', action, 'for match:', matchId);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : searchEntry ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found for "{searchEntry}"
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Enter a search term to find products
            </div>
          )}
        </div>
      </div>
    </div>
  );
};