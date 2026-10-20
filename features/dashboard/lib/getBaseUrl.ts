import { headers } from "next/headers";

/**
 * Get the base URL for the application dynamically
 * Works both server-side and client-side without requiring environment variables
 */

export async function getBaseUrl(): Promise<string> {
  // Client-side: use window.location
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server-side: try to get from headers
  if (typeof process !== 'undefined') {
    try {
      // Import headers from next/headers (only works in app directory)
      const headersList = await headers();
      
      // Try x-forwarded-host first (common in production deployments)
      const host = headersList.get('x-forwarded-host') || headersList.get('host');
      const protocol = headersList.get('x-forwarded-proto') || 'https';
      
      if (host) {
        return `${protocol}://${host}`;
      }
    } catch (e) {
      // headers() might not be available in all contexts (e.g., API routes)
      // Fall through to default
    }
  }

  // Production fallback - return empty string and let relative URLs work
  return '';
}

/**
 * Get the GraphQL endpoint URL
 */
export async function getGraphQLEndpoint(): Promise<string> {
  const baseUrl = await getBaseUrl();
  return `${baseUrl}/api/graphql`;
}