"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Plus, CircleAlert } from "lucide-react";
import { getShopMatches, getChannelMatches } from "../actions/matches";

export const MatchList = ({ 
  shopId, 
  channelId, 
  onMatchAction, 
  showCreate = true 
}: {
  shopId?: string;
  channelId?: string;
  onMatchAction?: (match: any) => void;
  showCreate?: boolean;
}) => {
  const [searchString, setSearchString] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [matches, setMatches] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const loadMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (shopId) {
        response = await getShopMatches(shopId, currentPage, pageSize);
      } else if (channelId) {
        response = await getChannelMatches(channelId, currentPage, pageSize);
      } else {
        setMatches([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      if (response.success) {
        setMatches(response.data?.items || []);
        setTotalCount(response.data?.count || 0);
      } else {
        setError(response.error || "Failed to load matches");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [shopId, channelId, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchString);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600">
        <p className="text-sm">
          <CircleAlert
            className="me-3 -mt-0.5 inline-flex opacity-60"
            size={16}
            aria-hidden="true"
          />
          Error loading matches: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <form onSubmit={handleSearch}>
            <Input
              type="search"
              className="pl-9 w-full"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              placeholder="Search matches..."
            />
          </form>
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Results */}
      {matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map((match: any) => (
            <MatchCard 
              key={match.id} 
              match={match} 
              onMatchAction={onMatchAction}
            />
          ))}
          
          {/* Simple pagination info */}
          <div className="text-center text-sm text-muted-foreground py-2">
            Showing {matches.length} of {totalCount} matches
          </div>
        </div>
      ) : (
        <div className="text-center p-8">
          <div className="text-muted-foreground mb-4">
            {searchString ? "No matches found for your search" : "No matches created yet"}
          </div>
          {showCreate && !searchString && (
            <Button
              onClick={() => document.querySelector('[aria-label="Create Match"]')?.click()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Match
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const MatchCard = ({ match, onMatchAction }: {
  match: any;
  onMatchAction?: (match: any) => void;
}) => {
  const input = match.input?.[0];
  const output = match.output?.[0];

  // Parse externalDetails if it's a JSON string
  const parseExternalDetails = (details: any) => {
    if (typeof details === 'string') {
      try {
        return JSON.parse(details);
      } catch {
        return {};
      }
    }
    return details || {};
  };

  const inputDetails = parseExternalDetails(input?.externalDetails);
  const outputDetails = parseExternalDetails(output?.externalDetails);

  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input (Shop) side */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Shop: {input?.shop?.name}
            </Badge>
          </div>
          <div className="flex gap-3">
            {inputDetails?.image && (
              <img
                src={inputDetails.image}
                alt={inputDetails.title}
                className="w-12 h-12 object-cover rounded border"
              />
            )}
            <div className="flex-1">
              <div className="font-medium text-sm">
                {inputDetails?.title || "Unknown Product"}
              </div>
              <div className="text-xs text-muted-foreground">
                {input?.productId} | {input?.variantId}
              </div>
              <div className="text-xs">
                Qty: {input?.quantity} • ${inputDetails?.price || "0.00"}
              </div>
            </div>
          </div>
        </div>

        {/* Output (Channel) side */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Channel: {output?.channel?.name}
            </Badge>
          </div>
          <div className="flex gap-3">
            {outputDetails?.image && (
              <img
                src={outputDetails.image}
                alt={outputDetails.title}
                className="w-12 h-12 object-cover rounded border"
              />
            )}
            <div className="flex-1">
              <div className="font-medium text-sm">
                {outputDetails?.title || "Unknown Product"}
              </div>
              <div className="text-xs text-muted-foreground">
                {output?.productId} | {output?.variantId}
              </div>
              <div className="text-xs">
                Qty: {output?.quantity} • ${output?.price || outputDetails?.price || "0.00"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          Created: {new Date(match.createdAt).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onMatchAction?.(match)}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchList;
