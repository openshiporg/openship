/**
 * Build WHERE clause from URL search parameters
 * Server-side filter processing without React components
 * Based on Keystone's useFilters implementation
 */

import { getFieldTypeFromViewsIndex } from '../views/getFieldTypeFromViewsIndex'

export type Filter = {
  field: string
  type: string
  value: any
  fieldPath: string
  fieldMeta: any
}

// Server-side filter mappings for different field types - extracted from field controllers
const FIELD_FILTER_MAPPINGS: Record<string, {
  types: Record<string, { label: string; initialValue: any }>;
  graphql: (fieldPath: string, fieldMeta: any) => (args: { type: string; value: any }) => Record<string, any>;
  parseGraphQL?: (fieldPath: string, fieldMeta: any) => (value: any) => Array<{ type: string; value: any }>;
}> = {
  text: {
    types: {
      contains_i: { label: 'Contains', initialValue: '' },
      not_contains_i: { label: 'Does not contain', initialValue: '' },
      is_i: { label: 'Is exactly', initialValue: '' },
      not_i: { label: 'Is not exactly', initialValue: '' },
      starts_with_i: { label: 'Starts with', initialValue: '' },
      not_starts_with_i: { label: 'Does not start with', initialValue: '' },
      ends_with_i: { label: 'Ends with', initialValue: '' },
      not_ends_with_i: { label: 'Does not end with', initialValue: '' },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string }) => {
      const isNot = type.startsWith('not_')
      const key = type === 'is_i' || type === 'not_i'
        ? 'equals'
        : type
            .replace(/_i$/, '')
            .replace('not_', '')
            .replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
      
      const baseFilter = { 
        [key]: value,
        ...(fieldMeta?.shouldUseModeInsensitive ? { mode: 'insensitive' } : {})
      }
      
      return {
        [fieldPath]: isNot ? { not: baseFilter } : baseFilter,
      }
    },
  },
  checkbox: {
    types: {
      is: { label: 'Is', initialValue: true },
      not: { label: 'Is not', initialValue: true },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: boolean }) => {
      return {
        [fieldPath]: {
          equals: type === 'not' ? !value : value,
        },
      }
    },
  },
  integer: {
    types: {
      equals: { label: 'Is exactly', initialValue: null },
      not: { label: 'Is not exactly', initialValue: null },
      gt: { label: 'Is greater than', initialValue: null },
      lt: { label: 'Is less than', initialValue: null },
      gte: { label: 'Is greater than or equal to', initialValue: null },
      lte: { label: 'Is less than or equal to', initialValue: null },
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: number }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      if (type === 'not') return { [fieldPath]: { not: { equals: value } } }
      return { [fieldPath]: { [type]: value } }
    },
  },
  float: {
    types: {
      equals: { label: 'Is exactly', initialValue: null },
      not: { label: 'Is not exactly', initialValue: null },
      gt: { label: 'Is greater than', initialValue: null },
      lt: { label: 'Is less than', initialValue: null },
      gte: { label: 'Is greater than or equal to', initialValue: null },
      lte: { label: 'Is less than or equal to', initialValue: null },
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      const val = value === null ? null : parseFloat(value)
      if (type === 'not') return { [fieldPath]: { not: { equals: val } } }
      return { [fieldPath]: { [type]: val } }
    },
  },
  bigInt: {
    types: {
      equals: { label: 'Is exactly', initialValue: null },
      not: { label: 'Is not exactly', initialValue: null },
      gt: { label: 'Is greater than', initialValue: null },
      lt: { label: 'Is less than', initialValue: null },
      gte: { label: 'Is greater than or equal to', initialValue: null },
      lte: { label: 'Is less than or equal to', initialValue: null },
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      if (type === 'not') return { [fieldPath]: { not: { equals: value } } }
      return { [fieldPath]: { [type]: value } }
    },
  },
  id: {
    types: {
      is: { label: 'Is exactly', initialValue: '' },
      not: { label: 'Is not exactly', initialValue: '' },
      gt: { label: 'Is greater than', initialValue: '' },
      lt: { label: 'Is less than', initialValue: '' },
      gte: { label: 'Is greater than or equal to', initialValue: '' },
      lte: { label: 'Is less than or equal to', initialValue: '' },
      in: { label: 'Is one of', initialValue: '' },
      not_in: { label: 'Is not one of', initialValue: '' },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string }) => {
      const valueWithoutWhitespace = value.replace(/\s/g, '');
      if (type === 'not') {
        return {
          [fieldPath]: {
            not: { equals: valueWithoutWhitespace },
          },
        };
      }
      const key = type === 'is' ? 'equals' : type === 'not_in' ? 'notIn' : type;
      return {
        [fieldPath]: {
          [key]: ['in', 'not_in'].includes(type)
            ? valueWithoutWhitespace.split(',')
            : valueWithoutWhitespace,
        },
      };
    },
  },
  select: {
    types: {
      matches: { label: 'Matches', initialValue: [] },
      not_matches: { label: 'Does not match', initialValue: [] },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string[] }) => {
      // Transform values like the field controller does
      const transformValue = (v: string | null) =>
        v === null ? null : fieldMeta?.type === 'integer' ? parseInt(v) : v
      
      return {
        [fieldPath]: {
          [type === 'not_matches' ? 'notIn' : 'in']: value.map(transformValue),
        },
      }
    },
  },
  timestamp: {
    types: {
      equals: { label: 'Is exactly', initialValue: null },
      not: { label: 'Is not exactly', initialValue: null },
      lt: { label: 'Is before', initialValue: null },
      gt: { label: 'Is after', initialValue: null },
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      if (type === 'not') return { [fieldPath]: { not: { equals: value } } }
      return { [fieldPath]: { [type]: value } }
    },
  },
  decimal: {
    types: {
      equals: { label: 'Is exactly', initialValue: null },
      not: { label: 'Is not exactly', initialValue: null },
      gt: { label: 'Is greater than', initialValue: null },
      lt: { label: 'Is less than', initialValue: null },
      gte: { label: 'Is greater than or equal to', initialValue: null },
      lte: { label: 'Is less than or equal to', initialValue: null },
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      if (type === 'not') return { [fieldPath]: { not: { equals: value } } }
      return { [fieldPath]: { [type]: value } }
    },
  },
  relationship: {
    types: {
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
      is: { label: 'Is', initialValue: null },
      not_is: { label: 'Is not', initialValue: null },
      some: { label: 'Is one of', initialValue: [] },
      not_some: { label: 'Is not one of', initialValue: [] },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string | string[] }) => {
      const many = fieldMeta?.many || false
      if (type === 'empty' && !many) return { [fieldPath]: { equals: null } }
      if (type === 'empty' && many) return { [fieldPath]: { none: {} } }
      if (type === 'not_empty' && !many) return { [fieldPath]: { not: { equals: null } } }
      if (type === 'not_empty' && many) return { [fieldPath]: { some: {} } }
      if (type === 'is') return { [fieldPath]: { id: { equals: value } } }
      if (type === 'not_is') return { [fieldPath]: { not: { id: { equals: value } } } }
      if (type === 'some') return { [fieldPath]: { some: { id: { in: value } } } }
      if (type === 'not_some') return { [fieldPath]: { not: { some: { id: { in: value } } } } }
      return { [fieldPath]: { [type]: value } }
    },
  },
  document: {
    types: {
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: any }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      return { [fieldPath]: { [type]: value } }
    },
  },
  json: {
    types: {
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: any }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      return { [fieldPath]: { [type]: value } }
    },
  },
  image: {
    types: {
      empty: { label: 'Has no image', initialValue: null },
      not_empty: { label: 'Has image', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: any }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      return { [fieldPath]: { [type]: value } }
    },
  },
  virtual: {
    types: {},
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: any }) => {
      // Virtual fields are not filterable
      return {}
    },
  },
}

