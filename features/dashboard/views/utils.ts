/**
 * Utility functions for field views
 */

/**
 * Safely stringify any value, handling BigInt and other non-serializable types
 */
export function safeStringify(value: any): string {
  if (value === null || value === undefined) {
    return String(value)
  }
  
  if (typeof value === 'bigint') {
    return value.toString()
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  
  try {
    return JSON.stringify(value)
  } catch (error) {
    // Fallback for any other non-serializable types
    return String(value)
  }
}