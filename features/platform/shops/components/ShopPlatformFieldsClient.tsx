'use client';

import React, { useEffect, useState } from 'react';
import { EditItemDrawerClient } from '@/features/platform/components/EditItemDrawerClient';
import { getListByPath } from '@/features/dashboard/actions/getListByPath';
import { getItemAction } from '@/features/dashboard/actions/getItemAction';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ShopPlatformFieldsClientProps {
  platformId: string;
  value: any;
  onChange: (value: any) => void;
  forceValidation?: boolean;
}

function ShopPlatformFieldsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-3">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ShopPlatformFieldsClient({ 
  platformId,
  value, 
  onChange, 
  forceValidation 
}: ShopPlatformFieldsClientProps) {
  const [list, setList] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch list metadata - EXACTLY like EditItemDrawerClientWrapper
        const listData = await getListByPath('shop-platforms')
        if (!listData) {
          setError(`List not found: shop-platforms`)
          return
        }
        setList(listData)

        // Fetch item data - EXACTLY like EditItemDrawerClientWrapper
        const itemResponse = await getItemAction(listData, platformId)
        if (!itemResponse.success || !itemResponse.data?.item) {
          setError(itemResponse.error || 'Failed to load item')
          return
        }
        setItem(itemResponse.data.item)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        toast.error('Failed to load item data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [platformId])

  if (isLoading) {
    return <ShopPlatformFieldsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        {error}
      </div>
    );
  }

  if (!list || !item) {
    return (
      <div className="p-4 text-center text-destructive">
        No platform data available
      </div>
    );
  }

  // Just render the EditItemDrawerClient content without the drawer wrapper
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        Platform: {item.name || 'Configuration'}
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditItemDrawerClient
          list={list}
          item={item}
          itemId={platformId}
          onClose={() => {}}
          onSave={() => {}}
        />
      </div>
    </div>
  );
}