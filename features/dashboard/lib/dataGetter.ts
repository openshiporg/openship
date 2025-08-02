// Simple data getter that works with our item data structure
export interface DataGetter<T> {
  get: (key: string) => {
    data: any;
    errors?: any[];
  };
  data: T;
  errors?: any[];
}

export function makeDataGetter<T extends Record<string, any>>(item: T): DataGetter<T> {
  return {
    data: item,
    errors: undefined,
    get: (key: string) => ({
      data: item[key],
      errors: undefined,
    }),
  };
}