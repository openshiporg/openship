import React from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { getListByPath } from '@/features/dashboard/actions/getListByPath'
import { getItemAction } from '@/features/dashboard/actions/getItemAction'
import { Skeleton } from '@/components/ui/skeleton'
import { EditItemDrawerClient } from './EditItemDrawerClient'

interface EditItemDrawerProps {
  listKey: string
  itemId: string
  open: boolean
  onClose: () => void
  onSave?: (updatedItem: any) => void
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-6 border-b">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex-shrink-0 p-6 border-t">
        <div className="flex gap-2 justify-end">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}

// Server Component - handles data fetching
export async function EditItemDrawer({
  listKey,
  itemId,
  open,
  onClose,
  onSave
}: EditItemDrawerProps) {
  // If not open, render empty drawer
  if (!open) {
    return (
      <Drawer open={false} onOpenChange={onClose}>
        <DrawerContent />
      </Drawer>
    )
  }

  try {
    // Fetch list metadata and item data on server
    const list = await getListByPath(listKey)

    if (!list) {
      return (
        <Drawer open={open} onOpenChange={onClose}>
          <DrawerContent>
            <DrawerHeader className="flex-shrink-0">
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <div className="p-6 text-center">
              <p className="text-destructive">List not found: {listKey}</p>
            </div>
          </DrawerContent>
        </Drawer>
      )
    }

    const itemResponse = await getItemAction(list, itemId)

    if (!itemResponse.success || !itemResponse.data?.item) {
      return (
        <Drawer open={open} onOpenChange={onClose}>
          <DrawerContent>
            <DrawerHeader className="flex-shrink-0">
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <div className="p-6 text-center">
              <p className="text-destructive">
                Failed to load item: {'error' in itemResponse ? itemResponse.error : 'Unknown error'}
              </p>
            </div>
          </DrawerContent>
        </Drawer>
      )
    }

    // Render the client component with fetched data
    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent className="flex flex-col">
          <EditItemDrawerClient
            list={list}
            item={itemResponse.data.item}
            itemId={itemId}
            onClose={onClose}
            onSave={onSave}
          />
        </DrawerContent>
      </Drawer>
    )
  } catch (error) {
    console.error('Error in EditItemDrawer:', error)
    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle>Error</DrawerTitle>
          </DrawerHeader>
          <div className="p-6 text-center">
            <p className="text-destructive">
              Error loading drawer: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }
}
