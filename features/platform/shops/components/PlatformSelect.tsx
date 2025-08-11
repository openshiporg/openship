'use client';

import React, { useEffect, useState } from 'react';
import { getListByPath } from '@/features/dashboard/actions/getListByPath';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PlatformSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  onPlatformDataChange?: (platform: any) => void;
}

function PlatformSelectSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function PlatformSelect({ 
  value,
  onValueChange,
  onPlatformDataChange
}: PlatformSelectProps) {
  const [platforms, setPlatforms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlatforms() {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch list metadata for shop-platforms
        const listData = await getListByPath('shop-platforms')
        if (!listData) {
          setError(`List not found: shop-platforms`)
          return
        }

        // Query all shop platforms with OAuth functions
        const query = `
          query {
            shopPlatforms {
              id
              name
              appKey
              appSecret
              oAuthFunction
              oAuthCallbackFunction
            }
          }
        `;

        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        const result = await response.json();
        console.log('PlatformSelect fetch result:', result);

        if (result.errors) {
          setError(result.errors[0].message);
          return;
        }

        if (result.data?.shopPlatforms) {
          setPlatforms(result.data.shopPlatforms);
          console.log('PlatformSelect platforms loaded:', result.data.shopPlatforms);
        } else {
          setError('No platforms found');
        }
      } catch (err) {
        console.error('Error fetching platforms:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        toast.error('Failed to load platforms')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlatforms()
  }, [])

  if (isLoading) {
    return <PlatformSelectSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label className="text-base">Platform</Label>
        <div className="p-4 text-center text-destructive border rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-base">Platform</Label>
      <Select 
        value={value} 
        onValueChange={(newValue) => {
          onValueChange(newValue);
          // Find and pass the platform data
          const platform = platforms.find(p => p.id === newValue);
          if (platform && onPlatformDataChange) {
            onPlatformDataChange(platform);
          }
        }}
      >
        <SelectTrigger className="w-full bg-muted/40 text-base">
          <SelectValue placeholder="Select a platform" />
        </SelectTrigger>
        <SelectContent>
          {platforms.map((platform) => {
            console.log('Rendering platform:', platform);
            return (
              <SelectItem key={platform.id} value={platform.id}>
                {platform.name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}