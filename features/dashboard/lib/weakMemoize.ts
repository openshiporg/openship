// Simple weak memoization implementation
export function weakMemoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new WeakMap();
  
  return ((...args: Parameters<T>) => {
    // Use first argument as cache key if it's an object
    const key = args[0];
    if (typeof key === 'object' && key !== null) {
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }
    
    // For non-object keys, just call the function
    return fn(...args);
  }) as T;
}