function getFieldFilterMapping(fieldType: string, fieldMeta?: any) {
  const mapping = FIELD_FILTER_MAPPINGS[fieldType]
  if (!mapping) return null
  
  // For relationship fields, conditionally include filter types based on 'many' - exactly like Keystone field controllers
  if (fieldType === 'relationship') {
    const many = fieldMeta?.many || false
    return {
      ...mapping,
      types: {
        empty: { label: 'Is empty', initialValue: null },
        not_empty: { label: 'Is not empty', initialValue: null },
        ...(many
          ? {
              some: { label: 'Is one of', initialValue: [] },
              not_some: { label: 'Is not one of', initialValue: [] },
            }
          : {
              is: { label: 'Is', initialValue: null },
              not_is: { label: 'Is not', initialValue: null },
            }),
      },
    }
  }
  
  return mapping
}

export function buildWhereClause(
  list: any,
  searchParams: Record<string, any>
): Record<string, any> {
  const whereConditions: any[] = []

  // Handle search parameter - following dashboard1's exact logic
  if (searchParams?.search) {
    const searchConditions = []
    const searchTerm = searchParams.search.trim()
    
    // Check if the search term could be an ID (basic validation)
    const idField = list.fields?.id
    if (idField && searchTerm) {
      // For string IDs, add exact match
      searchConditions.push({ id: { equals: searchTerm } })
    }
    
    // Use initialSearchFields from the list for text searching
    const searchFields = list.initialSearchFields || []
    for (const fieldKey of searchFields) {
      const field = list.fields[fieldKey]
      if (field) {
        searchConditions.push({
          [field.path]: {
            contains: searchTerm,
            mode: field.search === "insensitive" ? "insensitive" : "insensitive", // Default to insensitive
          },
        })
      }
    }

    if (searchConditions.length > 0) {
      whereConditions.push({ OR: searchConditions })
    }
  }

  // Build map of possible filters using server-side mappings
  const possibleFilters: Record<string, { type: string; field: string; fieldPath: string; fieldMeta: any }> = {}
  
  for (const [fieldPath, field] of Object.entries(list.fields)) {
    const typedField = field as any
    if (typeof typedField.viewsIndex === 'number') {
      try {
        const fieldType = getFieldTypeFromViewsIndex(typedField.viewsIndex)
        const filterMapping = getFieldFilterMapping(fieldType, typedField.fieldMeta)
        
        if (filterMapping) {
          for (const filterType in filterMapping.types) {
            possibleFilters[`!${fieldPath}_${filterType}`] = {
              type: filterType,
              field: fieldType,
              fieldPath,
              fieldMeta: typedField.fieldMeta,
            }
          }
        }
      } catch (error) {
        // Skip fields with invalid viewsIndex
        continue
      }
    }
  }
  
  // Parse filters from search params - exact Keystone logic
  const filters: Filter[] = []
  for (const key in searchParams) {
    if (key === 'search') continue // Skip search param, already handled above
    
    const filter = possibleFilters[key]
    if (!filter) continue
    
    const val = searchParams[key]
    if (typeof val !== 'string') continue
    
    try {
      const value = JSON.parse(val)
      filters.push({ ...filter, value })
    } catch (err) {
      // Skip invalid JSON values
      continue
    }
  }
  
  // Convert filters to GraphQL where clause using server-side mappings
  const filterConditions = filters.map(filter => {
    const filterMapping = getFieldFilterMapping(filter.field)
    if (!filterMapping) return {}
    
    return filterMapping.graphql(filter.fieldPath, filter.fieldMeta)({
      type: filter.type,
      value: filter.value,
    })
  }).filter(condition => Object.keys(condition).length > 0)
  
  // Add filter conditions to whereConditions
  whereConditions.push(...filterConditions)
  
  // Return combined where clause
  if (whereConditions.length === 0) {
    return {}
  }
  
  if (whereConditions.length === 1) {
    return whereConditions[0]
  }
  
  return { AND: whereConditions }
}