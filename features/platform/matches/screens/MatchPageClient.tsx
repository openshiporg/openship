'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Match {
  id: string;
  outputPriceChanged?: string;
  inventoryNeedsToBeSynced?: string;
  input?: any[];
  output?: any[];
  user?: any;
  createdAt: string;
  updatedAt?: string;
}

interface MatchPageClientProps {
  matches: Match[];
  shops: any[];
  channels: any[];
  selectedMatches: Set<string>;
  onSelectedMatchesChange: (selected: Set<string>) => void;
}

export function MatchPageClient({
  matches,
  shops,
  channels,
  selectedMatches,
  onSelectedMatchesChange,
}: MatchPageClientProps) {
  const handleSelectMatch = (matchId: string, checked: boolean) => {
    const newSelected = new Set(selectedMatches);
    if (checked) {
      newSelected.add(matchId);
    } else {
      newSelected.delete(matchId);
    }
    onSelectedMatchesChange(newSelected);
  };

  return (
    <div className="p-4 space-y-4">
      {matches.map((match) => (
        <Card key={match.id}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedMatches.has(match.id)}
                onCheckedChange={(checked) => handleSelectMatch(match.id, checked as boolean)}
              />
              <CardTitle className="text-sm">Match {match.id}</CardTitle>
              {match.outputPriceChanged && (
                <Badge variant="secondary">Price Changed</Badge>
              )}
              {match.inventoryNeedsToBeSynced && (
                <Badge variant="outline">Sync Needed</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Shop Items ({match.input?.length || 0})</h4>
                {match.input?.map((item, index) => (
                  <div key={index} className="text-sm text-muted-foreground mb-1">
                    {item.productId} - Qty: {item.quantity}
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Channel Items ({match.output?.length || 0})</h4>
                {match.output?.map((item, index) => (
                  <div key={index} className="text-sm text-muted-foreground mb-1">
                    {item.productId} - Qty: {item.quantity} - ${item.price}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Created: {new Date(match.createdAt).toLocaleDateString()}
              {match.updatedAt && (
                <span className="ml-4">
                  Updated: {new Date(match.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}