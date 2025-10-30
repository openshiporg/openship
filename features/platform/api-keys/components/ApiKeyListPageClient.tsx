/**
 * ApiKeyListPageClient - Client Component for API Keys Platform Page
 * Uses React Query for data fetching
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Triangle,
  Square,
  Circle,
  Search
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs"
import { PlatformFilterBar } from '@/features/platform/components/PlatformFilterBar'
import { ListTable } from '@/features/dashboard/components/ListTable'
import { useSelectedFields } from '@/features/dashboard/hooks/useSelectedFields'
import { useSort } from '@/features/dashboard/hooks/useSort'
import { useListItemsQuery } from '@/features/dashboard/hooks/useListItems.query'
import { buildOrderByClause } from '@/features/dashboard/lib/buildOrderByClause'
import { buildWhereClause } from '@/features/dashboard/lib/buildWhereClause'
import { CreateApiKey } from './CreateApiKey'

interface ApiKeyListPageClientProps {
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

export function ApiKeyListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams
}: ApiKeyListPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Hooks for sorting and field selection
  const selectedFields = useSelectedFields(list)
  const sort = useSort(list)

  // Extract current search params (reactive to URL changes)
  const currentSearchParams = useMemo(() => {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
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

  // For api-keys, use raw GraphQL string to include relationship fields (from working repomix)
  const querySelectedFields = `
    id
    name
    tokenPreview
    scopes
    status
    expiresAt
    lastUsedAt
    usageCount
    restrictedToIPs
    createdAt
    updatedAt
    user {
      id
      name
      email
    }
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

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    router.push(window.location.pathname)
  }, [router])

  if (!list) {
    return (
      <section
        aria-label="API Keys overview"
        className="overflow-hidden flex flex-col"
      >
        <Alert variant="destructive">
          <AlertDescription>
            The requested list was not found.
          </AlertDescription>
        </Alert>
      </section>
    )
  }

  // Check if we have any active filters (search or actual filters)
  const hasFilters = !!searchString
  const isFiltered = hasFilters
  const isEmpty = data?.count === 0 && !isFiltered

  return (
    <section
      aria-label="API Keys overview"
      className="overflow-hidden flex flex-col"
    >
      <PageBreadcrumbs
        items={[
          {
            type: "link",
            label: "Dashboard",
            href: "/",
          },
          {
            type: "page",
            label: "Platform",
          },
          {
            type: "page",
            label: "API Keys",
          },
        ]}
      />

      <div className="flex flex-col flex-1 min-h-0">
        <div className="border-gray-200 dark:border-gray-800">
          <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              API Keys
            </h1>
            <p className="text-muted-foreground">
              <span>Create and manage secure API keys for programmatic access</span>
            </p>
          </div>
        </div>

        {/* Platform Filter Bar with custom create button */}
        <div className="px-4 md:px-6">
          <PlatformFilterBar
            list={{
              key: list.key,
              path: list.path,
              label: list.label,
              singular: list.singular,
              plural: list.plural,
              description: list.description || undefined,
              labelField: list.labelField as string,
              initialColumns: list.initialColumns,
              groups: list.groups as unknown as string[],
              graphql: {
                plural: list.plural,
                singular: list.singular
              },
              fields: list.fields
            }}
            customCreateButton={<CreateApiKey />}
            showDisplayButton={true}
            selectedFields={selectedFields}
          />
        </div>

        {/* Data table using dashboard ListTable component */}
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
      </div>
    </section>
  )
}
