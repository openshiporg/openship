import { handleDashboardRoutes, getAuthenticatedUser } from '@/features/dashboard/middleware';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get authenticated user once
  const { user, redirectToInit } = await getAuthenticatedUser(request);
  
  // Let dashboard handler manage its routes
  const dashboardResponse = await handleDashboardRoutes(request, user, redirectToInit);
  if (dashboardResponse) return dashboardResponse;
  
  // Continue with existing middleware logic {
  // Add any middleware logic here if needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.svg (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.svg).*)',
  ],
};