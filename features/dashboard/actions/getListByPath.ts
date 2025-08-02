/**
 * Get list metadata by path - uses consistent enhancement pattern
 */

'use server'

import { getAdminMetaAction } from './getAdminMetaAction'

export async function getListByPath(path: string) {
  try {
    const response = await getAdminMetaAction()
    
    if (!response.success) {
      return undefined
    }

    const adminMeta = response.data
    if (!adminMeta?.lists) {
      return undefined
    }

    // Find the list by path
    const rawList = adminMeta.lists.find((l: any) => l.path === path)
    
    if (!rawList) {
      return undefined
    }

    // Transform fields into a record for easier access
    const fields: Record<string, any> = {}
    rawList.fields.forEach((field: any) => {
      fields[field.path] = field
    })

    // List is already enhanced with gqlNames from getAdminMetaAction
    return {
      ...rawList,
      fields // Return fields as a record
    }
  } catch (error) {
    console.error('Error in getListByPath:', error)
    return undefined
  }
}