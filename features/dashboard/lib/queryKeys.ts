/**
 * React Query Key Factory
 * Hierarchical query keys for easy invalidation and type safety
 */

export const queryKeys = {
  // Admin Meta (Global)
  adminMeta: ['admin-meta'] as const,
  list: (listKey: string) => ['admin-meta', 'list', listKey] as const,

  // Lists
  lists: {
    all: ['lists'] as const,
    list: (listKey: string) => ['lists', listKey] as const,
    items: (listKey: string, filters?: any) =>
      ['lists', listKey, 'items', filters] as const,
    count: (listKey: string) => ['lists', listKey, 'count'] as const,
  },

  // Items
  items: {
    all: ['items'] as const,
    item: (listKey: string, id: string) => ['items', listKey, id] as const,
    validation: (listKey: string, id: string) =>
      ['items', listKey, id, 'validation'] as const,
  },

  // Relationships
  relationships: {
    all: ['relationships'] as const,
    options: (listKey: string, filters?: any) =>
      ['relationships', listKey, 'options', filters] as const,
    items: (listKey: string, ids: string[]) =>
      ['relationships', listKey, 'items', ids] as const,
  },

  // Auth
  auth: {
    user: ['auth', 'user'] as const,
  },
} as const
