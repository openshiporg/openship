/**
 * CreatePageClient for Dashboard 2
 * Client component with form functionality matching ItemPage layout
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, ArrowLeft, AlertTriangle, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PageBreadcrumbs } from '../../components/PageBreadcrumbs'
import { useDashboard } from '../../context/DashboardProvider'
import { Fields } from '../../components/Fields'
import { useCreateItem } from '../../utils/useCreateItem'
import { enhanceFields } from '../../utils/enhanceFields'

interface CreatePageClientProps {
  listKey: string
  list: any
}

// Cancel Button Component (matches ItemPage pattern)
function CancelButton({ 
  onCancel,
  isDesktop = true 
}: { 
  onCancel: () => void;
  isDesktop?: boolean;
}) {
  return (
    <Button variant="outline" size="sm" className="text-xs" onClick={onCancel}>
      <X className="size-3 shrink-0" />
      {isDesktop ? (
        'Cancel'
      ) : (
        <span className="hidden sm:inline">Cancel</span>
      )}
    </Button>
  )
}

export function CreatePageClient({ listKey, list }: CreatePageClientProps) {
  const { basePath } = useDashboard()
  const router = useRouter()
  
  // Create enhanced fields like Keystone does - same pattern as ItemPage
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields || {}, list.key)
  }, [list.fields, list.key])
  
  // Use the create item hook with enhanced fields
  const createItem = useCreateItem(list, enhancedFields)

  const handleSave = useCallback(async () => {
    if (!createItem) return
    
    const item = await createItem.create()
    if (item?.id) {
      router.push(`${basePath}/${list.path}/${item.id}`)
    } else {
      console.error('No item.id in response:', item)
    }
  }, [createItem, router, basePath, list])

  const handleCancel = useCallback(() => {
    router.push(`${basePath}/${list.path}`)
  }, [router, basePath, list])

  if (!list) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            The requested list "{listKey}" was not found.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!createItem) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to initialize creation form for {list.label}.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { type: 'link' as const, label: 'Dashboard', href: '/' },
    { type: 'link' as const, label: list.label, href: `/${list.path}` },
    { type: 'page' as const, label: 'Create' }
  ]

  // Split fields by position for sidebar/main layout (same pattern as ItemPage)
  const fieldsSplit = useMemo(() => {
    const sidebarFields: Record<string, any> = {}
    const mainFields: Record<string, any> = {}
    
    Object.entries(enhancedFields).forEach(([key, field]) => {
      // For now, put all fields in main - same as ItemPage logic
      mainFields[key] = field
    })
    
    return { sidebarFields, mainFields }
  }, [enhancedFields])

  return (
    <>
      {/* Breadcrumbs */}
      <PageBreadcrumbs 
        items={breadcrumbItems} 
        actions={
          <Button
            size="sm"
            className="sm:text-sm text-xs"
            onClick={handleSave}
            disabled={createItem.state === 'loading'}
          >
            Create {list.singular}
            <Check className="ml-1 stroke-[1.5px]" width="8" height="8" />
          </Button>
        }
      />
      
      <main className="w-full max-w-5xl p-4 md:p-6">
        <div className="grid lg:grid-cols-[minmax(240px,2fr)_3fr] gap-6 gap-y-8 min-h-[calc(100vh-8rem)]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7.5rem)] flex flex-col h-full">
            <div className="space-y-6 flex-grow overflow-y-auto pb-2">
              <div>
                <h1
                  className="text-lg font-semibold md:text-2xl"
                  title={`Create ${list.singular}`}
                >
                  Create {list.singular}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Add a new {list.singular.toLowerCase()} to {list.label.toLowerCase()}
                </p>
              </div>

              {/* Sidebar Fields (if any) */}
              {Object.keys(fieldsSplit.sidebarFields).length > 0 && (
                <Fields {...createItem.props} fields={fieldsSplit.sidebarFields} view="createView" groups={list.groups} />
              )}
            </div>

          </aside>


          {/* Main content */}
          <div className="space-y-6">
            {/* GraphQL errors */}
            {(createItem.error?.networkError || createItem.error?.graphQLErrors?.length) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {createItem.error.networkError?.message || 
                   createItem.error.graphQLErrors?.[0]?.message ||
                   'An error occurred while creating the item'
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Main Fields */}
            {Object.keys(fieldsSplit.mainFields).length > 0 && (
              <Fields {...createItem.props} fields={fieldsSplit.mainFields} view="createView" groups={list.groups} />
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default CreatePageClient