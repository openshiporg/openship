/**
 * Get List Counts - dashboard server action to fetch item counts for all lists
 * Matches Dashboard1 implementation but uses dashboard's keystoneClient
 */

'use server'

import { keystoneClient } from '../lib/keystoneClient'

export async function getListCounts(
  lists: Array<{
    key: string;
    isSingleton?: boolean;
    graphql?: {
      names: {
        listQueryCountName: string;
      };
    };
  }>
) {
  try {
    // Skip counting for singleton lists
    const listsToCount = lists.filter((list) => !list.isSingleton)

    if (listsToCount.length === 0) return { success: true, data: {} }

    // Build a query to get counts for all non-singleton lists at once
    const countQueries = listsToCount.map((list) => {
      const countName = list.graphql?.names?.listQueryCountName
      return `${list.key}: ${countName}`
    })

    const query = `query GetListCounts { ${countQueries.join('\n')} }`
    
    const response = await keystoneClient(
      query,
      {},
      {
        next: {
          revalidate: 60, // Cache for 1 minute since counts change frequently
          tags: ['list-counts'],
        },
      }
    )

    return response
  } catch (error: unknown) {
    console.error('Error fetching list counts:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error fetching list counts'
    return { success: false, error: errorMessage }
  }
}