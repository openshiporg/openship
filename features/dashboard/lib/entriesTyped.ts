/**
 * Utility function from Keystone core - creates typed entries from an object
 * This is needed for parseGraphQL functions in field controllers
 */
export function entriesTyped<T extends Record<string, any>>(obj: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>
}