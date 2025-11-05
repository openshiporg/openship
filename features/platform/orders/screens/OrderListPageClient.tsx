/**
 * OrderListPageClient - Client Component
 * Based on dashboard ListPageClient but hardcoded for orders
 * Now using React Query for data fetching with SSR hydration
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  SearchX,
  Triangle,
  Square,
  Circle,
  Search,
  CirclePlus,
  ChevronDown,
  Plus
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { PageContainer } from '../../../dashboard/components/PageContainer'
import { PlatformFilterBar } from '../../components/PlatformFilterBar'
import { StatusTabs } from '../../components/StatusTabs'
import { OrderDetailsComponent } from '../components/OrderDetailsComponent'
import { OrderPageClient } from './OrderPageClient'
import { ProcessOrdersDialog } from '../components/ProcessOrdersDialog'
import { OrdersPagination } from '../components/OrdersPagination'
import { FilterList } from '../../../dashboard/components/FilterList'
import { useDashboard } from '../../../dashboard/context/DashboardProvider'
import { useSelectedFields } from '../../../dashboard/hooks/useSelectedFields'
import { useSort } from '../../../dashboard/hooks/useSort'
import { useListItemsQuery } from '../../../dashboard/hooks/useListItems.query'
import { buildOrderByClause } from '../../../dashboard/lib/buildOrderByClause'
import { buildWhereClause } from '../../../dashboard/lib/buildWhereClause'
import { placeOrders, addToCart, matchOrder, addMatchToCart, deleteOrder, deleteOrders } from '../actions/orders'
import { toast } from "sonner"
import { SearchOrders } from '../../shops/components/SearchOrders'
import { OrderDetailsDialog } from '../../shops/components/OrderDetailsDialog'

interface OrderListPageClientProps {
  list: any
  initialData: { items: any[], count: number }
  initialError: string | null
  initialSearchParams: {
    page: number
    pageSize: number  
    search: string
  }
  statusCounts: {
    PENDING: number
    all: number
    INPROCESS: number
    AWAITING: number
    BACKORDERED: number
    CANCELLED: number
    COMPLETE: number
  } | null
  channels: any[]
  shops: any[]
}

export function OrderListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams,
  statusCounts,
  channels,
  shops
}: OrderListPageClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const { basePath } = useDashboard()
  const [selectedItems, setSelectedItems] = useState(new Set<string>())
  const [isProcessOrdersDialogOpen, setIsProcessOrdersDialogOpen] = useState(false)
  const [processingOrders, setProcessingOrders] = useState<string[]>([])
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSelectedItems = new Set(prev)
      if (checked) {
        newSelectedItems.add(id)
      } else {
        newSelectedItems.delete(id)
      }
      return newSelectedItems
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(data?.items?.map((item: any) => item.id) || []))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleProcessOrders = async (orderIds: string[]) => {
    setProcessingOrders(orderIds)
    const response = await placeOrders(orderIds)
    if (response.success) {
      // Invalidate React Query cache to refetch orders
      await queryClient.invalidateQueries({
        queryKey: ['lists', list.key, 'items']
      })
    }
    setProcessingOrders([])
    setIsProcessOrdersDialogOpen(false)
  }

  const handleAction = async (action: string, orderId: string, data?: any) => {
    try {
      let response;
      if (action === 'addToCart') {
        response = await addToCart({ ...data, quantity: String(data.quantity), orderId });
      } else if (action === 'matchOrder') {
        response = await matchOrder(orderId);
      } else if (action === 'getMatch') {
        response = await addMatchToCart(orderId);
      } else if (action === 'saveMatch') {
        response = await matchOrder(orderId);
      } else if (action === 'placeOrder') {
        response = await placeOrders([orderId]);
      } else if (action === 'deleteOrder') {
        response = await deleteOrder(orderId);
      }

      if (response?.success) {
        // Invalidate React Query cache to refetch orders
        await queryClient.invalidateQueries({
          queryKey: ['lists', list.key, 'items']
        })
      } else if(response?.error) {
        throw new Error(response?.error || 'An unknown error occurred.');
      }
    } catch (error: any) {
      console.error('Action failed:', error.message);
    }
  }
  // Hooks for sorting and field selection
  const selectedFields = useSelectedFields(list)
  const sort = useSort(list)

  // Extract current search params (reactive to URL changes)
  const currentSearchParams = useMemo(() => {
    const params: Record<string, string> = {}
    searchParams?.forEach((value, key) => {
      params[key] = value
    })
    return params
  }, [searchParams])

  const currentPage = parseInt(currentSearchParams.page || '1', 10) || 1
  const pageSize = parseInt(currentSearchParams.pageSize || list.pageSize?.toString() || '50', 10)
  const searchString = currentSearchParams.search || ''

  // Build query variables from current search params
  const variables = useMemo(() => {
    const orderBy = buildOrderByClause(list, currentSearchParams)
    const filterWhere = buildWhereClause(list, currentSearchParams)
    const searchParameters = searchString ? { search: searchString } : {}
    const searchWhere = buildWhereClause(list, searchParameters)

    // Combine search and filters
    const whereConditions = []
    if (Object.keys(searchWhere).length > 0) {
      whereConditions.push(searchWhere)
    }
    if (Object.keys(filterWhere).length > 0) {
      whereConditions.push(filterWhere)
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {}

    return {
      where,
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      orderBy
    }
  }, [list, currentSearchParams, currentPage, pageSize, searchString])

  // For orders, use raw GraphQL string to include relationship fields
  const querySelectedFields = `
    id orderId orderName email firstName lastName streetAddress1 streetAddress2 city state zip country phone currency totalPrice subTotalPrice totalDiscounts totalTax status error createdAt updatedAt
    user { id name email }
    shop { id name domain accessToken }
    lineItems { id name image price quantity productId variantId sku lineItemId }
    cartItems { id name image price quantity productId variantId sku purchaseId url error channel { id name } }
  `

  // Use React Query hook with server-side initial data
  const { data: queryData, error: queryError, isLoading, isFetching } = useListItemsQuery(
    {
      listKey: list.key,
      variables,
      selectedFields: querySelectedFields
    },
    {
      initialData: initialError ? undefined : initialData,
    }
  )

  // Use query data, fallback to initial data
  const data = queryData || initialData
  const error = queryError ? queryError.message : initialError

  // Handle page change - simplified since FilterBar handles search/filters
  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(window.location.search)
    
    if (newPage && newPage > 1) {
      params.set('page', newPage.toString())
    } else {
      params.delete('page')
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.push(newUrl)
  }, [router])

  const handleCreateOrder = (type: 'scratch' | 'existing') => {
    if (type === 'scratch') {
      setSelectedOrder('scratch')
    } else {
      setIsCreateOrderDialogOpen(true)
    }
  }

  const handleOrderSelect = (order: any) => {
    setSelectedOrder(order)
    setIsCreateOrderDialogOpen(false)
  }

  const handleOrderCreated = async (order: any) => {
    // Invalidate React Query cache to show the newly created order
    await queryClient.invalidateQueries({
      queryKey: ['lists', list.key, 'items']
    })
  }

  const handleResetFilters = () => {
    const params = new URLSearchParams()
    router.push(window.location.pathname)
  }

  function EmptyStateDefault() {
    return (
      <EmptyState
        title="No Orders yet"
        description="Create your first order to get started."
        icons={[Triangle, Square, Circle]}
      />
    )
  }

  function EmptyStateSearch() {
    return (
      <EmptyState
        title="No results found"
        description="No orders found. Try adjusting your search or filters."
        icons={[Search]}
        action={{
          label: "Clear filters",
          onClick: handleResetFilters
        }}
      />
    )
  }

  const handleDeleteOrders = async () => {
    const idsToDelete = Array.from(selectedItems)
    if (idsToDelete.length === 0) return

    setIsDeleteLoading(true)
    try {
      const response = await deleteOrders(idsToDelete)
      
      if (response.success) {
        toast.success(`Successfully deleted ${idsToDelete.length} ${idsToDelete.length === 1 ? 'order' : 'orders'}`)
        // Clear selection and invalidate cache
        setSelectedItems(new Set())
        await queryClient.invalidateQueries({
          queryKey: ['lists', list.key, 'items']
        })
      } else {
        const errorMessage = response.error || 'Delete failed'
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('Delete orders failed:', error)
      toast.error(errorMessage)
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const CreateOrderDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="lg:px-4 lg:py-2 lg:w-auto rounded-lg">
          <CirclePlus />
          <span className="hidden lg:inline">Create Order</span>
          <ChevronDown
            className="-me-1 ml-2 opacity-60"
            size={16}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => handleCreateOrder('scratch')}
          className="text-muted-foreground flex gap-2 font-medium"
        >
          <Plus className="h-4 w-4" />
          From Scratch
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleCreateOrder('existing')}
          className="text-muted-foreground flex gap-2 font-medium"
        >
          <SearchX className="h-4 w-4" />
          From Existing
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (!list) {
    return (
      <PageContainer title="List not found">
        <Alert variant="destructive">
          <AlertDescription>
            The requested list was not found.
          </AlertDescription>
        </Alert>
      </PageContainer>
    )
  }

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: basePath },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: 'Orders' }
  ]

  const header = (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
        Orders
      </h1>
      <p className="text-muted-foreground">
        Create and manage orders
      </p>
    </div>
  )

  // Check if we have any active filters (search or actual filters)
  const hasFilters = !!searchString
  const isFiltered = hasFilters
  const isEmpty = data?.count === 0 && !isFiltered

  return (
    <PageContainer title="Orders" header={header} breadcrumbs={breadcrumbs}>
      {/* Filter Bar - includes search, filters, sorting, and create button */}
      <div className="px-4 md:px-6">
        <PlatformFilterBar list={list} customCreateButton={<CreateOrderDropdown />} />
      </div>

      {/* Status Tabs */}
      {statusCounts && (
        <div className="border-b">
          <StatusTabs 
            statusCounts={statusCounts}
            statusConfig={{
                      "PENDING": {
                                "label": "Pending",
                                "color": "emerald"
                      },
                      "INPROCESS": {
                                "label": "In Process",
                                "color": "blue"
                      },
                      "AWAITING": {
                                "label": "Awaiting",
                                "color": "purple"
                      },
                      "BACKORDERED": {
                                "label": "Backordered",
                                "color": "orange"
                      },
                      "CANCELLED": {
                                "label": "Cancelled",
                                "color": "red"
                      },
                      "COMPLETE": {
                                "label": "Complete",
                                "color": "cyan"
                      }
            }}
            entityName="Orders"
            onSelectAll={handleSelectAll}
            selectedItems={selectedItems}
            totalItems={data?.items?.length || 0}
          />
        </div>
      )}

      {/* Active Filters */}
      <div className="px-4 md:px-6 border-b">
        <FilterList list={list} />
      </div>

      {/* Orders list */}
      {error ? (
        <div className="px-4 md:px-6">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load items: {error}
            </AlertDescription>
          </Alert>
        </div>
      ) : isEmpty ? (
        <div className="px-4 md:px-6">
          <EmptyStateDefault />
        </div>
      ) : data?.count === 0 ? (
        <div className="px-4 md:px-6">
          <EmptyStateSearch />
        </div>
      ) : (
        <>
          {/* Data grid using OrderPageClient with proper action handling */}
          <OrderPageClient
            orders={data?.items || []}
            channels={channels}
            selectedOrders={selectedItems}
            onSelectedOrdersChange={setSelectedItems}
            listKey={list.key}
          />
          
          {/* Pagination - Always show to display Process Orders button when items are selected */}
          {data && (
            <div className="px-4 md:px-6 py-4">
              <OrdersPagination
                currentPage={currentPage}
                total={data.count}
                pageSize={pageSize}
                list={{ singular: 'order', plural: 'orders' }}
                selectedItems={selectedItems}
                onResetSelection={() => setSelectedItems(new Set())}
                onDelete={handleDeleteOrders}
                isDeleteLoading={isDeleteLoading}
                renderActions={(selectedItems) => (
                  <Button
                    onClick={() => setIsProcessOrdersDialogOpen(true)}
                    variant="default"
                    className="font-semibold rounded-md gap-3"
                  >
                    <span className="truncate uppercase tracking-wide">
                      Process {selectedItems.size}{" "}
                      {selectedItems.size === 1 ? 'Order' : 'Orders'}
                    </span>
                  </Button>
                )}
              />
            </div>
          )}
        </>
      )}

      <ProcessOrdersDialog
        isOpen={isProcessOrdersDialogOpen}
        onClose={() => {
          setIsProcessOrdersDialogOpen(false)
          setProcessingOrders([])
        }}
        orders={data?.items?.filter((order: any) => selectedItems.has(order.id)) || []}
        onProcessOrders={handleProcessOrders}
        processingOrders={processingOrders}
        channels={channels}
        onAction={handleAction}
      />

      <Drawer
        open={isCreateOrderDialogOpen}
        onOpenChange={setIsCreateOrderDialogOpen}
      >
        <DrawerContent className="flex flex-col">
          <DrawerHeader>
            <DrawerTitle>Search Existing Orders</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <SearchOrders
              shops={shops}
              searchEntry=""
              onOrderSelect={handleOrderSelect}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <OrderDetailsDialog
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        onOrderCreated={handleOrderCreated}
        order={selectedOrder === "scratch" ? null : selectedOrder}
        shopId={selectedOrder?.shop?.id}
        shops={shops}
        channels={channels}
      />
    </PageContainer>
  )
}
