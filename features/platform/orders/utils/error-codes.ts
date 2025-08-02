/**
 * Error code types for cart items and orders
 */
export enum ErrorType {
  PRICE_CHANGE = 'PRICE_CHANGE',
  ORDER_PLACEMENT_ERROR = 'ORDER_PLACEMENT_ERROR', 
  MATCH_ERROR = 'MATCH_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error information structure
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  title: string;
  actions: ErrorAction[];
}

/**
 * Available error actions
 */
export interface ErrorAction {
  type: 'dismiss' | 'update_price' | 'retry' | 'check_settings';
  label: string;
  variant?: 'default' | 'outline' | 'destructive';
  primary?: boolean;
}

/**
 * Parse error string to extract error type and message
 */
export function parseErrorString(errorString: string): ErrorInfo {
  // Check for error code prefix
  const parts = errorString.split(': ', 2);
  
  if (parts.length === 2) {
    const [typeString, message] = parts;
    const type = typeString as ErrorType;
    
    switch (type) {
      case ErrorType.PRICE_CHANGE:
        return {
          type: ErrorType.PRICE_CHANGE,
          message,
          title: 'Price Change Detected',
          actions: [
            { type: 'dismiss', label: 'Dismiss', variant: 'outline' },
            { type: 'update_price', label: 'Update Price', variant: 'default', primary: true },
          ],
        };
        
      case ErrorType.ORDER_PLACEMENT_ERROR:
        return {
          type: ErrorType.ORDER_PLACEMENT_ERROR,
          message,
          title: 'Order Placement Error',
          actions: [
            { type: 'dismiss', label: 'Dismiss', variant: 'outline' },
            { type: 'retry', label: 'Retry', variant: 'default', primary: true },
          ],
        };
        
      case ErrorType.MATCH_ERROR:
        return {
          type: ErrorType.MATCH_ERROR,
          message,
          title: 'Match Error',
          actions: [
            { type: 'dismiss', label: 'Dismiss', variant: 'outline' },
          ],
        };
        
      case ErrorType.NETWORK_ERROR:
        return {
          type: ErrorType.NETWORK_ERROR,
          message,
          title: 'Connection Error',
          actions: [
            { type: 'dismiss', label: 'Dismiss', variant: 'outline' },
            { type: 'retry', label: 'Retry', variant: 'default', primary: true },
          ],
        };
    }
  }
  
  // Fallback for legacy errors or unknown format
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: errorString,
    title: 'Error',
    actions: [
      { type: 'dismiss', label: 'Dismiss', variant: 'outline' },
    ],
  };
}

/**
 * Check if error is of a specific type
 */
export function isErrorType(errorString: string, type: ErrorType): boolean {
  return errorString.startsWith(`${type}:`);
}

/**
 * Extract message from error string (without the error code prefix)
 */
export function extractErrorMessage(errorString: string): string {
  const parts = errorString.split(': ', 2);
  return parts.length === 2 ? parts[1] : errorString;
}

/**
 * Extract price change details from error message
 * Handles both new format and legacy format
 */
export function extractPriceChangeDetails(errorString: string): { oldPrice: string; newPrice: string } | null {
  // Try new format first: "PRICE_CHANGE: Price changed: $32.00 → $35.00. Verify before placing order."
  let match = errorString.match(/PRICE_CHANGE: Price changed: (.+) → (.+)\. Verify before placing order\./);
  
  if (match) {
    return { oldPrice: match[1], newPrice: match[2] };
  }
  
  // Try legacy format: "Price changed: $32.00 → $35.00. Verify before placing order."
  match = errorString.match(/Price changed: (.+) → (.+)\. Verify before placing order\./);
  
  if (match) {
    return { oldPrice: match[1], newPrice: match[2] };
  }
  
  return null;
}