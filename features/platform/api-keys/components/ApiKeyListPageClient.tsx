/**
 * ApiKeyListPageClient - Client Component for API Keys Platform Page
 * Based on dashboard ListPageClient but with platform-specific layout and PlatformFilterBar
 */

'use client'

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  
  // Hooks for field selection
  const selectedFields = useSelectedFields(list)

  // Extract data from props
  const data = initialData
  const error = initialError
  const currentPage = initialSearchParams.page
  const pageSize = initialSearchParams.pageSize
  const searchString = initialSearchParams.search

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