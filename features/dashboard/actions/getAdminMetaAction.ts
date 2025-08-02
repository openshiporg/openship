/**
 * Get AdminMeta data - following Keystone's exact adminMetaQuery pattern
 */

'use server'

import { keystoneClient } from '../lib/keystoneClient'
import { getGraphQLNames } from '../lib/getGqlNames'

export async function getAdminMetaAction(listKey?: string) {
  try {
    // Exact copy of Keystone's adminMetaQuery from admin-meta-graphql.ts
    const query = `
      query KsFetchAdminMeta {
        keystone {
          adminMeta {
            lists {
              key
              itemQueryName
              listQueryName
              initialSort {
                field
                direction
              }
              path
              label
              singular
              plural
              description
              initialColumns
              initialSearchFields
              pageSize
              labelField
              isSingleton
              isHidden
              hideCreate
              hideDelete

              fields {
                path
                label
                description
                fieldMeta
                isOrderable
                isFilterable

                viewsIndex
                customViewsIndex

                search
                isNonNull
                createView {
                  fieldMode
                }
                itemView {
                  fieldMode
                  fieldPosition
                }
                listView {
                  fieldMode
                }
              }

              groups {
                label
                description
                fields {
                  path
                }
              }
            }
          }
        }
      }
    `

    const response = await keystoneClient(query)

    if (!response.success) {
      console.error('Failed to fetch admin meta:', response.error)
      return response
    }

    const adminMeta = response.data?.keystone?.adminMeta

    if (!adminMeta) {
      return {
        success: false,
        error: 'Admin meta not found in response'
      }
    }

    // If listKey is provided, filter to that specific list
    if (listKey) {
      const list = adminMeta.lists.find((l: any) => l.key === listKey)
      if (!list) {
        return {
          success: false,
          error: `List ${listKey} not found in admin meta`
        }
      }

      // Transform fields into a record for easier access
      const fields: Record<string, any> = {}
      list.fields.forEach((field: any) => {
        fields[field.path] = field
      })

      // Enhance with gqlNames (same as all-lists path)
      const gqlNames = getGraphQLNames(list.key, { plural: list.plural })

      return {
        success: true,
        data: {
          list: {
            ...list,
            fields, // Return fields as a record
            gqlNames,
            graphql: {
              names: gqlNames
            }
          }
        }
      }
    }

    // Enhance all lists with gqlNames before returning
    const enhancedLists = adminMeta.lists.map((list: any) => {
      const gqlNames = getGraphQLNames(list.key, { plural: list.plural })
      
      return {
        ...list,
        gqlNames,
        graphql: {
          names: gqlNames
        }
      }
    })

    // Return enhanced admin meta
    return {
      success: true,
      data: {
        ...adminMeta,
        lists: enhancedLists
      }
    }
  } catch (error) {
    console.error('Error in getAdminMetaAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}