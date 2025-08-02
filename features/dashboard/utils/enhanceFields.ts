/**
 * enhanceFields - Transform raw fields into Keystone-compatible enhanced fields
 * This mimics exactly what Keystone does in their context provider
 */

import { getFieldViews } from '../views/registry'

const expectedExports = new Set(['Field', 'controller'])

export function enhanceFields(rawFields: Record<string, any>, listKey: string) {
  const enhancedFields: Record<string, any> = {}
  
  for (const [fieldPath, field] of Object.entries(rawFields)) {
    if (typeof field.viewsIndex !== 'number') {
      console.warn(`Field ${fieldPath} has invalid viewsIndex:`, field.viewsIndex)
      continue
    }

    try {
      // Validate field views - exact Keystone logic
      for (const exportName of expectedExports) {
        const fieldViews = getFieldViews(field.viewsIndex)
        if ((fieldViews as any)[exportName] === undefined) {
          throw new Error(
            `The view for the field at ${listKey}.${field.path} is missing the ${exportName} export`
          )
        }
      }

      const views = { ...getFieldViews(field.viewsIndex) }
      const customViews: Record<string, any> = {}
      
      // Handle custom views if they exist (Keystone logic)
      if (field.customViewsIndex !== null && field.customViewsIndex !== undefined) {
        const customViewsSource = getFieldViews(field.customViewsIndex) as any
        const allowedExportsOnCustomViews = new Set((views as any).allowedExportsOnCustomViews || [])
        
        for (const exportName in customViewsSource) {
          if (allowedExportsOnCustomViews.has(exportName)) {
            customViews[exportName] = customViewsSource[exportName]
          } else if (expectedExports.has(exportName)) {
            ;(views as any)[exportName] = customViewsSource[exportName]
          }
        }
      }

      // Create enhanced field exactly like Keystone
      enhancedFields[fieldPath] = {
        ...field,
        createView: {
          fieldMode: field.createView?.fieldMode ?? null,
          isRequired: field.createView?.isRequired ?? false,
        },
        itemView: {
          fieldMode: field.itemView?.fieldMode ?? null,
          fieldPosition: field.itemView?.fieldPosition ?? null,
          isRequired: field.itemView?.isRequired ?? false,
        },
        listView: {
          fieldMode: field.listView?.fieldMode ?? null,
        },
        graphql: {
          isNonNull: field.isNonNull || [],
        },
        views,
        controller: (views as any).controller({
          listKey: listKey,
          fieldMeta: field.fieldMeta,
          label: field.label,
          description: field.description,
          path: field.path,
          customViews,
        }),
      }
    } catch (error) {
      console.error(`Error enhancing field ${fieldPath}:`, error)
    }
  }
  
  return enhancedFields
}