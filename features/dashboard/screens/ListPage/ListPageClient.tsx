/**
 * ListPageClient - Client Component  
 * Based on Keystone's ListPage implementation but using ShadCN components
 * Follows the same pattern as ItemPageClient
 */

'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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