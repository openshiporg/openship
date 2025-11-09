/**
 * ChannelListPageClient - Client Component
 * Based on dashboard ListPageClient but hardcoded for channels
 * Now using React Query for data fetching with SSR hydration
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { PageBreadcrumbs } from '../../../dashboard/components/PageBreadcrumbs'
import { PlatformFilterBar } from '../../components/PlatformFilterBar'
import { StatusTabs } from '../../components/StatusTabs'
import { ChannelDetailsComponent } from '../components/ChannelDetailsComponent'
import { ChannelListClient } from '../components/ChannelListClient'
import { ChannelsPageClient } from '../components/ChannelsPageClient'
import { CreateChannel } from '../components/CreateChannel'
import { CreateChannelFromURL } from '../components/CreateChannelFromURL'
import { Pagination } from '../../../dashboard/components/Pagination'
import { FilterList } from '../../../dashboard/components/FilterList'
import { useDashboard } from '../../../dashboard/context/DashboardProvider'
import { useSelectedFields } from '../../../dashboard/hooks/useSelectedFields'
import { useSort } from '../../../dashboard/hooks/useSort'
import { useListItemsQuery } from '../../../dashboard/hooks/useListItems.query'
import { buildOrderByClause } from '../../../dashboard/lib/buildOrderByClause'
import { buildWhereClause } from '../../../dashboard/lib/buildWhereClause'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
  platforms?: any[]
  searchParams?: any
}

export function ChannelListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams,
  statusCounts,
  platforms = [],
  searchParams: searchParamsFromServer = {}
}: ChannelListPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { basePath } = useDashboard()
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

  // For channels, use raw GraphQL string to include relationship fields (from working repomix)
  const querySelectedFields = `
    id
    name
    domain
    accessToken
    metadata
    createdAt
    updatedAt
    webhooks
    platform {
      id
      name
    }
    user {
      id
      name
      email
    }
    channelItems {
      id
    }
    links {
      id
    }
  `

  // Use React Query hook with server-side initial data
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
    <section aria-label="Channels overview" className="overflow-hidden flex flex-col">
      <PageBreadcrumbs
        items={[
          { type: "link", label: "Dashboard", href: "/" },
          { type: "page", label: "Platform" },
          { type: "page", label: "Channels" },
        ]}
      />

      <div className="flex flex-col flex-1 min-h-0">
        <div className="border-gray-200 dark:border-gray-800">
          <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Channels
            </h1>
            <p className="text-muted-foreground">
              <span>Create and manage your connected channels</span>
            </p>
          </div>
        </div>

        <div className="px-4 md:px-6">
          <PlatformFilterBar
            list={list}
            customCreateButton={<CreateChannel />}
          />
        </div>

        <ChannelsPageClient
          platforms={platforms.map((p: any) => ({
            id: p.id,
            name: p.name,
            channelsCount: p.channels?.length || 0
          }))}
          totalCount={data?.count || 0}
        />

        <div className="flex-1 overflow-auto">
          {error ? (
            <div className="px-4 md:px-6">
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to load items: {error}
                </AlertDescription>
              </Alert>
            </div>
          ) : data && data.items && data.items.length > 0 ? (
            <ChannelListClient channels={data.items} />
          ) : (
            <div className="flex items-center justify-center h-full py-10">
              <div className="text-center">
                <div className="relative h-11 w-11 mx-auto mb-2">
                  <Triangle className="absolute left-1 top-1 w-4 h-4 fill-indigo-200 stroke-indigo-400 dark:stroke-indigo-600 dark:fill-indigo-950 rotate-[90deg]" />
                  <Square className="absolute right-[.2rem] top-1 w-4 h-4 fill-orange-300 stroke-orange-500 dark:stroke-amber-600 dark:fill-amber-950 rotate-[30deg]" />
                  <Circle className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-900" />
                </div>
                <p className="font-medium">No channels found</p>
                <p className="text-muted-foreground text-sm">
                  {searchString
                    ? "Try adjusting your search or filter criteria"
                    : "Connect your first channel to get started"}
                </p>
                {searchString && (
                  <Link href="/dashboard/platform/channels">
                    <Button variant="outline" className="mt-4" size="sm">
                      Clear filters
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data && data.items && data.items.length > 0 && (
        <Pagination
          currentPage={currentPage}
          total={data.count}
          pageSize={pageSize}
          list={{
            singular: "Channel",
            plural: "Channels"
          }}
        />
      )}

      {/* Auto-opening create channel dialog for OAuth redirects */}
      <CreateChannelFromURL searchParams={searchParamsFromServer} />
    </section>
  )
}
