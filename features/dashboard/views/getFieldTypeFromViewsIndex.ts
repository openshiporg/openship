/**
 * Field type mapping from views index with fallback system
 * Priority: 1) Import from Keystone feature slice, 2) Environment variable
 */

/**
 * Get the field type from a field's viewsIndex
 * @param viewsIndex The views index of the field
 * @returns The field type name
 */
export function getFieldTypeFromViewsIndex(viewsIndex: number): string {
  let viewOrder: string[];

  // First try to import from Keystone feature slice
  try {
    const { VIEW_ORDER } = require('@/features/keystone/view-order');
    viewOrder = VIEW_ORDER;
  } catch (error) {
    // Fallback to environment variable
    const viewOrderEnv = process.env.NEXT_PUBLIC_VIEW_ORDER;
    if (!viewOrderEnv) {
      throw new Error('Neither Keystone view-order.ts nor NEXT_PUBLIC_VIEW_ORDER environment variable is available');
    }

    try {
      viewOrder = JSON.parse(viewOrderEnv);
    } catch (parseError) {
      throw new Error('NEXT_PUBLIC_VIEW_ORDER environment variable must be a valid JSON array');
    }
  }

  // Create mapping with "id" at index 0, followed by the view order
  const fieldTypes = ['id', ...viewOrder];
  
  const fieldType = fieldTypes[viewsIndex];
  if (!fieldType) {
    throw new Error(`Invalid views index: ${viewsIndex}. Available indices: 0-${fieldTypes.length - 1}`);
  }

  return fieldType;
}