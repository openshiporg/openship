'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import { searchChannelProducts } from '../actions/matches';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { ShowMatchesButton } from './ShowMatchesButton';

interface Channel {
  id: string;
  name: string;
  domain?: string;
  status?: string;
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

interface ChannelProductsSearchProps {
  channels: Channel[];
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

export const ChannelProductsSearch: React.FC<ChannelProductsSearchProps> = ({
  channels,
}) => {
  // Debug logging
  console.log('ChannelProductsSearch channels:', channels);
  const [selectedChannelId, setSelectedChannelId] = useState(channels[0]?.id || '');
  const [searchEntry, setSearchEntry] = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const debouncedSearchEntry = useDebounce(searchEntry, 300);

  useEffect(() => {
    if (selectedChannelId && debouncedSearchEntry) {
      const selectedChannel = channels.find(c => c.id === selectedChannelId);
      if (selectedChannel?.status !== 'inactive') {
        handleSearch(selectedChannelId, debouncedSearchEntry);
      }
    }
  }, [selectedChannelId, debouncedSearchEntry]);

  const handleSearch = async (channelId: string, searchTerm: string) => {
    if (!channelId || !searchTerm) return;

    setLoading(prev => ({ ...prev, [channelId]: true }));
    try {
      const response = await searchChannelProducts(channelId, searchTerm);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setSearchResults(prev => ({
        ...prev,
        [channelId]: response.searchChannelProducts?.products || []
      }));
    } catch (error: any) {
      toast({
        title: 'Search Failed',
        description: error.message,
        variant: 'destructive',
      });
      setSearchResults(prev => ({
        ...prev,
        [channelId]: []
      }));
    } finally {
      setLoading(prev => ({ ...prev, [channelId]: false }));
    }
  };

  const currentResults = searchResults[selectedChannelId] || [];
  const isLoading = loading[selectedChannelId] || false;
  const selectedChannel = channels.find(c => c.id === selectedChannelId);
  const isChannelInactive = selectedChannel?.status === 'inactive';

  return (
    <div className="flex h-full">
      {/* Vertical channel tabs */}
      <div className="w-64 border-r">
        <Tabs value={selectedChannelId} onValueChange={setSelectedChannelId} orientation="vertical">
          <TabsList className="h-auto flex-col justify-start bg-transparent p-0">
            {channels.map((channel) => (
              <TabsTrigger
                key={channel.id}
                value={channel.id}
                className="w-full justify-start p-3 data-[state=active]:bg-muted"
              >
                <div className="text-left w-full">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{channel.name}</div>
                    {channel.status === 'inactive' && (
                      <Badge variant="destructive" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {channel.domain && (
                    <div className="text-xs text-muted-foreground">{channel.domain}</div>
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
                placeholder="Search channel products..."
                value={searchEntry}
                onChange={(e) => setSearchEntry(e.target.value)}
                className="pl-10"
                disabled={isChannelInactive}
              />
            </div>
          </div>
          
          {/* Channel Warning */}
          {isChannelInactive && (
            <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Channel Unavailable</span>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                This channel is currently inactive and cannot be used for product searches.
              </p>
            </div>
          )}
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
                    <div className="text-sm font-medium text-green-600">
                      ${parseFloat(product.price).toFixed(2)}
                    </div>
                    {product.inventoryTracked && (
                      <div className="text-xs text-muted-foreground">
                        Stock: {product.inventory || 0}
                      </div>
                    )}
                    {!product.availableForSale && (
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
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
          ) : searchEntry && !isChannelInactive ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found for "{searchEntry}"
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isChannelInactive 
                ? 'Please select an active channel to search for products'
                : 'Enter a search term to find products'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};