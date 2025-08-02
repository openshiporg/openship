'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MatchCard } from './MatchCard';
import { Loader2 } from 'lucide-react';
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';

interface Product {
  image?: string;
  title: string;
  productId: string;
  variantId: string;
  price: string;
}

interface ShowMatchesButtonProps {
  product: Product;
  onMatchAction?: (action: string, matchId: string) => void;
}

async function getMatchesCount(where: any) {
  const query = `
    query GetMatchesCount($where: MatchWhereInput!) {
      matchesCount(where: $where)
    }
  `;
  
  const response = await keystoneClient(query, { where });
  if (!response.success) {
    throw new Error(response.error);
  }
  return response.data;
}

async function getMatches(where: any) {
  const query = `
    query GetMatches($where: MatchWhereInput!) {
      matches(where: $where) {
        id
        input {
          id
          quantity
          productId
          variantId
          externalDetails {
            title
            image
            price
            inventory
          }
          shop {
            id
            name
          }
        }
        output {
          id
          quantity
          productId
          variantId
          externalDetails {
            title
            image
            price
            inventory
          }
          channel {
            id
            name
          }
          priceChanged
        }
        outputPriceChanged
        inventoryNeedsToBeSynced
      }
    }
  `;
  
  const response = await keystoneClient(query, { where });
  if (!response.success) {
    throw new Error(response.error);
  }
  return response.data;
}

export const ShowMatchesButton: React.FC<ShowMatchesButtonProps> = ({
  product,
  onMatchAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [matchesData, setMatchesData] = useState<any>(null);
  const [countData, setCountData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const whereClause = {
    AND: [
      {
        input: {
          some: {
            productId: { equals: product.productId },
            variantId: { equals: product.variantId },
          },
        },
      },
    ],
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [countResponse, matchesResponse] = await Promise.all([
        getMatchesCount(whereClause),
        getMatches(whereClause)
      ]);
      
      setCountData(countResponse);
      setMatchesData(matchesResponse);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadData();
    }
  };

  const matchCount = countData?.matchesCount || 0;

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border font-medium uppercase tracking-wide py-0.5 px-1.5"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              {matchCount} Match{matchCount !== 1 ? 'es' : ''}
            </>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="p-4 gap-4">
          <SheetTitle>Item Matches</SheetTitle>
          <Card className="p-2 bg-muted/40">
            <div className="flex space-x-2">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.title}
                  className="border w-16 h-16 object-cover rounded-md"
                />
              )}
              <div className="flex-grow">
                <div className="text-sm font-medium">{product.title}</div>
                <div className="text-xs text-gray-500">
                  {product.productId} | {product.variantId}
                </div>
                <div className="text-sm font-medium">${product.price}</div>
              </div>
            </div>
          </Card>
        </SheetHeader>
        
        <div className="text-muted-foreground px-4 py-2 font-medium uppercase tracking-wider text-sm">
          {matchesData?.matches?.length || 0} match
          {(matchesData?.matches?.length || 0) !== 1 ? 'es' : ''} found
        </div>
        
        <div className="border-y space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading matches...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error: {error}
            </div>
          ) : matchesData?.matches?.length > 0 ? (
            matchesData.matches.map((match: any) => (
              <MatchCard
                key={match.id}
                match={match}
                onMatchAction={onMatchAction}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No matches found for this product
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};