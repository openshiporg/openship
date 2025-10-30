/**
 * ListPageClient - Client Component
 * Based on Keystone's ListPage implementation but using ShadCN components
 * Now using React Query for data fetching with SSR hydration
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  SearchX,
  Table as TableIcon,
  Triangle,
  Square,
  Circle,
  Search
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { PageContainer } from '../../components/PageContainer'
import { FilterBar } from '../../components/FilterBar'
import { ListTable } from '../../components/ListTable'
import { useDashboard } from '../../context/DashboardProvider'
import { useSelectedFields } from '../../hooks/useSelectedFields'
import { useSort } from '../../hooks/useSort'
import { useListItemsQuery } from '../../hooks/useListItems.query'
import { buildOrderByClause } from '../../lib/buildOrderByClause'
import { buildWhereClause } from '../../lib/buildWhereClause'

interface ListPageClientProps {
  list: any
  initialData: { items: any[], count: number }
  initialError: string | null
  initialSearchParams: {
    page: number
    pageSize: number
    search: string
  }
}

function EmptyStateDefault({ list }: { list: any }) {
  return (
    <EmptyState
      title={`No ${list.label} Created`}
      description={`You can create a new ${list.singular.toLowerCase()} to get started.`}
      icons={[Triangle, Square, Circle]}
    />
  )
}

function EmptyStateSearch({ onResetFilters }: { onResetFilters: () => void }) {
  return (
    <EmptyState
      title="No Results Found"
      description="Try adjusting your search filters."
      icons={[Search]}
      action={{
        label: "Reset Filters",
        onClick: onResetFilters
      }}
    />
  )
}


export function ListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams
}: ListPageClientProps) {
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

  // Build selected fields from URL or defaults
  const querySelectedFields = useMemo(() => {
    let fields = ['id']

    if (currentSearchParams.fields) {
      const fieldsFromUrl = currentSearchParams.fields.split(',').filter(field => {
        return field in (list.fields || {})
      })
      fields = [...fields, ...fieldsFromUrl]
    } else {
      if (list.initialColumns && list.initialColumns.length > 0) {
        fields = [...fields, ...list.initialColumns]
      } else if (list.fields) {
        Object.keys(list.fields).forEach(fieldKey => {
          if (['name', 'title', 'label', 'createdAt', 'updatedAt'].includes(fieldKey)) {
            fields.push(fieldKey)
          }
        })
      }
    }

    return [...new Set(fields)]
  }, [currentSearchParams.fields, list.fields, list.initialColumns])

  // Use React Query hook with server-side initial data
  // IMPORTANT: Using placeholderData instead of initialData so invalidation works properly
  const { data: queryData, error: queryError, isLoading, isFetching } = useListItemsQuery(
    {
      listKey: list.key,
      variables,
      selectedFields: querySelectedFields
    },
    {
      // Use placeholderData to show server data immediately, but still allow refetching
      placeholderData: initialError ? undefined : initialData,
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

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    router.push(window.location.pathname)
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
    { type: 'page' as const, label: list.label }
  ]

  const header = (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
        {list.label}
      </h1>
      <p className="text-muted-foreground">
        {list.description || `Create and manage ${list.label.toLowerCase()}`}
      </p>
    </div>
  )

  // Check if we have any active filters (search or actual filters)
  const hasFilters = !!searchString
  const isFiltered = hasFilters
  const isEmpty = data?.count === 0 && !isFiltered

  return (
    <PageContainer title={list.label} header={header} breadcrumbs={breadcrumbs}>
      {/* Filter Bar - includes search, filters, sorting, field selection, and create button */}
      <div className="px-4 md:px-6">
        <FilterBar list={list} selectedFields={selectedFields} />
      </div>

      {/* Data table - full width */}
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
          <EmptyStateDefault list={list} />
        </div>
      ) : data?.count === 0 ? (
        <div className="px-4 md:px-6">
          <EmptyStateSearch onResetFilters={handleResetFilters} />
        </div>
      ) : (
        <ListTable
          data={data}
          list={list}
          selectedFields={selectedFields}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      )}
    </PageContainer>
  )
}