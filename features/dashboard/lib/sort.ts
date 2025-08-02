export function getSortFromSearchParams(list: any, searchParams: Record<string, any>) {
  // First check if there's a sort parameter in the URL
  if (searchParams.sortBy) {
    const sortBy = searchParams.sortBy.toString();
    let field = sortBy;
    let direction = 'asc';
    
    // Handle negative sort (descending)
    if (sortBy.startsWith('-')) {
      field = sortBy.slice(1);
      direction = 'desc';
    }
    
    // Check if the field is orderable
    const fieldConfig = list.fields?.[field];
    if (fieldConfig?.isOrderable) {
      return { field, direction };
    }
  }
  
  // Fallback to list's initialSort if available
  if (list.initialSort) {
    const { field, direction } = list.initialSort;
    
    // Verify the field is still orderable
    const fieldConfig = list.fields?.[field];
    if (fieldConfig?.isOrderable) {
      return { 
        field, 
        direction: direction.toLowerCase() as 'asc' | 'desc' 
      };
    }
  }
  
  // Fallback to first orderable field, preferring common timestamp fields
  const preferredFields = ['createdAt', 'updatedAt', 'timestamp', 'date', 'id'];
  
  for (const fieldName of preferredFields) {
    const fieldConfig = list.fields?.[fieldName];
    if (fieldConfig?.isOrderable) {
      return { 
        field: fieldName, 
        direction: fieldName === 'id' ? 'asc' : 'desc' 
      };
    }
  }
  
  // Last resort: find any orderable field
  if (list.fields) {
    for (const [fieldName, fieldConfig] of Object.entries(list.fields)) {
      if ((fieldConfig as any)?.isOrderable) {
        return { field: fieldName, direction: 'asc' };
      }
    }
  }
  
  // If no orderable fields found, fall back to id (which should always exist)
  // This matches Keystone's default behavior
  return { field: 'id', direction: 'asc' };
}