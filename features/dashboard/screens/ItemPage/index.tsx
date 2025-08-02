/**
 * ItemPage - Server Component
 * Based on Keystone's ItemPage but adapted for server-side rendering
 */

import { getItemAction } from '../../actions/getItemAction'
import { getListByPath } from '../../actions/getListByPath'
import { getAdminMetaAction, getItemValidationAction } from '../../actions'
import { notFound } from 'next/navigation'
import { ItemPageClient } from './ItemPageClient'

interface ItemPageParams {
  params: Promise<{
    listKey: string
    id: string
  }>
}

export async function ItemPage({ params }: ItemPageParams) {
  const resolvedParams = await params
  const listKey = resolvedParams.listKey
  const itemId = resolvedParams.id

  const list = await getListByPath(listKey)

  if (!list) {
    notFound()
  }

  // Fetch item data with cache options
  const cacheOptions = {
    next: {
      tags: [`item-${list.key}-${itemId}`],
      revalidate: 3600,
    },
  }

  // Use the working dashboard action for item data
  const response = await getItemAction(list, itemId, {}, cacheOptions)

  let fetchedItem: Record<string, unknown> = {}

  if (response.success) {
    fetchedItem = response.data.item as Record<string, unknown>
  } else {
    console.error('Error fetching item:', response.error)
    fetchedItem = {}
  }

  // Get adminMeta for the list structure
  const adminMetaResponse = await getAdminMetaAction(list.key)
  
  // Get item-specific validation data (including isRequired)
  const validationResponse = await getItemValidationAction(list.key, itemId)
  
  // Extract the list with proper field metadata if successful
  const adminMetaList = adminMetaResponse.success ? adminMetaResponse.data.list : null
  
  // Create enhanced list with validation data
  const enhancedList = adminMetaList || list
  
  // Add validation data to the enhanced list
  if (validationResponse.success && enhancedList.fields) {
    Object.keys(enhancedList.fields).forEach(fieldPath => {
      const validation = validationResponse.data?.[fieldPath]
      if (validation && enhancedList.fields[fieldPath]) {
        enhancedList.fields[fieldPath].itemView = {
          ...enhancedList.fields[fieldPath].itemView,
          ...validation
        }
      }
    })
  }

  return (
    <ItemPageClient
      list={enhancedList}
      item={fetchedItem}
      itemId={itemId}
    />
  )
}

export default ItemPage