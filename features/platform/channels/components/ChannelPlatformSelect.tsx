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

interface ChannelPlatformSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  onPlatformDataChange?: (platform: any) => void;
}

function ChannelPlatformSelectSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function ChannelPlatformSelect({ 
  value,
  onValueChange,
  onPlatformDataChange
}: ChannelPlatformSelectProps) {
  const [platforms, setPlatforms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlatforms() {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch list metadata for channel-platforms
        const listData = await getListByPath('channel-platforms')
        if (!listData) {
          setError(`List not found: channel-platforms`)
          return
        }

        // Query all channel platforms with OAuth functions
        const query = `
          query {
            channelPlatforms {
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
        console.log('ChannelPlatformSelect fetch result:', result);

        if (result.errors) {
          setError(result.errors[0].message);
          return;
        }

        if (result.data?.channelPlatforms) {
          setPlatforms(result.data.channelPlatforms);
          console.log('ChannelPlatformSelect platforms loaded:', result.data.channelPlatforms);
        } else {
          setError('No platforms found');
        }
      } catch (err) {
        console.error('Error fetching channel platforms:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        toast.error('Failed to load channel platforms')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlatforms()
  }, [])

  if (isLoading) {
    return <ChannelPlatformSelectSkeleton />;
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
            console.log('Rendering channel platform:', platform);
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