import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getGraphQLEndpoint } from "@/features/dashboard/lib/getBaseUrl";
import { GraphQLClient, ClientError } from 'graphql-request';

const basePath = "/dashboard";

// Create a GraphQL client for middleware with explicit headers
async function createMiddlewareGraphQLClient(headers: Record<string, string>): Promise<GraphQLClient> {
  const endpoint = await getGraphQLEndpoint();
  return new GraphQLClient(endpoint, {
    credentials: 'include',
    headers,
  });
}

// Format GraphQL errors (adapted from dashboard keystoneClient)
function formatGraphQLErrors(error: ClientError): { message: string; errors?: any[] } {
  if (!error.response) {
    return { message: error.message };
  }

  const errors = error.response.errors;
  if (!errors) {
    return { message: error.message };
  }

  const message = errors
    .map((err: any) => err.message)
    .join('\n');

  return { 
    message,
    errors: errors 
  };
}

// Lightweight check for redirectToInit status only
export async function checkInitStatus(request: NextRequest) {
  const query = `
    query redirectToInit {
      redirectToInit
    }
  `;

  const headers = {
    cookie: request.headers.get("cookie") || "",
  };

  try {
    const client = await createMiddlewareGraphQLClient(headers);
    const data = await client.request(query) as { redirectToInit: boolean };
    return data.redirectToInit;
  } catch (error) {
    console.error("Error checking init status:", error);
    return false;
  }
}

// Get authenticated user from the request (adapted for dashboard)
export async function getAuthenticatedUser(request: NextRequest) {
  const query = `
    query authenticatedItem {
      authenticatedItem {
        ... on User {
          id
          role {
            canAccessDashboard
          }
        }
      }
      redirectToInit
    }
  `;

  const headers = {
    cookie: request.headers.get("cookie") || "",
  };

  try {
    const client = await createMiddlewareGraphQLClient(headers);
    const data = await client.request(query) as { 
      authenticatedItem: any; 
      redirectToInit: boolean 
    };
    
    return {
      user: data.authenticatedItem,
      redirectToInit: data.redirectToInit
    };
  } catch (error) {
    console.error("Auth check failed:", error);
    
    if (error instanceof ClientError) {
      const { message } = formatGraphQLErrors(error);
      console.error("GraphQL error details:", message);
    }
    
    return { user: null, redirectToInit: false };
  }
}

// Handles authentication and access control for dashboard routes
export async function handleDashboardRoutes(
  request: NextRequest, 
  user: any,
  redirectToInit: boolean
) {
  const pathname = request.nextUrl.pathname;
  
  // Only handle dashboard routes
  if (!pathname.startsWith(basePath)) {
    return null;
  }
  
  const isInitRoute = pathname.startsWith(`${basePath}/init`);
  const isSigninRoute = pathname.startsWith(`${basePath}/signin`);
  const isNoAccessRoute = pathname.startsWith(`${basePath}/no-access`);
  const isResetRoute = pathname.startsWith(`${basePath}/reset`);
  const fromPath = request.nextUrl.searchParams.get("from");

  // Handle redirectToInit for dashboard routes
  if (redirectToInit) {
    if (!isInitRoute) {
      return NextResponse.redirect(new URL(`${basePath}/init`, request.url));
    }
    return NextResponse.next();
  }

  // Prevent access to init page if not needed (when redirectToInit is false)
  if (isInitRoute && !redirectToInit) {
    return NextResponse.redirect(new URL(basePath, request.url));
  }

  // Handle unauthenticated users
  if (!user && !isSigninRoute && !isResetRoute) {
    const signinUrl = new URL(`${basePath}/signin`, request.url);
    if (!isNoAccessRoute) {
      signinUrl.searchParams.set("from", request.nextUrl.pathname);
    }
    return NextResponse.redirect(signinUrl);
  }

  // Handle authenticated users trying to access signin
  if (user && (isSigninRoute || isResetRoute)) {
    if (fromPath && !fromPath.includes("no-access")) {
      return NextResponse.redirect(new URL(fromPath, request.url));
    }
    return NextResponse.redirect(new URL(basePath, request.url));
  }

  // Check role permissions
  if (user && !isNoAccessRoute && !user.role?.canAccessDashboard) {
    return NextResponse.redirect(new URL(`${basePath}/no-access`, request.url));
  }

  return NextResponse.next();
}