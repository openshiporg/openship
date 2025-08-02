/**
 * HomePage for Dashboard 2 - Server Component
 * Follows Dashboard1's server-side rendering approach
 */

import React from 'react'
import Link from 'next/link'
import { PlusIcon, Database } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageContainer } from '../../components/PageContainer'
import { getAdminMetaAction, getListCounts } from '../../actions'
import { cn } from '@/lib/utils'

interface ListCardProps {
  list: any
  count?: number | null
  hideCreate?: boolean
}

function ListCard({ list, count, hideCreate = false }: ListCardProps) {
  const isSingleton = list.isSingleton || false
  const href = `/dashboard/${list.path}${isSingleton ? '/1' : ''}`

  return (
    <Card className={cn(
      'relative bg-gradient-to-bl from-background to-muted/80 shadow-xs hover:bg-muted transition-colors'
    )}>
      <Link href={href}>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground">
            {list.label}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {isSingleton 
              ? 'Singleton' 
              : count === null || count === undefined
                ? 'Unknown'
                : `${count} item${count !== 1 ? 's' : ''}`
            }
          </p>
        </CardContent>
      </Link>
      
      {!hideCreate && !isSingleton && (
        <Link 
          href={`/dashboard/${list.path}/create`}
          className="absolute top-3 right-3"
        >
          <Button
            variant="outline" 
            size="icon"
            className="h-7 w-7"
            title={`Add ${list.singular?.toLowerCase() || 'item'}`}
          >
            <PlusIcon className="h-4 w-4" />
            <span className="sr-only">Create new {list.label}</span>
          </Button>
        </Link>
      )}
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Database className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No lists configured</h3>
      <p className="text-muted-foreground">
        There are no data models configured in your admin interface.
      </p>
    </div>
  )
}

export async function HomePage() {
  // Fetch admin meta server-side
  const adminMetaResponse = await getAdminMetaAction()
  
  if (!adminMetaResponse.success) {
    console.error('Failed to fetch admin meta:', adminMetaResponse.error)
    return (
      <PageContainer 
        title="Dashboard" 
        header={<h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>}
        breadcrumbs={[{ type: 'page' as const, label: 'Dashboard' }]}
      >
        <EmptyState />
      </PageContainer>
    )
  }

  const adminMeta = adminMetaResponse.data
  const lists = adminMeta?.lists || []
  // Lists are already enhanced with gqlNames from getAdminMetaAction
  const enhancedLists = lists.filter((list: any) => !list.isHidden)

  // Fetch list counts server-side
  let countData: Record<string, number> = {}
  if (enhancedLists.length > 0) {
    const countResponse = await getListCounts(enhancedLists)
    if (countResponse.success && countResponse.data) {
      countData = countResponse.data
    }
  }

  const header = (
    <div className="flex flex-col">
      <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      {enhancedLists.length > 0 && (
        <p className="text-muted-foreground">{enhancedLists.length} Models</p>
      )}
    </div>
  )

  const breadcrumbs = [
    { type: 'page' as const, label: 'Dashboard' }
  ]

  if (enhancedLists.length === 0) {
    return (
      <PageContainer title="Dashboard" header={header} breadcrumbs={breadcrumbs}>
        <EmptyState />
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Dashboard" header={header} breadcrumbs={breadcrumbs}>
      <div className="w-full max-w-4xl p-4 md:p-6 flex flex-col gap-4">
        <div className="mb-4">
          <h2 className="tracking-wide uppercase font-medium mb-2 text-muted-foreground text-sm">
            Data Models
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-4">
            {enhancedLists.map((list: any) => (
              <ListCard
                key={list.key}
                list={list}
                count={countData[list.key] ?? null}
                hideCreate={list.hideCreate ?? false}
              />
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

export default HomePage