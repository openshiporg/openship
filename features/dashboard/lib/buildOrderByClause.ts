import { getSortFromSearchParams } from './sort';

export function buildOrderByClause(list: any, searchParams: Record<string, any>) {
  const sort = getSortFromSearchParams(list, searchParams);
  
  // getSortFromSearchParams now always returns a value
  return [{
    [sort.field]: sort.direction
  }];
}