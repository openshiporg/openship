/**
 * ChannelListPageClient - Client Component  
 * Based on dashboard ListPageClient but hardcoded for channels
 */

'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  SearchX,
  Triangle,
  Square,
  Circle,
  Search
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { PageContainer } from '../../../dashboard/components/PageContainer'
import { PlatformFilterBar } from '../../components/PlatformFilterBar'
import { StatusTabs } from '../../components/StatusTabs'
import { ChannelDetailsComponent } from '../components/ChannelDetailsComponent'
import { Pagination } from '../../../dashboard/components/Pagination'
import { FilterList } from '../../../dashboard/components/FilterList'
import { useDashboard } from '../../../dashboard/context/DashboardProvider'
import { useSelectedFields } from '../../../dashboard/hooks/useSelectedFields'
import { useSort } from '../../../dashboard/hooks/useSort'

interface ChannelListPageClientProps {
  list: any
  initialData: { items: any[], count: number }
  initialError: string | null
  initialSearchParams: {
    page: number
    pageSize: number  
    search: string
  }
  statusCounts: {
    active: number
    all: number
    inactive: number
  } | null
}

export function ChannelListPageClient({ 
  list, 
  initialData, 
  initialError, 
  initialSearchParams,
  statusCounts
}: ChannelListPageClientProps) {
  const router = useRouter()
  const { basePath } = useDashboard()
  // Hooks for sorting and field selection
  const selectedFields = useSelectedFields(list)
  const sort = useSort(list)

  // Extract data from props
  const data = initialData
  const error = initialError
  const currentPage = initialSearchParams.page
  const pageSize = initialSearchParams.pageSize
  const searchString = initialSearchParams.search

  // Handle page change - simplified since FilterBar handles search/filters
  const handleResetFilters = () => {
    const params = new URLSearchParams()
    router.push(window.location.pathname)
  }

  function EmptyStateDefault() {
    return (
      <EmptyState
        title="No Channels yet"
        description="Create your first channel to get started."
        icons={[Triangle, Square, Circle]}
      />
    )
  }

  function EmptyStateSearch() {
    return (
      <EmptyState
        title="No results found"
        description="No channels found. Try adjusting your search or filters."
        icons={[Search]}
        action={{
          label: "Clear filters",
          onClick: handleResetFilters
        }}
      />
    )
  }

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
    { type: 'page' as const, label: 'Channels' }
  ]

  const header = (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
        Channels
      </h1>
      <p className="text-muted-foreground">
        Create and manage channels
      </p>
    </div>
  )

  // Check if we have any active filters (search or actual filters)
  const hasFilters = !!searchString
  const isFiltered = hasFilters
  const isEmpty = data?.count === 0 && !isFiltered

  return (
    <PageContainer title="Channels" header={header} breadcrumbs={breadcrumbs}>
      {/* Filter Bar - includes search, filters, sorting, and create button */}
      <div className="px-4 md:px-6">
        <PlatformFilterBar list={list} />
      </div>

      {/* Status Tabs */}
      {statusCounts && (
        <div className="border-b">
          <StatusTabs 
            statusCounts={statusCounts}
            statusConfig={{
                      "active": {
                                "label": "Active",
                                "color": "emerald"
                      },
                      "inactive": {
                                "label": "Inactive",
                                "color": "zinc"
                      }
            }}
            entityName="Channels"
          />
        </div>
      )}

      {/* Active Filters */}
      <div className="px-4 md:px-6 border-b">
        <FilterList list={list} />
      </div>

      {/* Channels list */}
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
          {/* Data grid - full width */}
          <div className="grid grid-cols-1 divide-y">
            {data?.items?.map((channel: any) => (
              <ChannelDetailsComponent key={channel.id} channel={channel} list={list} />
            ))}
          </div>
          
          {/* Pagination */}
          {data && data.count > pageSize && (
            <div className="px-4 md:px-6 py-4">
              <Pagination
                currentPage={currentPage}
                total={data.count}
                pageSize={pageSize}
                list={{ singular: 'channel', plural: 'channels' }}
              />
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}
